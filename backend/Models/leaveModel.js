import mongoose from "mongoose";

const LEAVE_TYPES = ['CL', 'SL', 'EL', 'ML', 'PL', 'CO', 'LWP', 'BL', 'SBL'];

const leaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        enum: LEAVE_TYPES,
        default: 'CL',
        required: true
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"]
    },
    isHalfDay: {
        type: Boolean,
        default: false
    },
    halfDayType: {
        type: String,
        enum: ['first-half', 'second-half', null],
        default: null
    },
    numberOfDays: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: [true, "Reason is required"],
        trim: true
    },
    attachmentUrl: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String,
        default: ''
    },
    // For manager to add notes
    managerNotes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Calculate number of days before saving
leaveSchema.pre("save", function (next) {
    if (this.isNew || this.isModified('startDate') || this.isModified('endDate') || this.isModified('isHalfDay')) {
        if (this.isHalfDay) {
            this.numberOfDays = 0.5;
        } else {
            const start = new Date(this.startDate);
            const end = new Date(this.endDate);
            const diffTime = Math.abs(end - start);
            this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
    }
    next();
});

// Map leave type code to full name
leaveSchema.statics.getLeaveTypeName = function (code) {
    const names = {
        CL: 'Casual Leave',
        SL: 'Sick Leave',
        EL: 'Earned Leave',
        ML: 'Maternity Leave',
        PL: 'Paternity Leave',
        CO: 'Compensatory Off',
        LWP: 'Leave Without Pay',
        BL: 'Bereavement Leave',
        SBL: 'Study/Exam Leave'
    };
    return names[code] || code;
};

const Leave = mongoose.model("Leave", leaveSchema);

export { LEAVE_TYPES };
export default Leave;
