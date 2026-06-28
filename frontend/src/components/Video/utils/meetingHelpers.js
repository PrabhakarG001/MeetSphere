export const isLocalSecureContext = () => {
    const hostname = window.location.hostname;
    return window.isSecureContext || hostname === "localhost" || hostname === "127.0.0.1";
};

export const copyInviteLink = async (setInviteCopied, setMediaError) => {
    // Extract the meeting code from the URL path (e.g., /meet-abc-123 -> meet-abc-123)
    const meetingCode = window.location.pathname.split('/').filter(Boolean).pop();

    try {
        await navigator.clipboard.writeText(meetingCode);
        setInviteCopied(true);
        window.setTimeout(() => setInviteCopied(false), 1800);
    } catch (error) {
        console.error("Could not copy invite link", error);
        if (setMediaError) {
            setMediaError("Could not copy the meeting code.");
        }
    }
};
