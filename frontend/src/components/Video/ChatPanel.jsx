import '../../styles/ChatPanel.css';
import { useRef, useEffect } from "react";
import { Send, X, MessageSquare, Users } from 'lucide-react';
import Avatar from './Avatar';

export default function ChatPanel({
    showModal,
    closeChat,
    messages,
    message,
    setMessage,
    sendMessage,
    username,
    activeTab,
    setActiveTab,
    videos,
    handleMuteUser,
    handleRemoveUser,
    localPicture,
    joinRequests = [],
    handleAdmit,
    handleReject
}) {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (showModal) {
            scrollToBottom();
        }
    }, [messages, showModal]);

    return (
        <div 
            className={`flex-shrink-0 bg-white dark:bg-[#202124] border-l border-gray-200 dark:border-[#3c4043] flex flex-col transition-all duration-300 ease-in-out z-50 absolute md:relative right-0 h-full ${showModal ? 'w-full md:w-80 lg:w-80 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}
        >
            {/* Header / Tabs */}
            <div className="flex flex-col border-b border-[#e5e7eb] dark:border-[#2a2a2a] sticky top-0 z-10 bg-white dark:bg-[#202124]">
                <div className="flex items-center justify-between px-4 py-3">
                    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 m-0">Meeting Chat</h2>
                    <button 
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5"
                        onClick={closeChat} 
                        aria-label="Close panel"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                {/* Simulated Tabs (Zoom style) */}
                <div className="flex items-center px-2">
                    <button 
                        className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Chat
                    </button>
                    <button 
                        className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'participants' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        onClick={() => setActiveTab('participants')}
                    >
                        Participants
                    </button>
                </div>
            </div>

            {/* Join Requests Area */}
            {joinRequests.length > 0 && (
                <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
                    <h3 className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">Waiting to join</h3>
                    {joinRequests.map(req => (
                        <div key={req.socketId} className="bg-white dark:bg-[#3c4043] rounded-md p-2 flex items-center justify-between shadow-sm border border-gray-200 dark:border-transparent">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Avatar name={req.username} size={28} />
                                <span className="text-sm text-gray-900 dark:text-white font-medium truncate">{req.username}</span>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleReject && handleReject(req.socketId, req.path)}
                                    className="p-1 text-[#ea4335] hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                    title="Deny"
                                >
                                    <X size={16} />
                                </button>
                                <button 
                                    onClick={() => handleAdmit && handleAdmit(req.socketId, req.username, req.path)}
                                    className="px-3 py-1 rounded bg-[#8ab4f8] text-[#202124] hover:bg-[#9ebcf0] font-medium transition-colors text-xs"
                                >
                                    Admit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'chat' ? (
                <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 bg-gray-50 dark:bg-[#202124] custom-scrollbar scroll-smooth" style={{ WebkitOverflowScrolling: 'touch', height: 'calc(100vh - 120px)' }}>
                        {messages.length !== 0 ? messages.map((item, index) => {
                            const isMe = item.sender === username;
                            return (
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} key={index}>
                                    <span className="text-[11px] font-medium text-slate-500 mb-1 px-1">
                                        {isMe ? 'You' : item.sender}
                                    </span>
                                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-[13px] leading-relaxed shadow-sm ${isMe ? 'bg-[#8ab4f8] text-[#202124] rounded-tr-sm font-medium' : 'bg-[#8ab4f8]/20 text-slate-900 dark:text-slate-100 rounded-tl-sm border border-[#8ab4f8]/30'}`}
                                         style={{ wordBreak: 'break-word' }}
                                    >
                                        <p className="m-0" style={{ wordBreak: 'break-word' }}>{item.data}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <MessageSquare size={32} className="text-slate-300 dark:text-slate-700 mb-3" />
                                <p className="text-sm text-slate-500">No messages yet.</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>

                    {/* Input Area */}
                    <div className="sticky bottom-0 w-full p-3 md:p-4 bg-white dark:bg-[#202124] border-t border-gray-200 dark:border-[#3c4043] z-10">
                        <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#3c4043] border border-gray-200 dark:border-transparent rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all p-1">
                            <textarea
                                className="flex-1 max-h-24 min-h-[36px] bg-transparent text-[13px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none outline-none py-2 px-3 custom-scrollbar"
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                placeholder="Type message here..." 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (message.trim()) sendMessage(username);
                                    }
                                }}
                            />
                            <button 
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1 mr-1"
                                onClick={() => {
                                    if (message.trim()) sendMessage(username);
                                }} 
                                aria-label="Send message"
                                disabled={!message.trim()}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-[#202124] custom-scrollbar">
                    <div className="flex flex-col gap-2">
                        {/* Local User */}
                        <div className="flex items-center gap-2 p-2 mx-4 mt-2 bg-gray-100 dark:bg-[#3c4043] rounded-lg">
                            <Avatar name={username || "You"} picture={localPicture} size={32} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 m-0">
                                    {username || 'You'} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(You)</span>
                                </p>
                            </div>
                        </div>

                        {/* Remote Participants */}
                        {videos && videos.length > 0 ? videos.map((v, index) => (
                            <div key={v.socketId || index} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-[#3c4043] border border-gray-200 dark:border-transparent shadow-sm group">
                                <Avatar name={v.username || `Participant ${index + 1}`} picture={v.picture} size={32} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 m-0">
                                        {v.username || `Participant ${index + 1}`}
                                        {v.isHost && <span className="ml-2 text-[10px] bg-blue-600/80 text-white px-1.5 py-0.5 rounded font-semibold">Host</span>}
                                    </p>
                                </div>
                                
                                {/* Host Controls */}
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                    <button 
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Mute User"
                                        onClick={() => handleMuteUser && handleMuteUser(v.socketId)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                    </button>
                                    <button 
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Remove User"
                                        onClick={() => handleRemoveUser && handleRemoveUser(v.socketId)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                        )) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
