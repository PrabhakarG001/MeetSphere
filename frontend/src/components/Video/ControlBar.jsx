import '../../styles/ControlBar.css';
import { 
    Video, VideoOff, Mic, MicOff, 
    MonitorUp, MonitorOff, MessageSquare, Users, 
} from 'lucide-react';

export default function ControlBar({
    video, handleVideo,
    audio, handleAudio,
    screenAvailable, screen, handleScreen,
    newMessages, showModal, openChat, closeChat,
    activeTab, setActiveTab,
    handleEndCall
}) {
    return (
        <div className="flex-shrink-0 w-full h-16 bg-white/5 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between px-4 z-40 relative">
            
            {/* Left aligned context items (optional, usually empty or security shield) */}
            <div className="hidden md:flex flex-1 items-center gap-4 text-slate-400">
                {/* Reserved for future left-side items like Security/Info */}
            </div>

            {/* Center controls */}
            <div className="flex-1 flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                    <button 
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${!audio ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-300 hover:bg-white/10'}`}
                        onClick={handleAudio}
                        title={audio ? "Mute" : "Unmute"}
                    >
                        {audio ? <Mic size={20} strokeWidth={2.5} /> : <MicOff size={20} strokeWidth={2.5} />}
                        <span className="text-[10px] mt-1 font-medium">{audio ? "Mute" : "Unmute"}</span>
                    </button>

                    <button 
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${!video ? 'text-red-500 hover:bg-red-500/10' : 'text-slate-300 hover:bg-white/10'}`}
                        onClick={handleVideo}
                        title={video ? "Stop Video" : "Start Video"}
                    >
                        {video ? <Video size={20} strokeWidth={2.5} /> : <VideoOff size={20} strokeWidth={2.5} />}
                        <span className="text-[10px] mt-1 font-medium">{video ? "Stop Video" : "Start Video"}</span>
                    </button>
                </div>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                <div className="flex items-center gap-1">
                    {screenAvailable && (
                        <button 
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${screen ? 'text-green-500 hover:bg-green-500/10' : 'text-slate-300 hover:bg-white/10'}`}
                            onClick={handleScreen}
                            title={screen ? "Stop Share" : "Share Screen"}
                        >
                            {screen ? <MonitorOff size={20} strokeWidth={2.5} /> : <MonitorUp size={20} strokeWidth={2.5} />}
                            <span className="text-[10px] mt-1 font-medium">Share</span>
                        </button>
                    )}

                    <button 
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${(showModal && activeTab === 'participants') ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20' : 'text-slate-300 hover:bg-white/10'}`}
                        onClick={() => {
                            if (showModal && activeTab === 'participants') {
                                closeChat();
                            } else {
                                setActiveTab('participants');
                                openChat();
                            }
                        }}
                        title="Participants"
                    >
                        <Users size={20} strokeWidth={2.5} />
                        <span className="text-[10px] mt-1 font-medium">Participants</span>
                    </button>

                    <button 
                        className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${(showModal && activeTab === 'chat') ? 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20' : 'text-slate-300 hover:bg-white/10'}`}
                        onClick={() => {
                            if (showModal && activeTab === 'chat') {
                                closeChat();
                            } else {
                                setActiveTab('chat');
                                openChat();
                            }
                        }}
                        title="Chat"
                    >
                        <MessageSquare size={20} strokeWidth={2.5} />
                        <span className="text-[10px] mt-1 font-medium">Chat</span>
                        {newMessages > 0 && !showModal && (
                            <span className="absolute top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-[#1a1a1a]">
                                {newMessages > 9 ? '9+' : newMessages}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Right aligned Leave button */}
            <div className="flex-1 flex items-center justify-end">
                <button 
                    className="auth-danger-btn px-6 h-10 shadow-sm"
                    onClick={handleEndCall}
                    title="Leave Meeting"
                >
                    Leave
                </button>
            </div>
        </div>
    );
}
