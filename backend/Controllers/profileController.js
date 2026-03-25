import User from "../Models/userModel.js";

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const userId = req.user.id;
        // Normalize path to use forward slashes for URL compatibility
        const profilePicture = req.file.path.replace(/\\/g, "/");

        const user = await User.findByIdAndUpdate(
            userId,
            { profilePicture },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: "Profile picture updated successfully!",
            user
        });

    } catch (error) {
        console.error("Profile Upload Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
