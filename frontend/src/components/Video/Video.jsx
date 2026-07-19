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

import WaitingScreen from './WaitingScreen';
import TopBar from './TopBar';
import VideoGrid from './VideoGrid';
import ControlBar from './ControlBar';
import ChatPanel from './ChatPanel';
import SettingsModal from './SettingsModal';

export default function Video() {
    const { userData } = useContext(AuthContext);
    const joinedWithExistingStreamRef = useRef(false);
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const connectionsRef = useRef({});
    const localVideoref = useRef(null);
    const localStreamRef = useRef(null);

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
        setLocalVideoElement, getUserMedia, handleVideo, attachLocalStream
    } = useMediaDevices(socketRef, socketIdRef, connectionsRef, askForUsername, joinedWithExistingStreamRef, localVideoref, localStreamRef);

    const { handleAudio } = useAudio(audio, setAudio, localStreamRef, getUserMedia, video, socketRef);

    const { screen, screenAvailable, handleScreen } = useScreenShare(
        localStreamRef, localVideoref, connectionsRef, socketIdRef, socketRef, getUserMedia, attachLocalStream
    );

    const connect = async (overrideUsername) => {
        joinedWithExistingStreamRef.current = false;
        // Wait for the stream initialization attempt
        await getUserMedia({ forceVideo: video, forceAudio: audio });

        closeChat();
        setAskForUsername(false);
        connectToSocketServer(overrideUsername || username);
    };

    const hasAutoConnected = useRef(false);
    const [meetingIsValid, setMeetingIsValid] = useState(null); // null = loading, true = valid, false = invalid
    const [meetingError, setMeetingError] = useState("");

    useEffect(() => {
        const validateMeeting = async () => {
            try {
                // Extract meeting code from current URL path
                const pathParts = window.location.pathname.split('/');
                const meetingCode = pathParts[pathParts.length - 1];

                const response = await fetch(`${server}/api/v1/meetings/validate/${meetingCode}`);
                const data = await response.json();
                
                if (response.ok && data.valid) {
                    setMeetingIsValid(true);
                    
                    // Do not auto-bypass WaitingScreen, but do pre-fill name
                    if (userData && userData.name) {
                        setUsername(userData.name);
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
    }, [userData, setUsername]);

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
                    <p>Loading meeting details...</p>
                </div>
            ) : askForUsername === true ? (
                <WaitingScreen
                    mediaError={mediaError}
                    audio={audio}
                    handleAudio={handleAudio}
                    video={video}
                    handleVideo={handleVideo}
                    username={username}
                    setUsername={setUsername}
                    connect={connect}
                    setLocalVideoElement={setLocalVideoElement}
                    userData={userData}
                />
            ) : (
                <div className="relative w-full h-full flex bg-[#202124]">
                    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                        <TopBar 
                            user={userData}
                            username={username}
                            handleCopyInviteLink={() => handleCopyInviteLink(setMediaError)}
                            inviteCopied={inviteCopied}
                        />

                        <VideoGrid 
                            videos={videos} 
                            setLocalVideoElement={setLocalVideoElement}
                            audio={audio}
                            username={username}
                            isRaisedHand={isRaisedHand}
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
                    />
                </div>
            )}
        </div>
    );
}
