import { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import server from "../../../environment";
import '../../styles/Video.css';

import { useMediaDevices } from './hooks/useMediaDevices';
import { useMeetingControls } from './hooks/useMeetingControls';
import { useParticipants } from './hooks/useParticipants';
import { useScreenShare } from './hooks/useScreenShare';
import { useAudio } from './hooks/useAudio';
import { useChat } from './hooks/useChat';

import TopBar from './TopBar';
import VideoGrid from './VideoGrid';
import ControlBar from './ControlBar';
import ChatPanel from './ChatPanel';
import SettingsModal from './SettingsModal';
import Avatar from './Avatar';
import { useNavigate, useLocation } from "react-router-dom";
import { Copy, Check, Share2, X, ShieldCheck } from 'lucide-react';

export default function Video() {
    const { userData } = useContext(AuthContext);
    const joinedWithExistingStreamRef = useRef(false);
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const connectionsRef = useRef({});
    const localVideoref = useRef(null);
    const localStreamRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const initialVideo = location.state?.video !== undefined ? location.state.video : true;
    const initialAudio = location.state?.audio !== undefined ? location.state.audio : true;

    const [showInstantModal, setShowInstantModal] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [copiedLink, setCopiedLink] = useState(false);

    const meetingCode = window.location.pathname.split('/').filter(Boolean).pop() || "";
    const meetingLink = `${window.location.origin}/meeting/${meetingCode}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(meetingLink);
            setCopiedLink(true);
            setToastMessage("Link copied");
            setTimeout(() => setCopiedLink(false), 2500);
            setTimeout(() => setToastMessage(""), 2500);
        } catch (e) {
            console.error("Copy failed:", e);
        }
    };

    const handleShareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Join my MeetSphere meeting",
                    text: "Join my MeetSphere video meeting:",
                    url: meetingLink
                });
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error("Share failed:", e);
                    handleCopyLink();
                }
            }
        } else {
            handleCopyLink();
        }
    };

    const {
        askForUsername, setAskForUsername,
        username, setUsername,
        inviteCopied, handleEndCall, handleCopyInviteLink,
        isRaisedHand, toggleRaiseHand, sendReaction,
        isRecording, toggleRecording,
        showSettingsModal, setShowSettingsModal
    } = useMeetingControls(socketRef);

    const {
        messages, message, setMessage, newMessages,
        showModal, openChat, closeChat, addMessage, sendMessage
    } = useChat(socketRef, socketIdRef);

    const [activeTab, setActiveTab] = useState('chat');

    const {
        videos, connectToSocketServer
    } = useParticipants(addMessage, localStreamRef, socketRef, socketIdRef, connectionsRef);

    const {
        video, audio, setAudio,
        mediaError, setMediaError,
        setLocalVideoElement, getUserMedia, handleVideo, attachLocalStream,
        switchCamera, camerasCount, isRearCamera
    } = useMediaDevices(socketRef, socketIdRef, connectionsRef, askForUsername, joinedWithExistingStreamRef, localVideoref, localStreamRef, initialVideo, initialAudio);

    const { handleAudio } = useAudio(audio, setAudio, localStreamRef, getUserMedia, video, socketRef);

    const { screen, screenAvailable, screenShareMessage, isMobileScreenShareLimited, handleScreen } = useScreenShare(
        localStreamRef, localVideoref, connectionsRef, socketIdRef, socketRef, getUserMedia, attachLocalStream, switchCamera
    );

    const connect = async (overrideUsername, forceAudio, forceVideo, picture) => {
        joinedWithExistingStreamRef.current = false;
        // Wait for the stream initialization attempt
        await getUserMedia({ forceVideo, forceAudio });

        closeChat();
        setAskForUsername(false);
        connectToSocketServer(overrideUsername, picture);
    };

    const hasAutoConnected = useRef(false);
    const [meetingIsValid, setMeetingIsValid] = useState(null); // null = loading, true = valid, false = invalid
    const [meetingError, setMeetingError] = useState("");
    const [joinRequests, setJoinRequests] = useState([]);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        const validateMeeting = async () => {
            try {
                // Extract meeting code from current URL path
                const pathParts = window.location.pathname.split('/');
                const meetingCode = pathParts[pathParts.length - 1];

                const headers = {};
                const token = localStorage.getItem("token");
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const response = await fetch(`${server}/api/v1/meetings/validate/${meetingCode}`, { headers });
                const data = await response.json();
                
                if (response.ok && data.valid) {
                    const isApproved = sessionStorage.getItem(`approved_${meetingCode}`);
                    
                    if (!data.isHost && !isApproved) {
                        // User needs to go through lobby
                        navigate(`/join/${meetingCode}`);
                        return;
                    }

                    setMeetingIsValid(true);
                    setIsHost(!!data.isHost);

                    const shouldShowInstant = sessionStorage.getItem(`instant_show_modal_${meetingCode}`) === "true" || location.state?.isInstant;
                    if (shouldShowInstant) {
                        setShowInstantModal(true);
                        sessionStorage.removeItem(`instant_show_modal_${meetingCode}`);
                    }

                    // Determine initial states from location state (set in PreJoin)
                    const stateName = location.state?.username || userData?.name || "Participant";
                    const statePicture = userData?.picture || location.state?.picture || null;
                    
                    setUsername(stateName);
                    
                    // Auto-connect
                    if (!hasAutoConnected.current) {
                        hasAutoConnected.current = true;
                        connect(stateName, initialAudio, initialVideo, statePicture);
                    }
                } else {
                    setMeetingIsValid(false);
                    setMeetingError(data.message || "Invalid meeting link");
                }
            } catch (error) {
                console.error("Error validating meeting:", error);
                setMeetingIsValid(false);
                setMeetingError("Could not connect to server");
            }
        };

        validateMeeting();
    }, [userData, navigate, location]);

    // Disconnect socket on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (!screenShareMessage) return;

        setToastMessage(screenShareMessage);
        const timeoutId = setTimeout(() => setToastMessage(""), 3000);
        return () => clearTimeout(timeoutId);
    }, [screenShareMessage]);

    // Listen for join requests if host
    useEffect(() => {
        if (!socketRef.current) return;
        
        const handleJoinRequest = (req) => {
            setJoinRequests(prev => [...prev, req]);
        };

        socketRef.current.on("join-request", handleJoinRequest);

        return () => {
            socketRef.current?.off("join-request", handleJoinRequest);
        };
    }, [socketRef.current]);

    const handleAdmit = (socketId, username, path) => {
        if (socketRef.current) {
            socketRef.current.emit("admit-user", { targetSocketId: socketId, userId: socketId, path, username });
            setJoinRequests(prev => prev.filter(r => r.socketId !== socketId && r.userId !== socketId));
        }
    };

    const handleReject = (socketId, path) => {
        if (socketRef.current) {
            socketRef.current.emit("deny-user", { targetSocketId: socketId, userId: socketId, path });
            socketRef.current.emit("reject-user", socketId, path);
            setJoinRequests(prev => prev.filter(r => r.socketId !== socketId && r.userId !== socketId));
        }
    };

    const handleMuteUser = (socketId) => {
        if (socketRef.current) {
            socketRef.current.emit("mute-participant", socketId);
        }
    };

    const handleRemoveUser = (socketId) => {
        if (socketRef.current) {
            socketRef.current.emit("remove-participant", socketId);
        }
    };

    return (
        <div className="w-full h-screen bg-white dark:bg-[#202124] overflow-hidden relative">
            {meetingIsValid === false ? (
                <div className="flex items-center justify-center h-full text-white flex-col gap-4">
                    <h1 className="text-3xl font-bold">Meeting Unavailable</h1>
                    <p className="text-slate-400">{meetingError}</p>
                    <a href="/" className="auth-primary-btn px-6 py-2 rounded-lg mt-4 text-center">Return Home</a>
                </div>
            ) : meetingIsValid === null ? (
                <div className="flex items-center justify-center h-full text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8ab4f8] mb-4"></div>
                </div>
            ) : (
                <div className="relative w-full h-full flex bg-[#202124]">
                    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                        <TopBar 
                            user={userData}
                            username={username}
                            handleCopyInviteLink={() => handleCopyInviteLink(setMediaError)}
                            inviteCopied={inviteCopied}
                        />

                        {joinRequests.length > 0 && (
                            <div className="absolute top-16 right-4 sm:right-6 z-50 flex flex-col gap-3 w-[320px] max-w-[calc(100vw-32px)]">
                                {joinRequests.map(req => (
                                    <div key={req.socketId} className="bg-white dark:bg-[#202124] rounded-lg shadow-2xl p-4 flex flex-col gap-3 border border-gray-200 dark:border-[#5f6368] animate-slide-up">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={req.username} size={40} />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-gray-900 dark:text-white font-medium truncate">{req.username}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">wants to join this call</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end mt-1">
                                            <button 
                                                onClick={() => handleReject(req.socketId, req.path)}
                                                className="px-4 py-1.5 rounded-full bg-transparent text-[#ea4335] hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors text-sm"
                                            >
                                                Deny entry
                                            </button>
                                            <button 
                                                onClick={() => handleAdmit(req.socketId, req.username, req.path)}
                                                className="px-6 py-1.5 rounded-full bg-[#8ab4f8] text-[#202124] hover:bg-[#9ebcf0] font-medium transition-colors text-sm"
                                            >
                                                Admit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <VideoGrid 
                            videos={videos} 
                            setLocalVideoElement={setLocalVideoElement}
                            video={video}
                            audio={audio}
                            username={username}
                            isRaisedHand={isRaisedHand}
                            userData={userData}
                            isHost={isHost}
                            screen={screen}
                            isRearCamera={isRearCamera}
                        />

                        {/* Instant Meeting Ready Modal (Google Meet Style) */}
                        {showInstantModal && (
                            <div className="absolute bottom-24 left-4 sm:left-6 z-40 bg-[#28292c] border border-white/10 text-white rounded-xl shadow-2xl p-5 w-[360px] max-w-[calc(100vw-32px)] transition-all animate-slide-up">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-base font-semibold text-white tracking-tight">Your meeting's ready</h3>
                                    <button 
                                        onClick={() => setShowInstantModal(false)}
                                        className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                        title="Close"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                
                                <p className="text-xs text-white/70 mb-4 leading-relaxed">
                                    Share this meeting link with others you want in the meeting
                                </p>

                                <div className="flex items-center gap-2 mb-4">
                                    <button 
                                        onClick={handleShareLink}
                                        className="flex-1 py-2 px-3 bg-[#8ab4f8] text-[#202124] hover:bg-[#9ebcf0] font-semibold text-xs rounded-full flex items-center justify-center gap-2 transition-all shadow-sm"
                                    >
                                        <Share2 size={15} />
                                        <span>Share link</span>
                                    </button>
                                    <button 
                                        onClick={handleCopyLink}
                                        className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-xs rounded-full flex items-center justify-center gap-1.5 transition-all"
                                    >
                                        {copiedLink ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                                        <span>{copiedLink ? "Copied" : "Copy"}</span>
                                    </button>
                                </div>

                                <div className="bg-black/30 flex items-center justify-between p-2.5 rounded-lg border border-white/10 text-xs">
                                    <span className="text-white/90 truncate pr-2 font-mono selection:bg-[#8ab4f8] selection:text-black">
                                        {meetingLink}
                                    </span>
                                    <button 
                                        onClick={handleCopyLink}
                                        className="p-1.5 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors flex-shrink-0"
                                        title="Copy link"
                                    >
                                        {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                    </button>
                                </div>

                                <p className="text-[11px] text-white/40 mt-3 flex items-center gap-1.5">
                                    <ShieldCheck size={13} className="text-blue-400 flex-shrink-0" />
                                    <span>People who use this link must get your permission before joining.</span>
                                </p>
                            </div>
                        )}

                        {/* Toast Notification */}
                        {toastMessage && (
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#323232] text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-white/10 flex items-center gap-2 animate-fade-in">
                                <Check size={16} className="text-green-400" />
                                <span>{toastMessage}</span>
                            </div>
                        )}

                        <ControlBar
                            video={video}
                            handleVideo={handleVideo}
                            audio={audio}
                            handleAudio={handleAudio}
                            screenAvailable={screenAvailable}
                            screen={screen}
                            handleScreen={handleScreen}
                            isMobileScreenShareLimited={isMobileScreenShareLimited}
                            newMessages={newMessages}
                            showModal={showModal}
                            openChat={openChat}
                            closeChat={closeChat}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            handleEndCall={() => handleEndCall(localStreamRef, localVideoref)}
                            isRaisedHand={isRaisedHand}
                            toggleRaiseHand={toggleRaiseHand}
                            sendReaction={sendReaction}
                            isRecording={isRecording}
                            toggleRecording={toggleRecording}
                            openSettings={() => setShowSettingsModal(true)}
                            switchCamera={switchCamera}
                            camerasCount={camerasCount}
                        />
                        
                        {showSettingsModal && (
                            <SettingsModal 
                                onClose={() => setShowSettingsModal(false)} 
                            />
                        )}
                    </div>

                    <ChatPanel
                        showModal={showModal}
                        closeChat={closeChat}
                        messages={messages}
                        message={message}
                        setMessage={setMessage}
                        sendMessage={sendMessage}
                        username={username}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        videos={videos}
                        handleMuteUser={handleMuteUser}
                        handleRemoveUser={handleRemoveUser}
                        localPicture={userData?.picture}
                        joinRequests={joinRequests}
                        handleAdmit={handleAdmit}
                        handleReject={handleReject}
                    />
                </div>
            )}
        </div>
    );
}
