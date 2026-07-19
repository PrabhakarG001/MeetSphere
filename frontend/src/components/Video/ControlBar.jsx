import { useState } from 'react';
import '../../styles/ControlBar.css';
import { 
    Video, VideoOff, Mic, MicOff, 
    MonitorUp, MonitorOff, MessageSquare, Users,
    Heart, Hand
} from 'lucide-react';

const EMOJIS = ['\u2764\uFE0F', '\uD83D\uDC4D', '\uD83C\uDF89', '\uD83D\uDC4F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83E\uDD14', '\uD83D\uDC4E'];

const ControlButton = ({ onClick, isActive, title, children, isDanger, isPrimary, badge, className = "" }) => {
    let bgClass = isActive 
        ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]' 
        : 'bg-gray-100 dark:bg-[#3c4043] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#4a4d51]';

    if (isDanger) {
        bgClass = 'bg-[#ea4335] text-white hover:bg-[#d93025]';
    } else if (isPrimary) {
        bgClass = 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]';
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
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/90 text-white text-[11px] sm:text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-50">
                {title}
            </span>
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-white dark:border-[#202124]">
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
    isRaisedHand, toggleRaiseHand, sendReaction
}) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleEmojiClick = (emoji) => {
        if (sendReaction) {
            sendReaction(emoji);
        }
        setShowEmojiPicker(false);
    };

    return (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full px-2 sm:px-0 pointer-events-none flex justify-center">
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 bg-white dark:bg-[#202124] px-2 sm:px-4 py-2 sm:py-3 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700/50 pointer-events-auto w-max max-w-[98vw] sm:max-w-max transition-all duration-300">
                
                {/* Audio */}
                <ControlButton
                    onClick={handleAudio}
                    isActive={false}
                    isDanger={!audio}
                    title={audio ? "Turn off microphone" : "Turn on microphone"}
                    className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                >
                    {audio ? <Mic size={18} strokeWidth={2} className="sm:w-5 sm:h-5" /> : <MicOff size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />}
                </ControlButton>

                {/* Video */}
                <ControlButton
                    onClick={handleVideo}
                    isActive={false}
                    isDanger={!video}
                    title={video ? "Turn off camera" : "Turn on camera"}
                    className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                >
                    {video ? <Video size={18} strokeWidth={2} className="sm:w-5 sm:h-5" /> : <VideoOff size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />}
                </ControlButton>

                {/* Screen Share */}
                {screenAvailable && (
                    <ControlButton
                        onClick={handleScreen}
                        isActive={screen}
                        title={screen ? "Stop presenting" : "Present now"}
                        className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                    >
                        {screen ? <MonitorOff size={18} strokeWidth={2} className="sm:w-5 sm:h-5" /> : <MonitorUp size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />}
                    </ControlButton>
                )}

                {/* Emoji / React Button with Popover */}
                <div className="relative flex items-center justify-center">
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 bg-white dark:bg-[#202124] border border-gray-200 dark:border-gray-700 rounded-full py-1.5 sm:py-2 px-2 sm:px-3 flex flex-wrap gap-1 sm:gap-2 shadow-xl z-50 w-max max-w-[240px] sm:max-w-[280px] justify-center">
                            {EMOJIS.map((emoji, index) => (
                                <button 
                                    key={index}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-xl sm:text-2xl hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors"
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
                        className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                    >
                        <Heart size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
                    </ControlButton>
                </div>

                {/* Hand Raise */}
                <ControlButton
                    onClick={toggleRaiseHand}
                    isActive={isRaisedHand}
                    title={isRaisedHand ? "Lower hand" : "Raise hand"}
                    className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                >
                    <Hand size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
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
                    }}
                    isActive={showModal && activeTab === 'participants'}
                    title="People"
                    className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                >
                    <Users size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
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
                    }}
                    isActive={showModal && activeTab === 'chat'}
                    title="Chat"
                    badge={!showModal ? newMessages : 0}
                    className="w-9 h-9 sm:w-12 sm:h-12 min-w-[36px]"
                >
                    <MessageSquare size={18} strokeWidth={2} className="sm:w-5 sm:h-5" />
                </ControlButton>

                <div className="w-px h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 mx-0.5 sm:mx-1"></div>

                {/* End Call */}
                <ControlButton
                    onClick={handleEndCall}
                    isActive={false}
                    isDanger={true}
                    title="Leave call"
                    className="w-12 h-9 sm:w-16 sm:h-12 min-w-[48px]"
                >
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                    </svg>
                </ControlButton>

            </div>
        </div>
    );
}
