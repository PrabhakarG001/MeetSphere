import { useState } from 'react';
import { copyInviteLink } from '../utils/meetingHelpers';

export const useMeetingControls = (socketRef) => {
    // If a token exists, skip the lobby completely. Otherwise, ask for username.
    const [askForUsername, setAskForUsername] = useState(!localStorage.getItem("token"));
    const [username, setUsername] = useState("");
    const [inviteCopied, setInviteCopied] = useState(false);
    
    const [isRaisedHand, setIsRaisedHand] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const handleEndCall = (localStreamRef, localVideoref) => {
        try {
            let tracks = localStreamRef.current?.getTracks() || localVideoref.current?.srcObject?.getTracks();
            tracks?.forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }
        if (socketRef && socketRef.current) {
            socketRef.current.disconnect();
        }
        window.location.href = "/";
    };

    const handleCopyInviteLink = (setMediaError) => {
        copyInviteLink(setInviteCopied, setMediaError);
    };

    const toggleRaiseHand = () => {
        setIsRaisedHand(!isRaisedHand);
        if (socketRef && socketRef.current) {
            socketRef.current.emit("toggle-raise-hand", !isRaisedHand);
        }
    };

    const sendReaction = (emoji) => {
        if (socketRef && socketRef.current) {
            socketRef.current.emit("send-reaction", emoji);
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        // Actual recording logic would go here
    };

    return {
        askForUsername,
        setAskForUsername,
        username,
        setUsername,
        inviteCopied,
        handleEndCall,
        handleCopyInviteLink,
        isRaisedHand,
        toggleRaiseHand,
        sendReaction,
        isRecording,
        toggleRecording,
        showSettingsModal,
        setShowSettingsModal
    };
};
