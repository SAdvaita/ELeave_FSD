import Leave from "../Models/leaveModel.js";
import User from "../Models/userModel.js";

const LEAVE_TYPE_NAMES = {
    CL: 'Casual Leave', SL: 'Sick Leave', EL: 'Earned Leave',
    ML: 'Maternity Leave', PL: 'Paternity Leave', CO: 'Compensatory Off',
    LWP: 'Leave Without Pay', BL: 'Bereavement Leave', SBL: 'Study/Exam Leave'
};

// Overview stats (Manager)
export const getOverviewStats = async (req, res) => {
    try {
        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const totalLeaves = await Leave.countDocuments();
        const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
        const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
        const rejectedLeaves = await Leave.countDocuments({ status: 'rejected' });

        // Leave type distribution
        const typeDistribution = await Leave.aggregate([
            { $group: { _id: '$leaveType', count: { $sum: 1 }, totalDays: { $sum: '$numberOfDays' } } },
            { $sort: { count: -1 } }
        ]);

        // Monthly leave trend (current year)
        const currentYear = new Date().getFullYear();
        const monthlyTrend = await Leave.aggregate([
            { $match: { createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) } } },
            { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Department-wise leaves
        const deptLeaves = await Leave.aggregate([
            { $lookup: { from: 'users', localField: 'employeeId', foreignField: '_id', as: 'employee' } },
            { $unwind: '$employee' },
            { $group: { _id: '$employee.department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            totalEmployees, totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves,
            typeDistribution: typeDistribution.map(t => ({ ...t, name: LEAVE_TYPE_NAMES[t._id] || t._id })),
            monthlyTrend,
            deptLeaves
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Employee leave history report
export const getEmployeeLeaveReport = async (req, res) => {
    try {
        const { employeeId, startDate, endDate, leaveType } = req.query;
        let filter = {};
        if (employeeId) filter.employeeId = employeeId;
        if (leaveType) filter.leaveType = leaveType;
        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) filter.startDate.$gte = new Date(startDate);
            if (endDate) filter.startDate.$lte = new Date(endDate);
        }

        const leaves = await Leave.find(filter)
            .populate('employeeId', 'name email department designation')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ leaves, count: leaves.length });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Leave balance report for all employees
export const getBalanceReport = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' })
            .select('name email department designation leaveBalances leaveBalance')
            .sort({ department: 1, name: 1 });

        res.status(200).json({ employees });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
