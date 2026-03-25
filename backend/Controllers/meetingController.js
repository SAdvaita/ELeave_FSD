import Meeting from "../Models/Meeting.js";
import User from "../Models/userModel.js";
import Notification from "../Models/Notification.js";
import crypto from "crypto";

// Generate a unique room name
const generateRoomName = (title) => {
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const rand = crypto.randomBytes(4).toString('hex');
    return `eleave-${slug}-${rand}`;
};

// Manager: Schedule a new meeting
export const scheduleMeeting = async (req, res) => {
    try {
        const { title, description, scheduledAt, participantIds, leaveRequestId } = req.body;
        const managerId = req.user.id;

        if (!title || !scheduledAt) {
            return res.status(400).json({ message: "Title and scheduled time are required" });
        }

        const roomName = generateRoomName(title);

        const meeting = await Meeting.create({
            title,
            description: description || '',
            scheduledAt: new Date(scheduledAt),
            roomName,
            createdBy: managerId,
            participants: participantIds || [],
            leaveRequestId: leaveRequestId || null
        });

        // Notify all participants
        if (participantIds && participantIds.length > 0) {
            for (const pid of participantIds) {
                await Notification.create({
                    userId: pid,
                    title: '📹 Meeting Scheduled',
                    message: `A meeting "${title}" has been scheduled for ${new Date(scheduledAt).toLocaleString('en-IN')}. Click to join.`,
                    type: 'general'
                });
            }
        }

        await meeting.populate('createdBy', 'name');
        res.status(201).json({ message: "Meeting scheduled successfully", meeting });
    } catch (error) {
        console.error("Schedule Meeting Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all meetings (manager sees all, employee sees theirs)
export const getMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = {};
        if (userRole !== 'manager') {
            // Employees see meetings they're participants of
            query = { $or: [{ participants: userId }, { createdBy: userId }] };
        }

        const meetings = await Meeting.find(query)
            .sort({ scheduledAt: -1 })
            .populate('createdBy', 'name email')
            .populate('participants', 'name email department');

        res.status(200).json({ meetings });
    } catch (error) {
        console.error("Get Meetings Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get meeting by ID (for joining)
export const getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('participants', 'name email');
        if (!meeting) return res.status(404).json({ message: "Meeting not found" });
        res.status(200).json({ meeting });
    } catch (error) {
        console.error("Get Meeting Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete meeting
export const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findByIdAndDelete(req.params.id);
        if (!meeting) return res.status(404).json({ message: "Meeting not found" });
        res.status(200).json({ message: "Meeting deleted" });
    } catch (error) {
        console.error("Delete Meeting Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all employees list (for selecting participants)
export const getEmployeesList = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('name email department designation');
        res.status(200).json({ employees });
    } catch (error) {
        console.error("Get Employees Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
