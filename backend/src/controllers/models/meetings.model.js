import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        user_id: { type: String, required: true },
        meetingCode: { type: String, required: true, unique: true },
        date: { type: Date, default: Date.now, required: true },
        isActive: { type: Boolean, default: true },
        settings: {
            anyoneCanJoin: { type: Boolean, default: true },
            hostApprovalRequired: { type: Boolean, default: false }
        }
    }
)

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting }
