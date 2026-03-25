import User from "../Models/userModel.js";
import Leave from "../Models/leaveModel.js";

// Helper: count working days in a month (excluding weekends)
const getWorkingDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month, d).getDay();
        if (day !== 0 && day !== 6) count++; // Exclude Sun=0 and Sat=6
    }
    return count;
};

// GET /salary/my-salary?month=1&year=2026
export const getMySalary = async (req, res) => {
    try {
        const user = await User.findById(req.user._id || req.user.id).select('name monthlySalary leaveBalances gender department designation');
        if (!user) return res.status(404).json({ message: "User not found" });

        const now = new Date();
        const month = parseInt(req.query.month ?? now.getMonth());      // 0-indexed
        const year = parseInt(req.query.year ?? now.getFullYear());

        const baseSalary = user.monthlySalary || 30000;
        const workingDays = getWorkingDaysInMonth(year, month);

        // Find all approved LWP leaves for this month
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        const lwpLeaves = await Leave.find({
            employeeId: req.user._id,
            leaveType: 'LWP',
            status: 'approved',
            $or: [
                { startDate: { $gte: monthStart, $lte: monthEnd } },
                { endDate: { $gte: monthStart, $lte: monthEnd } },
                { startDate: { $lte: monthStart }, endDate: { $gte: monthEnd } }
            ]
        });

        // Count LWP days falling within this month
        let lwpDays = 0;
        for (const leave of lwpLeaves) {
            const start = new Date(Math.max(leave.startDate, monthStart));
            const end = new Date(Math.min(leave.endDate, monthEnd));
            // Count working days in the LWP range
            let d = new Date(start);
            while (d <= end) {
                const dow = d.getDay();
                if (dow !== 0 && dow !== 6) lwpDays++;
                d.setDate(d.getDate() + 1);
            }
        }

        const perDaySalary = baseSalary / workingDays;
        const lwpDeduction = parseFloat((perDaySalary * lwpDays).toFixed(2));
        const netSalary = parseFloat((baseSalary - lwpDeduction).toFixed(2));

        const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long' });

        res.status(200).json({
            salary: {
                employeeName: user.name,
                department: user.department,
                designation: user.designation,
                month: monthName,
                year,
                baseSalary,
                workingDaysInMonth: workingDays,
                lwpDaysTaken: lwpDays,
                perDaySalary: parseFloat(perDaySalary.toFixed(2)),
                lwpDeduction,
                netSalary,
                coBalance: user.leaveBalances?.CO || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /salary/all-salaries (Manager/HR only)
export const getAllSalaries = async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month ?? now.getMonth());
        const year = parseInt(req.query.year ?? now.getFullYear());

        const employees = await User.find({ role: 'employee', isActive: true })
            .select('name email department designation monthlySalary leaveBalances');

        const workingDays = getWorkingDaysInMonth(year, month);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        const results = await Promise.all(employees.map(async (emp) => {
            const lwpLeaves = await Leave.find({
                employeeId: emp._id,
                leaveType: 'LWP',
                status: 'approved',
                $or: [
                    { startDate: { $gte: monthStart, $lte: monthEnd } },
                    { endDate: { $gte: monthStart, $lte: monthEnd } },
                    { startDate: { $lte: monthStart }, endDate: { $gte: monthEnd } }
                ]
            });

            let lwpDays = 0;
            for (const leave of lwpLeaves) {
                const start = new Date(Math.max(leave.startDate, monthStart));
                const end = new Date(Math.min(leave.endDate, monthEnd));
                let d = new Date(start);
                while (d <= end) {
                    const dow = d.getDay();
                    if (dow !== 0 && dow !== 6) lwpDays++;
                    d.setDate(d.getDate() + 1);
                }
            }

            const baseSalary = emp.monthlySalary || 30000;
            const perDaySalary = baseSalary / workingDays;
            const lwpDeduction = parseFloat((perDaySalary * lwpDays).toFixed(2));
            const netSalary = parseFloat((baseSalary - lwpDeduction).toFixed(2));

            return {
                employeeId: emp._id,
                name: emp.name,
                email: emp.email,
                department: emp.department,
                designation: emp.designation,
                baseSalary,
                lwpDaysTaken: lwpDays,
                lwpDeduction,
                netSalary
            };
        }));

        const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long' });
        res.status(200).json({ salaries: results, month: monthName, year, workingDaysInMonth: workingDays });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
