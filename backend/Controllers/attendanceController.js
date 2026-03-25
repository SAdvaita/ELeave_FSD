import Attendance from "../Models/Attendance.js";
import Holiday from "../Models/Holiday.js";
import User from "../Models/userModel.js";
import Notification from "../Models/Notification.js";
import WfhRequest from "../Models/WfhRequest.js";

// Helper: check if a date falls on a public holiday
const checkIfHoliday = async (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const holiday = await Holiday.findOne({ date: { $gte: dayStart, $lt: dayEnd } });
    return holiday;
};

export const clockIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already clocked in today
        const existingAttendance = await Attendance.findOne({
            employeeId: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: "You have already clocked in today." });
        }

        // Check if today is a public holiday
        const holiday = await checkIfHoliday(today);
        const isHolidayWork = !!holiday;

        const newAttendance = new Attendance({
            employeeId: userId,
            date: today,
            clockIn: new Date(),
            status: 'present',
            isHolidayWork
        });

        await newAttendance.save();

        const message = isHolidayWork
            ? `Clocked in on holiday (${holiday.name}). You will earn 1 CO leave upon clock-out! 🎉`
            : "Clocked in successfully!";

        res.status(201).json({
            message,
            attendance: newAttendance,
            isHolidayWork,
            holidayName: holiday?.name || null
        });

    } catch (error) {
        console.error("Clock In Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const clockOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            employeeId: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (!attendance) {
            return res.status(400).json({ message: "You have not clocked in today." });
        }

        if (attendance.clockOut) {
            return res.status(400).json({ message: "You have already clocked out today." });
        }

        attendance.clockOut = new Date();

        // Calculate total hours
        const diff = attendance.clockOut - attendance.clockIn;
        const hours = diff / (1000 * 60 * 60);
        attendance.totalHours = parseFloat(hours.toFixed(2));

        // ── CO Leave Credit for Holiday Work ──
        let coLeaveMessage = '';
        if (attendance.isHolidayWork && !attendance.coLeaveGranted) {
            // Credit 1 CO leave to the employee
            const employee = await User.findById(userId);
            if (employee) {
                employee.leaveBalances = employee.leaveBalances || {};
                employee.leaveBalances.CO = (employee.leaveBalances.CO || 0) + 1;
                employee.markModified('leaveBalances');
                await employee.save();

                attendance.coLeaveGranted = true;
                coLeaveMessage = ' 🎉 1 Compensatory Off (CO) leave has been credited to your account for working on a holiday!';

                console.log(`✅ CO leave credited to ${employee.name} for holiday work on ${new Date().toDateString()}`);

                // Notify the employee
                const holiday = await checkIfHoliday(today);
                await Notification.create({
                    userId: employee._id,
                    title: 'CO Leave Credited! 🎉',
                    message: `You worked on ${holiday?.name || 'a public holiday'}. 1 Compensatory Off (CO) leave has been added to your balance. New CO balance: ${employee.leaveBalances.CO} days.`,
                    type: 'general'
                });
            }
        }

        await attendance.save();

        res.status(200).json({
            message: `Clocked out successfully!${coLeaveMessage}`,
            attendance,
            coLeaveGranted: attendance.coLeaveGranted
        });

    } catch (error) {
        console.error("Clock Out Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            employeeId: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        res.status(200).json({
            clockedIn: !!attendance,
            clockedOut: !!(attendance && attendance.clockOut),
            attendance
        });

    } catch (error) {
        console.error("Get Status Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get attendance history for current user
export const getMyHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await Attendance.find({ employeeId: userId })
            .sort({ date: -1 })
            .limit(30);

        res.status(200).json({ history });
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all employees attendance (for manager)
export const getAllAttendance = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.find({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        }).populate('employeeId', 'name email');

        res.status(200).json({ attendance });
    } catch (error) {
        console.error("Get All Attendance Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// WFH Selfie Clock-In
export const selfieClockIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if approved WFH for today
        const wfh = await WfhRequest.findOne({
            employeeId: userId,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
            status: 'approved'
        });

        if (!wfh) {
            return res.status(403).json({
                message: "Selfie clock-in is only allowed for approved Work From Home days."
            });
        }

        // Check if already clocked in
        const existing = await Attendance.findOne({
            employeeId: userId,
            date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        });
        if (existing) {
            return res.status(400).json({ message: "You have already clocked in today." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Selfie photo is required for WFH clock-in." });
        }

        const selfieUrl = req.file.path.replace(/\\/g, '/');

        const attendance = new Attendance({
            employeeId: userId,
            date: today,
            clockIn: new Date(),
            status: 'present',
            isWfh: true,
            selfieUrl,
            location: 'Work From Home'
        });
        await attendance.save();

        res.status(201).json({
            message: "WFH Selfie clock-in successful! You're marked as Clocked-In.",
            attendance
        });
    } catch (error) {
        console.error("Selfie Clock-In Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
