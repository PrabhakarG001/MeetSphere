import { useState } from 'react';
import { copyInviteLink } from '../utils/meetingHelpers';

export const useMeetingControls = () => {
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [inviteCopied, setInviteCopied] = useState(false);

    const handleEndCall = (localStreamRef, localVideoref) => {
        try {
            let tracks = localStreamRef.current?.getTracks() || localVideoref.current?.srcObject?.getTracks();
            tracks?.forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }
        window.location.href = "/";
    };

    const handleCopyInviteLink = (setMediaError) => {
        copyInviteLink(setInviteCopied, setMediaError);
    };

    return {
        askForUsername,
        setAskForUsername,
        username,
        setUsername,
        inviteCopied,
        handleEndCall,
        handleCopyInviteLink
    };
};
