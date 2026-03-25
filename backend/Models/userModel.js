import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'male'
    },
    role: {
        type: String,
        enum: ['employee', 'manager', 'hr'],
        default: 'employee'
    },
    employeeId: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        default: 'General',
        trim: true
    },
    designation: {
        type: String,
        default: 'Employee',
        trim: true
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    phone: {
        type: String,
        default: ''
    },
    // Monthly salary for calculation purposes
    monthlySalary: {
        type: Number,
        default: 30000
    },
    // Per-type leave balance
    leaveBalances: {
        CL: { type: Number, default: 12 },   // Casual Leave
        SL: { type: Number, default: 10 },   // Sick Leave
        EL: { type: Number, default: 15 },   // Earned Leave
        ML: { type: Number, default: 0 },    // Maternity Leave (set based on gender)
        PL: { type: Number, default: 0 },    // Paternity Leave (set based on gender)
        CO: { type: Number, default: 0 },    // Comp-Off (earned by working on holidays)
        LWP: { type: Number, default: 0 },   // Leave Without Pay (unlimited - tracked only)
        BL: { type: Number, default: 3 },    // Bereavement Leave
        SBL: { type: Number, default: 5 }    // Study/Exam Leave
    },
    // Legacy single balance field (kept for backward compatibility)
    leaveBalance: {
        type: Number,
        default: 20
    },
    profilePicture: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
