import { useState, useRef, useEffect } from 'react';
import '../../styles/ControlBar.css';
import { 
    Video, VideoOff, Mic, MicOff, 
    MonitorUp, MonitorOff, MessageSquare, Users,
    Heart, Hand, MoreVertical, Settings, SwitchCamera
} from 'lucide-react';

const EMOJIS = ['\u2764\uFE0F', '\uD83D\uDC4D', '\uD83C\uDF89', '\uD83D\uDC4F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83E\uDD14', '\uD83D\uDC4E'];

const ControlButton = ({ onClick, isActive, title, children, isDanger, isPrimary, badge, className = "", noTooltip = false }) => {
    let bgClass = isActive 
        ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#9ebcf0]' 
        : 'bg-gray-100 dark:bg-[#3c4043] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#4a4d51]';

    if (isDanger) {
        bgClass = 'bg-[#ea4335] text-white hover:bg-[#d93025]';
    } else if (isPrimary) {
        bgClass = 'bg-[#8ab4f8] text-[#202124] hover:bg-[#9ebcf0]';
    }

    return (
        <div className="relative group flex items-center justify-center">
            <button 
                className={`flex items-center justify-center rounded-full transition-colors ${bgClass} ${className}`}
                onClick={onClick}
                type="button"
            >
                {children}
            </button>
            {!noTooltip && (
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/90 text-white text-[11px] sm:text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-50 hidden sm:block">
                    {title}
                </span>
            )}
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-white dark:border-[#202124] z-10">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </div>
    );
};

export default function ControlBar({
    video, handleVideo,
    audio, handleAudio,
    screenAvailable, screen, handleScreen,
    newMessages, showModal, openChat, closeChat,
    activeTab, setActiveTab,
    handleEndCall,
    isRaisedHand, toggleRaiseHand, sendReaction,
    openSettings, switchCamera, camerasCount
}) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef(null);

    const handleEmojiClick = (emoji) => {
        if (sendReaction) {
            sendReaction(emoji);
        }
        setShowEmojiPicker(false);
        setShowMoreMenu(false); // Close menu on mobile if reacting
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const extraControlsDesktop = (
        <>
            {/* Screen Share */}
            {screenAvailable && (
                <ControlButton
                    onClick={() => { handleScreen(); setShowMoreMenu(false); }}
                    isActive={screen}
                    title={screen ? "Stop presenting" : "Present now"}
                    className="w-12 h-12"
                >
                    {screen ? <MonitorOff size={18} strokeWidth={2} className="w-5 h-5" /> : <MonitorUp size={18} strokeWidth={2} className="w-5 h-5" />}
                </ControlButton>
            )}

            {/* Emoji / React Button */}
            <div className="relative flex items-center justify-center">
                {showEmojiPicker && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white dark:bg-[#202124] border border-gray-200 dark:border-gray-700 rounded-full py-2 px-3 flex flex-wrap gap-2 shadow-xl z-50 w-max max-w-[280px] justify-center">
                        {EMOJIS.map((emoji, index) => (
                            <button 
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmojiClick(emoji);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-2xl hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
                <ControlButton
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    isActive={showEmojiPicker}
                    title="React"
                    className="w-12 h-12"
                >
                    <Heart size={18} strokeWidth={2} className="w-5 h-5" />
                </ControlButton>
            </div>

            {/* Hand Raise */}
            <ControlButton
                onClick={() => { toggleRaiseHand(); setShowMoreMenu(false); }}
                isActive={isRaisedHand}
                title={isRaisedHand ? "Lower hand" : "Raise hand"}
                className="w-12 h-12"
            >
                <Hand size={18} strokeWidth={2} className="w-5 h-5" />
            </ControlButton>

            {/* Participants */}
            <ControlButton
                onClick={() => {
                    if (showModal && activeTab === 'participants') {
                        closeChat();
                    } else {
                        setActiveTab('participants');
                        openChat();
                    }
                    setShowMoreMenu(false);
                }}
                isActive={showModal && activeTab === 'participants'}
                title="People"
                className="w-12 h-12"
            >
                <Users size={18} strokeWidth={2} className="w-5 h-5" />
            </ControlButton>

            {/* Chat */}
            <ControlButton
                onClick={() => {
                    if (showModal && activeTab === 'chat') {
                        closeChat();
                    } else {
                        setActiveTab('chat');
                        openChat();
                    }
                    setShowMoreMenu(false);
                }}
                isActive={showModal && activeTab === 'chat'}
                title="Chat"
                badge={!showModal ? newMessages : 0}
                className="w-12 h-12"
            >
                <MessageSquare size={18} strokeWidth={2} className="w-5 h-5" />
            </ControlButton>
        </>
    );

    const extraControlsMobile = (
        <div className="grid grid-cols-4 gap-4 justify-items-center w-full px-2">
            {screenAvailable && (
                <ControlButton
                    onClick={() => { handleScreen(); setShowMoreMenu(false); }}
                    isActive={screen}
                    title={screen ? "Stop" : "Share"}
                    className="w-12 h-12"
                    noTooltip
                >
                    {screen ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
                </ControlButton>
            )}

            {/* Emoji / React Button */}
            <div className="relative flex items-center justify-center">
                {showEmojiPicker && (
                    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-white dark:bg-[#202124] border border-gray-200 dark:border-gray-700 rounded-full py-2 px-3 flex flex-wrap gap-2 shadow-xl z-[70] w-max max-w-[280px] justify-center">
                        {EMOJIS.map((emoji, index) => (
                            <button 
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmojiClick(emoji);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-2xl hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
                <ControlButton
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker);
                    }}
                    isActive={showEmojiPicker}
                    title="React"
                    className="w-12 h-12"
                    noTooltip
                >
                    <Heart size={20} />
                </ControlButton>
            </div>

            {/* Hand Raise */}
            <ControlButton
                onClick={() => { toggleRaiseHand(); setShowMoreMenu(false); }}
                isActive={isRaisedHand}
                title="Raise"
                className="w-12 h-12"
                noTooltip
            >
                <Hand size={20} />
            </ControlButton>

            {/* Participants */}
            <ControlButton
                onClick={() => {
                    if (showModal && activeTab === 'participants') {
                        closeChat();
                    } else {
                        setActiveTab('participants');
                        openChat();
                    }
                    setShowMoreMenu(false);
                }}
                isActive={showModal && activeTab === 'participants'}
                title="People"
                className="w-12 h-12"
                noTooltip
            >
                <Users size={20} />
            </ControlButton>
        </div>
    );

    return (
        <div ref={moreMenuRef} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-full px-4 sm:px-0 pointer-events-none flex justify-center">
            {/* Desktop Layout (hidden on mobile) */}
            <div className="hidden sm:flex items-center justify-center gap-3 bg-white dark:bg-[#202124] px-4 py-3 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700/50 pointer-events-auto w-max transition-all duration-300">
                <ControlButton
                    onClick={handleAudio}
                    isActive={false}
                    isDanger={!audio}
                    title={audio ? "Turn off microphone" : "Turn on microphone"}
                    className="w-12 h-12"
                >
                    {audio ? <Mic size={20} strokeWidth={2} /> : <MicOff size={20} strokeWidth={2} />}
                </ControlButton>

                <ControlButton
                    onClick={handleVideo}
                    isActive={false}
                    isDanger={!video}
                    title={video ? "Turn off camera" : "Turn on camera"}
                    className="w-12 h-12"
                >
                    {video ? <Video size={20} strokeWidth={2} /> : <VideoOff size={20} strokeWidth={2} />}
                </ControlButton>

                {extraControlsDesktop}
                
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                <ControlButton
                    onClick={handleEndCall}
                    isActive={false}
                    isDanger={true}
                    title="Leave call"
                    className="w-16 h-12"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                    </svg>
                </ControlButton>
            </div>

            {/* Mobile Layout (hidden on desktop) */}
            <div className="sm:hidden flex items-center justify-between w-full max-w-sm gap-2 bg-white dark:bg-[#202124] px-4 py-3 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700/50 pointer-events-auto relative">
                {/* Mobile audio toggle */}
                <ControlButton
                    onClick={handleAudio}
                    isActive={false}
                    isDanger={!audio}
                    title={audio ? "Turn off mic" : "Turn on mic"}
                    className="w-10 h-10"
                    noTooltip
                >
                    {audio ? <Mic size={18} /> : <MicOff size={18} />}
                </ControlButton>

                {/* Mobile video toggle */}
                <ControlButton
                    onClick={handleVideo}
                    isActive={false}
                    isDanger={!video}
                    title={video ? "Turn off camera" : "Turn on camera"}
                    className="w-10 h-10"
                    noTooltip
                >
                    {video ? <Video size={18} /> : <VideoOff size={18} />}
                </ControlButton>

                {/* Mobile screen share */}
                {screenAvailable && (
                    <ControlButton
                        onClick={handleScreen}
                        isActive={screen}
                        title={screen ? "Stop sharing" : "Share screen"}
                        className="w-10 h-10"
                        noTooltip
                    >
                        {screen ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                    </ControlButton>
                )}

                {/* Mobile camera switch */}
                {camerasCount > 1 && (
                    <ControlButton
                        onClick={switchCamera}
                        isActive={false}
                        title="Switch Camera"
                        className="w-10 h-10"
                        noTooltip
                    >
                        <SwitchCamera size={18} />
                    </ControlButton>
                )}

                {/* Mobile chat toggle (TEXT ICON) */}
                <ControlButton
                    onClick={() => {
                        if (showModal && activeTab === 'chat') {
                            closeChat();
                        } else {
                            setActiveTab('chat');
                            openChat();
                        }
                    }}
                    isActive={showModal && activeTab === 'chat'}
                    title="Chat"
                    badge={!showModal ? newMessages : 0}
                    className="w-10 h-10"
                    noTooltip
                >
                    <MessageSquare size={18} />
                </ControlButton>

                {/* More Menu Toggle */}
                <div className="relative">
                    <ControlButton
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        isActive={showMoreMenu}
                        title="More options"
                        className="w-10 h-10 relative"
                        noTooltip
                    >
                        <MoreVertical size={18} />
                    </ControlButton>

                    {/* More Menu Popover */}
                    {showMoreMenu && (
                        <div className="absolute bottom-14 right-0 w-[260px] bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 p-4 animate-slide-up origin-bottom-right z-50">
                            {extraControlsMobile}
                        </div>
                    )}
                </div>

                <ControlButton
                    onClick={handleEndCall}
                    isActive={false}
                    isDanger={true}
                    title="Leave call"
                    className="w-14 h-10"
                    noTooltip
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                    </svg>
                </ControlButton>
            </div>
        </div>
    );
}
