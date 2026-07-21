import '../../styles/DashboardNav.css';
import '../../styles/theme.css';
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Clock, LogOut, MoreVertical } from 'lucide-react';
import Logo from '../common/Logo';

export default function DashboardNav({ showBack, onBack, onHistory, onLogout, userPicture, userName, userEmail }) {
    const [scrolled, setScrolled] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);

        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <nav 
            className={`sticky top-0 z-50 flex items-center justify-between px-6 transition-all duration-300 ease-in-out ${scrolled ? 'py-4 bg-white/20 dark:bg-[#202124]/30 backdrop-blur-md' : 'py-5 bg-transparent'}`} 
            role="navigation" 
            aria-label="Dashboard navigation"
        >
            <div className="flex items-center gap-4">
                {showBack && (
                    <button 
                        className="p-2 text-textSecondary hover:text-text hover:bg-slate-700/50 rounded-full transition-colors border border-transparent hover:border-accent" 
                        onClick={onBack} 
                        type="button" 
                        aria-label="Go back"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <Logo asLink={false} />
                </div>
            </div>
            
            {/* Right side: Time and Profile */}
            <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-1 sm:gap-2 text-slate-500 font-medium text-sm sm:text-lg">
                    <span>{timeString}</span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="hidden sm:inline">{dateString}</span>
                </div>
                {onLogout && (
                    <div className="relative" ref={profileMenuRef}>
                        <button 
                            className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-accent transition-all overflow-hidden border border-transparent hover:border-accent" 
                            onClick={() => setShowProfileMenu(!showProfileMenu)} 
                            type="button" 
                            title="Account options"
                            aria-label="Account options"
                        >
                            {userPicture ? (
                                <img 
                                    src={userPicture} 
                                    alt="User account" 
                                    className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#ff2ea6] via-[#7b61ff] to-[#2d4fc2] flex items-center justify-center text-white font-bold text-sm sm:text-lg">
                                    {userName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            )}
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl p-4 z-50 border border-[#c4dbf6]" style={{ backgroundColor: 'aliceblue' }}>
                                <div className="flex flex-col items-center justify-center mb-4 text-[#02082c]">
                                    {userPicture ? (
                                        <img src={userPicture} alt="User" className="w-16 h-16 rounded-full mb-2 object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff2ea6] to-[#2d4fc2] flex items-center justify-center text-white font-bold text-2xl mb-2">
                                            {userName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div className="font-bold text-lg">{userName || 'User'}</div>
                                    <div className="text-sm text-slate-500 break-all">{userEmail || 'No email provided'}</div>
                                </div>
                                <div className="w-full h-px bg-slate-200 mb-3"></div>
                                <button 
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        onLogout();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-slate-50 text-red-500 rounded-lg border border-slate-200 transition-colors font-medium shadow-sm"
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
