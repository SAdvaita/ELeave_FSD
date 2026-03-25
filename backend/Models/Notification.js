import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['leave_applied', 'leave_approved', 'leave_rejected', 'leave_cancelled', 'leave_pending', 'balance_low', 'holiday', 'general'],
        default: 'general'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedLeaveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Leave',
        default: null
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
