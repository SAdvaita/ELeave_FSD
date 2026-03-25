import User from "../Models/userModel.js";
import generateToken from "../Utils/generateToken.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../Utils/emailService.js";

// In-memory OTP store: { email -> { otp, expiresAt } }
// Fine for single-server dev; swap for Redis in production
const otpStore = new Map();

// ──────────────────────────────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }
        const { department, designation, phone, gender = 'male', monthlySalary } = req.body;
        const empIdNum = Math.floor(1000 + Math.random() * 9000);
        const employeeId = `EMP-${empIdNum}`;

        // Set ML/PL leave balances based on gender
        const leaveBalances = {
            CL: 12, SL: 10, EL: 15,
            ML: gender === 'female' ? 90 : 0,   // Maternity: only for female
            PL: gender === 'male' ? 15 : 0,     // Paternity: only for male
            CO: 0,
            LWP: 0,
            BL: 3,
            SBL: 5
        };

        const newUser = await User.create({
            name, email, password,
            role: role || 'employee',
            gender,
            department: department || 'General',
            designation: designation || 'Employee',
            phone: phone || '',
            employeeId,
            leaveBalances,
            monthlySalary: monthlySalary || 30000
        });
        generateToken(newUser._id, res);
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                gender: newUser.gender,
                employeeId: newUser.employeeId,
                department: newUser.department,
                designation: newUser.designation,
                leaveBalance: newUser.leaveBalance,
                leaveBalances: newUser.leaveBalances,
                monthlySalary: newUser.monthlySalary,
                profilePicture: newUser.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        generateToken(user._id, res);
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                gender: user.gender,
                employeeId: user.employeeId,
                department: user.department,
                designation: user.designation,
                leaveBalance: user.leaveBalance,
                leaveBalances: user.leaveBalances,
                monthlySalary: user.monthlySalary,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────
// LOGOUT
// ──────────────────────────────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────
// GET PROFILE
// ──────────────────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                gender: user.gender,
                employeeId: user.employeeId,
                department: user.department,
                designation: user.designation,
                leaveBalance: user.leaveBalance,
                leaveBalances: user.leaveBalances,
                monthlySalary: user.monthlySalary,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────
// STEP 1 – FORGOT PASSWORD: Send OTP to email
// ──────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        // Always respond the same way to avoid leaking whether email exists
        if (!user) {
            return res.status(200).json({
                message: "If that email is registered, an OTP has been sent to it."
            });
        }
        // Generate 6-digit OTP, expires in 10 minutes
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
        otpStore.set(user.email, { otp, expiresAt });

        // Always log to console as fallback
        console.log(`\n🔑 Password Reset OTP for ${user.email}: ${otp}\n`);

        // Send real email
        try {
            await sendPasswordResetEmail(user.email, otp, user.name);
            console.log(`📧 OTP email sent successfully to ${user.email}`);
        } catch (emailErr) {
            console.error(`❌ Email sending failed:`, emailErr.message);
            // Still respond with success – OTP is in console as backup
        }

        res.status(200).json({
            message: "OTP sent to your registered email address. Check your inbox (and spam folder)."
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────
// STEP 2 – VERIFY OTP
// ──────────────────────────────────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        const record = otpStore.get(email.toLowerCase().trim());
        if (!record) {
            return res.status(400).json({ message: "No OTP found. Please request a new one." });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }
        if (record.otp !== otp.trim()) {
            return res.status(400).json({ message: "Incorrect OTP. Please check your email and try again." });
        }
        // OTP valid — mark it as verified (allow password reset for next 10 min)
        otpStore.set(email.toLowerCase().trim(), { ...record, verified: true, verifiedAt: Date.now() });
        res.status(200).json({ message: "OTP verified successfully." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ──────────────────────────────────────────────────────────────────────────
// STEP 3 – RESET PASSWORD
// ──────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }
        const record = otpStore.get(email.toLowerCase().trim());
        if (!record || !record.verified) {
            return res.status(400).json({ message: "OTP not verified. Please complete OTP verification first." });
        }
        // Check that verification was recent (within 10 min)
        if (Date.now() - record.verifiedAt > 10 * 60 * 1000) {
            otpStore.delete(email);
            return res.status(400).json({ message: "Verification expired. Please start again." });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        user.password = newPassword; // pre-save hook will hash this
        await user.save();
        otpStore.delete(email); // Clean up
        console.log(`✅ Password reset successfully for ${email}`);
        res.status(200).json({ message: "Password reset successfully! You can now log in with your new password." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
