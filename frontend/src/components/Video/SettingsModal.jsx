import React, { useState } from 'react';
import { Settings, X, Mic, Video, Image, Sliders } from 'lucide-react';

export default function SettingsModal({ onClose }) {
    const [activeTab, setActiveTab] = useState('audio');

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-[#1a1a1a] border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                    <h2 className="hidden md:flex items-center gap-2 text-white font-semibold text-lg px-2 mb-4">
                        <Settings size={20} /> Settings
                    </h2>
                    
                    <button 
                        onClick={() => setActiveTab('audio')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${activeTab === 'audio' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Mic size={18} /> Audio
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${activeTab === 'video' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Video size={18} /> Video
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('background')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${activeTab === 'background' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Image size={18} /> Background
                    </button>
                    
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm whitespace-nowrap ${activeTab === 'general' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Sliders size={18} /> General
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col relative h-[500px] max-h-[70vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <h3 className="text-xl font-semibold text-white capitalize">
                            {activeTab} Settings
                        </h3>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 text-slate-300">
                        {activeTab === 'audio' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-200">Microphone</label>
                                    <select className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 outline-none focus:border-blue-500 transition-colors">
                                        <option>Default - System Microphone</option>
                                        <option>External USB Mic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-200">Speaker</label>
                                    <select className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 outline-none focus:border-blue-500 transition-colors">
                                        <option>Default - System Speakers</option>
                                    </select>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-transparent text-blue-500" />
                                        <span className="text-sm">Enable AI Noise Suppression</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'video' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-200">Camera</label>
                                    <select className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg p-3 outline-none focus:border-blue-500 transition-colors">
                                        <option>Integrated FaceTime HD Camera</option>
                                    </select>
                                </div>
                                <div className="w-full aspect-video bg-[#1a1a1a] rounded-xl border border-white/5 flex items-center justify-center">
                                    <span className="text-slate-500">Camera Preview (Coming Soon)</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'background' && (
                            <div className="space-y-6">
                                <p className="text-sm text-slate-400">Apply a virtual background to your video stream.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <button className="aspect-video rounded-lg border-2 border-blue-500 bg-[#1a1a1a] flex items-center justify-center">
                                        <span className="text-xs font-medium">None</span>
                                    </button>
                                    <button className="aspect-video rounded-lg border border-[#333333] bg-[#222222] hover:border-slate-500 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-400/20 backdrop-blur-md"></div>
                                        <span className="text-xs font-medium relative z-10 text-white shadow-sm">Blur</span>
                                    </button>
                                    <button className="aspect-video rounded-lg border border-[#333333] hover:border-slate-500 bg-gradient-to-tr from-purple-500 to-blue-500"></button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded" />
                                        <span className="text-sm">Always mute my microphone when joining</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded" />
                                        <span className="text-sm">Always turn off my video when joining</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded" />
                                        <span className="text-sm">Mirror my video</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
