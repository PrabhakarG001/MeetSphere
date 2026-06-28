import { useRef, useState } from "react";
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

export default function Video() {
    const joinedWithExistingStreamRef = useRef(false);
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const connectionsRef = useRef({});
    const localVideoref = useRef(null);
    const localStreamRef = useRef(null);

    const {
        askForUsername, setAskForUsername,
        username, setUsername,
        inviteCopied, handleEndCall, handleCopyInviteLink
    } = useMeetingControls();

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

    const { handleAudio } = useAudio(audio, setAudio, localStreamRef, getUserMedia, video);

    const { screen, screenAvailable, handleScreen } = useScreenShare(
        localStreamRef, localVideoref, connectionsRef, socketIdRef, socketRef, getUserMedia, attachLocalStream
    );

    const connect = async () => {
        joinedWithExistingStreamRef.current = false;
        // Wait for the stream initialization attempt
        await getUserMedia({ forceVideo: video, forceAudio: audio });

        closeChat();
        setAskForUsername(false);
        connectToSocketServer();
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative">
            {askForUsername === true ? (
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
                />
            ) : (
                <div className="relative w-full h-full flex auth-gradient-bg">
                    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                        <TopBar 
                            username={username}
                            handleCopyInviteLink={() => handleCopyInviteLink(setMediaError)}
                            inviteCopied={inviteCopied}
                        />

                        <VideoGrid 
                            videos={videos} 
                            setLocalVideoElement={setLocalVideoElement}
                            audio={audio}
                            username={username}
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
                        />
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
                    />
                </div>
            )}
        </div>
    );
}
