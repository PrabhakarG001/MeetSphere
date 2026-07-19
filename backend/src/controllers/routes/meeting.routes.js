import { Router } from "express";
import { Meeting } from "../models/meetings.model.js";
import { User } from "../models/user.model.js";

const router = Router();

// Middleware to check authentication for creating meetings
// We'll simulate auth check or import it if there's a middleware.
// For now, the user ID will be passed in the body since it's a simple setup.
// In a real production system, you'd use a verifyJWT middleware.

// Helper to generate a random room code like 8f92-kd73-xp21
const generateMeetingCode = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}-${s4()}-${s4()}`;
};

router.post("/create", async (req, res) => {
    try {
        let { userId, settings } = req.body;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const user = await User.findOne({ token });
            if (user) {
                userId = user._id.toString();
            }
        }
        
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized. Must be logged in to create a meeting." });
        }

        const meetingCode = generateMeetingCode();
        const newMeeting = new Meeting({
            user_id: userId,
            meetingCode,
            settings: settings || { anyoneCanJoin: true, hostApprovalRequired: false }
        });

        await newMeeting.save();
        return res.status(201).json({ meetingCode, message: "Meeting created successfully" });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return res.status(500).json({ message: "Failed to create meeting" });
    }
});

router.get("/validate/:meetingCode", async (req, res) => {
    try {
        const { meetingCode } = req.params;
        const meeting = await Meeting.findOne({ meetingCode });
        
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found", valid: false });
        }

        if (!meeting.isActive) {
            return res.status(403).json({ message: "Meeting has ended", valid: false });
        }

        let isHost = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const user = await User.findOne({ token });
            if (user && meeting.user_id) {
                if (meeting.user_id.toString() === user._id.toString() || 
                    meeting.user_id === user.username || 
                    meeting.user_id === user.name) {
                    isHost = true;
                }
            }
        }

        return res.status(200).json({ 
            message: "Meeting is valid", 
            valid: true, 
            settings: meeting.settings,
            isHost
        });
    } catch (error) {
        console.error("Error validating meeting:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
