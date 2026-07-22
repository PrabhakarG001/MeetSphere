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
        switchCamera, camerasCount
    } = useMediaDevices(socketRef, socketIdRef, connectionsRef, askForUsername, joinedWithExistingStreamRef, localVideoref, localStreamRef, initialVideo, initialAudio);

    const { handleAudio } = useAudio(audio, setAudio, localStreamRef, getUserMedia, video, socketRef);

    const { screen, screenAvailable, handleScreen } = useScreenShare(
        localStreamRef, localVideoref, connectionsRef, socketIdRef, socketRef, getUserMedia, attachLocalStream
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
            socketRef.current.emit("admit-user", socketId, path, username);
            setJoinRequests(prev => prev.filter(r => r.socketId !== socketId));
        }
    };

    const handleReject = (socketId, path) => {
        if (socketRef.current) {
            socketRef.current.emit("reject-user", socketId, path);
            setJoinRequests(prev => prev.filter(r => r.socketId !== socketId));
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
                        />

                        <ControlBar
                            video={video}
                            handleVideo={handleVideo}
                            audio={audio}
                            handleAudio={handleAudio}
                            screenAvailable={screenAvailable}
                            screen={screen}
                            handleScreen={handleScreen}
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
