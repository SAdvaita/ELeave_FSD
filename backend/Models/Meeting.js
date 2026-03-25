import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Meeting title is required"],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    scheduledAt: {
        type: Date,
        required: [true, "Meeting date/time is required"]
    },
    roomName: {
        type: String,
        required: true,
        unique: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // optionally link to a leave request
    leaveRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leave',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Meeting = mongoose.model("Meeting", meetingSchema);
export default Meeting;
