import User from "../Models/userModel.js";

const LEAVE_TYPE_NAMES = {
    CL: 'Casual Leave', SL: 'Sick Leave', EL: 'Earned Leave',
    ML: 'Maternity Leave', PL: 'Paternity Leave', CO: 'Compensatory Off',
    LWP: 'Leave Without Pay', BL: 'Bereavement Leave', SBL: 'Study/Exam Leave'
};

// Get current user's leave balance (all types)
export const getMyBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('name email leaveBalance leaveBalances department designation');
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            balance: {
                name: user.name,
                email: user.email,
                leaveBalance: user.leaveBalance,
                leaveBalances: user.leaveBalances,
                department: user.department,
                designation: user.designation
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get all employees' leave balances (Manager/HR only)
export const getAllBalances = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' })
            .select('name email leaveBalance leaveBalances department designation createdAt')
            .sort({ department: 1, name: 1 });

        res.status(200).json({ employees, count: employees.length });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Manual balance adjustment by HR/Manager
export const adjustBalance = async (req, res) => {
    const { employeeId, leaveType, adjustment, reason } = req.body;
    try {
        if (!employeeId || !leaveType || adjustment === undefined) {
            return res.status(400).json({ message: "employeeId, leaveType, and adjustment are required" });
        }
        const employee = await User.findById(employeeId);
        if (!employee) return res.status(404).json({ message: "Employee not found" });

        if (!employee.leaveBalances) employee.leaveBalances = {};
        const current = employee.leaveBalances[leaveType] ?? 0;
        employee.leaveBalances[leaveType] = Math.max(0, current + Number(adjustment));
        employee.markModified('leaveBalances');
        await employee.save();

        res.status(200).json({
            message: `Leave balance adjusted for ${employee.name}`,
            leaveType,
            previousBalance: current,
            newBalance: employee.leaveBalances[leaveType]
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
