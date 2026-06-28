import '../../styles/WaitingScreen.css';
import { Mic, MicOff, Video, VideoOff, Volume2, User, Plus } from 'lucide-react';
import DeviceStatus from './DeviceStatus';

export default function WaitingScreen({
    mediaError,
    audio,
    handleAudio,
    video,
    handleVideo,
    username,
    setUsername,
    connect,
    setLocalVideoElement
}) {
    return (
        <div className="min-h-screen auth-gradient-bg flex flex-col font-sans relative overflow-hidden selection:bg-blue-500/30 selection:text-white text-slate-300">
            
            {/* Top Navigation */}
            <header className="flex items-center justify-center pt-8 pb-4">
                <a href="/" className="flex items-center gap-2 font-semibold text-2xl tracking-tight transition-transform hover:scale-105" style={{ textDecoration: 'none' }}>
                    <img src="/logo-navbar.png" alt="MeetSphere Logo" className="object-contain" style={{ width: '1.8em', height: '1.8em' }} />
                    <span style={{ 
                        background: 'linear-gradient(135deg, #ff2ea6 0%, #7b61ff 50%, #2d4fc2 100%)', 
                        WebkitBackgroundClip: 'text', 
                        WebkitTextFillColor: 'transparent',
                        fontWeight: '800'
                    }}>
                        MeetSphere
                    </span>
                </a>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 max-w-6xl mx-auto w-full relative z-0">
                
                {/* Left Column: Video & Controls */}
                <div className="flex-1 flex flex-col w-full max-w-3xl">
                    
                    {/* Video Preview */}
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/20">
                        {video ? (
                            <video 
                                className="w-full h-full object-cover mirror-mode" 
                                ref={setLocalVideoElement} 
                                autoPlay 
                                muted 
                                playsInline
                            ></video>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-[#111111]">
                                <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-[#222222] flex items-center justify-center mb-4">
                                    <User size={32} className="text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Camera is off</p>
                            </div>
                        )}
                    </div>

                    {/* Control Bar (Outside the video) */}
                    <div className="flex items-center justify-center gap-3 py-2">
                        <button 
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm ${!audio ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#1a1a1a] text-slate-300 border border-[#222222] hover:bg-[#222222]'}`} 
                            onClick={handleAudio} 
                            type="button"
                            aria-label={audio ? "Mute" : "Unmute"}
                        >
                            {audio ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        
                        <button 
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm ${!video ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#1a1a1a] text-slate-300 border border-[#222222] hover:bg-[#222222]'}`} 
                            onClick={handleVideo} 
                            type="button"
                            aria-label={video ? "Turn off camera" : "Turn on camera"}
                        >
                            {video ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                        
                        <div className="w-px h-6 bg-[#222222] mx-1"></div>
                        
                        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-slate-500 hover:bg-[#1a1a1a] hover:text-slate-300 transition-colors border border-transparent hover:border-[#222222]">
                            <Volume2 size={20} />
                        </button>
                    </div>

                </div>

                {/* Right Column: Join Card */}
                <div className="w-full lg:w-[380px] flex flex-col gap-4 relative z-50 pointer-events-auto">
                    <div className="auth-glass-card p-8">
                        <h1 className="text-xl font-semibold text-white mb-1">Ready to join?</h1>
                        <p className="text-white/70 text-sm mb-6">Enter your display name to enter the workspace.</p>

                        <div className="flex flex-col gap-4">
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                                <input 
                                    className="w-full bg-black/20 border border-white/20 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0b5cff] focus:border-transparent transition-all placeholder-white/50" 
                                    type="text" 
                                    placeholder="Enter your name" 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && connect()}
                                />
                            </div>

                            <button 
                                className="relative z-50 pointer-events-auto w-full py-2.5 mt-2 auth-primary-btn" 
                                onClick={connect} 
                                type="button"
                            >
                                Join Meeting
                            </button>
                            
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-[#222222]"></div>
                                <span className="flex-shrink-0 mx-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Or</span>
                                <div className="flex-grow border-t border-[#222222]"></div>
                            </div>

                            <button 
                                className="relative z-10 pointer-events-auto w-full py-2.5 bg-transparent border border-[#333333] text-slate-300 text-sm font-medium rounded-lg hover:bg-[#1a1a1a] hover:text-white transition-colors flex items-center justify-center gap-2 active:scale-[0.98]" 
                                onClick={() => window.location.href = "/"} 
                                type="button"
                            >
                                <Plus size={16} />
                                Start a new meeting
                            </button>
                        </div>
                    </div>
                    
                    <DeviceStatus cameraError={mediaError} />
                </div>
            </main>
        </div>
    );
}
