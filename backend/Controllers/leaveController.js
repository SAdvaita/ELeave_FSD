import Leave, { LEAVE_TYPES } from "../Models/leaveModel.js";
import User from "../Models/userModel.js";
import Holiday from "../Models/Holiday.js";
import Notification from "../Models/Notification.js";

const LEAVE_TYPE_NAMES = {
    CL: 'Casual Leave', SL: 'Sick Leave', EL: 'Earned Leave',
    ML: 'Maternity Leave', PL: 'Paternity Leave', CO: 'Compensatory Off',
    LWP: 'Leave Without Pay', BL: 'Bereavement Leave', SBL: 'Study/Exam Leave'
};

// Helper: count working days excluding weekends and holidays
const countWorkingDays = async (start, end) => {
    const holidays = await Holiday.find({
        date: { $gte: start, $lte: end }
    });
    const holidayDates = holidays.map(h => new Date(h.date).toDateString());

    let count = 0;
    const current = new Date(start);
    while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6 && !holidayDates.includes(current.toDateString())) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

// Apply for leave (Employee only)
export const applyLeave = async (req, res) => {
    const { startDate, endDate, reason, leaveType = 'CL', isHalfDay = false, halfDayType } = req.body;

    try {
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!LEAVE_TYPES.includes(leaveType)) {
            return res.status(400).json({ message: "Invalid leave type" });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

        // Check for overlapping approved/pending leaves
        const overlap = await Leave.findOne({
            employeeId: req.user._id,
            status: { $in: ['pending', 'approved'] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        if (overlap) {
            return res.status(400).json({
                message: `You already have a ${overlap.status} leave request that overlaps with the selected dates.`
            });
        }

        // Calculate days (working days excluding weekends/holidays for EL/CL/SL)
        let numberOfDays;
        if (isHalfDay) {
            numberOfDays = 0.5;
        } else {
            numberOfDays = await countWorkingDays(start, end);
            if (numberOfDays === 0) {
                return res.status(400).json({ message: "Selected dates fall on weekends/holidays only." });
            }
        }

        // Check leave balance (skip for LWP)
        const employee = await User.findById(req.user._id);
        if (leaveType !== 'LWP') {
            const currentBalance = employee.leaveBalances[leaveType] ?? 0;
            if (currentBalance < numberOfDays) {
                return res.status(400).json({
                    message: `Insufficient ${LEAVE_TYPE_NAMES[leaveType]} balance. Available: ${currentBalance} days, Requested: ${numberOfDays} days.`,
                    availableBalance: currentBalance,
                    requestedDays: numberOfDays
                });
            }
        }

        // Handle attachment
        let attachmentUrl = '';
        if (req.file) {
            attachmentUrl = req.file.path;
        }

        const newLeave = await Leave.create({
            employeeId: req.user._id,
            startDate: start,
            endDate: end,
            reason,
            leaveType,
            isHalfDay,
            halfDayType: isHalfDay ? halfDayType : null,
            numberOfDays,
            attachmentUrl
        });

        await newLeave.populate('employeeId', 'name email department');

        // Notify managers
        const managers = await User.find({ role: { $in: ['manager', 'hr'] } });
        const notifPromises = managers.map(mgr =>
            Notification.create({
                userId: mgr._id,
                title: 'New Leave Request',
                message: `${employee.name} applied for ${LEAVE_TYPE_NAMES[leaveType]} (${numberOfDays} day${numberOfDays > 1 ? 's' : ''}) from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}.`,
                type: 'leave_applied',
                relatedLeaveId: newLeave._id
            })
        );
        await Promise.all(notifPromises);

        res.status(201).json({ message: "Leave request submitted successfully", leave: newLeave });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get current user's leave requests
export const getMyLeaves = async (req, res) => {
    try {
        const { leaveType, status } = req.query;
        const filter = { employeeId: req.user._id };
        if (leaveType) filter.leaveType = leaveType;
        if (status) filter.status = status;

        const leaves = await Leave.find(filter)
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ leaves, count: leaves.length });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all leave requests (Manager/HR only)
export const getAllLeaves = async (req, res) => {
    try {
        const { status, leaveType, department } = req.query;
        let filter = {};
        if (status && status !== 'all') filter.status = status;
        if (leaveType) filter.leaveType = leaveType;

        let leaves = await Leave.find(filter)
            .populate('employeeId', 'name email leaveBalance leaveBalances department designation')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 });

        if (department) {
            leaves = leaves.filter(l => l.employeeId?.department === department);
        }

        res.status(200).json({ leaves, count: leaves.length });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Approve leave request (Manager/HR only)
export const approveLeave = async (req, res) => {
    const { id } = req.params;
    const { managerNotes } = req.body;

    try {
        const leave = await Leave.findById(id).populate('employeeId');
        if (!leave) return res.status(404).json({ message: "Leave request not found" });
        if (leave.status !== 'pending') return res.status(400).json({ message: `Leave request is already ${leave.status}` });

        const employee = await User.findById(leave.employeeId._id);

        if (leave.leaveType !== 'LWP') {
            const currentBalance = employee.leaveBalances[leave.leaveType] ?? 0;
            if (currentBalance < leave.numberOfDays) {
                return res.status(400).json({
                    message: `Cannot approve. Employee has insufficient ${LEAVE_TYPE_NAMES[leave.leaveType]} balance. Available: ${currentBalance}, Required: ${leave.numberOfDays}`
                });
            }
            employee.leaveBalances[leave.leaveType] = currentBalance - leave.numberOfDays;
            employee.markModified('leaveBalances');
        }

        // Also deduct from legacy balance
        employee.leaveBalance = Math.max(0, (employee.leaveBalance || 0) - leave.numberOfDays);
        await employee.save();

        leave.status = 'approved';
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();
        if (managerNotes) leave.managerNotes = managerNotes;
        await leave.save();
        await leave.populate('reviewedBy', 'name email');

        // Notify employee
        await Notification.create({
            userId: employee._id,
            title: 'Leave Approved ✓',
            message: `Your ${LEAVE_TYPE_NAMES[leave.leaveType]} request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved.`,
            type: 'leave_approved',
            relatedLeaveId: leave._id
        });

        res.status(200).json({ message: "Leave request approved successfully", leave });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reject leave request (Manager/HR only)
export const rejectLeave = async (req, res) => {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    try {
        const leave = await Leave.findById(id).populate('employeeId');
        if (!leave) return res.status(404).json({ message: "Leave request not found" });
        if (leave.status !== 'pending') return res.status(400).json({ message: `Leave request is already ${leave.status}` });

        leave.status = 'rejected';
        leave.reviewedBy = req.user._id;
        leave.reviewedAt = new Date();
        if (rejectionReason) leave.rejectionReason = rejectionReason;
        await leave.save();
        await leave.populate('reviewedBy', 'name email');

        // Notify employee
        await Notification.create({
            userId: leave.employeeId._id,
            title: 'Leave Rejected',
            message: `Your ${LEAVE_TYPE_NAMES[leave.leaveType]} request has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
            type: 'leave_rejected',
            relatedLeaveId: leave._id
        });

        res.status(200).json({ message: "Leave request rejected", leave });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Cancel leave (Employee only - cancel their own pending leave)
export const cancelLeave = async (req, res) => {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    try {
        const leave = await Leave.findOne({ _id: id, employeeId: req.user._id });
        if (!leave) return res.status(404).json({ message: "Leave not found" });

        if (!['pending', 'approved'].includes(leave.status)) {
            return res.status(400).json({ message: `Cannot cancel a ${leave.status} leave` });
        }

        // Restore balance if it was approved
        if (leave.status === 'approved' && leave.leaveType !== 'LWP') {
            const employee = await User.findById(req.user._id);
            employee.leaveBalances[leave.leaveType] = (employee.leaveBalances[leave.leaveType] || 0) + leave.numberOfDays;
            employee.markModified('leaveBalances');
            employee.leaveBalance = (employee.leaveBalance || 0) + leave.numberOfDays;
            await employee.save();
        }

        leave.status = 'cancelled';
        leave.cancelledAt = new Date();
        leave.cancellationReason = cancellationReason || '';
        await leave.save();

        res.status(200).json({ message: "Leave cancelled successfully", leave });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get leave type summary for current user
export const getMyLeaveSummary = async (req, res) => {
    try {
        const leaves = await Leave.find({
            employeeId: req.user._id,
            status: { $in: ['approved', 'pending'] }
        });

        const summary = {};
        LEAVE_TYPES.forEach(type => {
            summary[type] = {
                pending: 0,
                approved: 0,
                name: LEAVE_TYPE_NAMES[type]
            };
        });

        leaves.forEach(l => {
            if (summary[l.leaveType]) {
                summary[l.leaveType][l.status] += l.numberOfDays;
            }
        });

        res.status(200).json({ summary });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export { LEAVE_TYPE_NAMES, LEAVE_TYPES };
