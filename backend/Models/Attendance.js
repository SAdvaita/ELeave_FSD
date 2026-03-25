import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    clockIn: {
        type: Date
    },
    clockOut: {
        type: Date
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'half-day'],
        default: 'present'
    },
    location: {
        type: String,
        default: 'Office'
    },
    totalHours: {
        type: Number,
        default: 0
    },
    isHolidayWork: {
        type: Boolean,
        default: false  // true when employee works on a public holiday
    },
    coLeaveGranted: {
        type: Boolean,
        default: false  // true once CO leave has been credited for this holiday work
    },
    isWfh: {
        type: Boolean,
        default: false  // true if clocked in via WFH (selfie attend)
    },
    selfieUrl: {
        type: String,
        default: ''    // path to selfie image taken during WFH clock-in
    }
}, { timestamps: true });

// Prevent duplicate attendance for same day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
