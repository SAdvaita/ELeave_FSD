import WfhRequest from "../Models/WfhRequest.js";
import Notification from "../Models/Notification.js";
import User from "../Models/userModel.js";

// Employee: Apply for WFH
export const applyWfh = async (req, res) => {
    try {
        const { date, reason } = req.body;
        const userId = req.user.id;

        if (!date || !reason) {
            return res.status(400).json({ message: "Date and reason are required" });
        }

        // Check if already applied for this date
        const existing = await WfhRequest.findOne({
            employeeId: userId,
            date: new Date(date),
            status: { $ne: 'rejected' }
        });
        if (existing) {
            return res.status(400).json({ message: "You already have a WFH request for this date" });
        }

        const wfh = await WfhRequest.create({
            employeeId: userId,
            date: new Date(date),
            reason
        });

        // Notify managers
        const managers = await User.find({ role: 'manager' });
        const employee = await User.findById(userId);
        for (const mgr of managers) {
            await Notification.create({
                userId: mgr._id,
                title: 'New WFH Request',
                message: `${employee.name} has submitted a Work From Home request for ${new Date(date).toLocaleDateString('en-IN')}.`,
                type: 'general'
            });
        }

        res.status(201).json({ message: "WFH request submitted successfully", wfh });
    } catch (error) {
        console.error("Apply WFH Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Employee: Get my WFH requests
export const getMyWfhRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const wfhRequests = await WfhRequest.find({ employeeId: userId })
            .sort({ date: -1 })
            .populate('reviewedBy', 'name');
        res.status(200).json({ wfhRequests });
    } catch (error) {
        console.error("Get WFH Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Manager: Get all WFH requests
export const getAllWfhRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') query.status = status;

        const wfhRequests = await WfhRequest.find(query)
            .sort({ createdAt: -1 })
            .populate('employeeId', 'name email department designation')
            .populate('reviewedBy', 'name');
        res.status(200).json({ wfhRequests });
    } catch (error) {
        console.error("Get All WFH Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Manager: Approve WFH
export const approveWfh = async (req, res) => {
    try {
        const { id } = req.params;
        const managerId = req.user.id;

        const wfh = await WfhRequest.findById(id).populate('employeeId', 'name _id');
        if (!wfh) return res.status(404).json({ message: "WFH request not found" });
        if (wfh.status !== 'pending') {
            return res.status(400).json({ message: "This request has already been reviewed" });
        }

        wfh.status = 'approved';
        wfh.reviewedBy = managerId;
        wfh.reviewedAt = new Date();
        await wfh.save();

        // Notify employee
        await Notification.create({
            userId: wfh.employeeId._id,
            title: '✅ WFH Approved',
            message: `Your Work From Home request for ${new Date(wfh.date).toLocaleDateString('en-IN')} has been approved.`,
            type: 'leave_approved'
        });

        res.status(200).json({ message: "WFH request approved", wfh });
    } catch (error) {
        console.error("Approve WFH Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Manager: Reject WFH
export const rejectWfh = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;
        const managerId = req.user.id;

        const wfh = await WfhRequest.findById(id).populate('employeeId', 'name _id');
        if (!wfh) return res.status(404).json({ message: "WFH request not found" });
        if (wfh.status !== 'pending') {
            return res.status(400).json({ message: "This request has already been reviewed" });
        }

        wfh.status = 'rejected';
        wfh.reviewedBy = managerId;
        wfh.reviewedAt = new Date();
        wfh.rejectionReason = rejectionReason || '';
        await wfh.save();

        await Notification.create({
            userId: wfh.employeeId._id,
            title: '❌ WFH Rejected',
            message: `Your Work From Home request for ${new Date(wfh.date).toLocaleDateString('en-IN')} was rejected. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
            type: 'leave_rejected'
        });

        res.status(200).json({ message: "WFH request rejected", wfh });
    } catch (error) {
        console.error("Reject WFH Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Check if user is approved WFH today
export const checkWfhToday = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const wfh = await WfhRequest.findOne({
            employeeId: userId,
            date: { $gte: today, $lt: tomorrow },
            status: 'approved'
        });

        res.status(200).json({ isWfhToday: !!wfh, wfh });
    } catch (error) {
        console.error("Check WFH Today Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
