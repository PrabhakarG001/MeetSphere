import '../../styles/DashboardNav.css';
import '../../styles/theme.css';
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, Clock, LogOut, MoreVertical } from 'lucide-react';
import Logo from '../common/Logo';

export default function DashboardNav({ showBack, onBack, onHistory, onLogout, userPicture, userName }) {
    const [scrolled, setScrolled] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMobileMenu(false);
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
                    <button 
                        className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-accent transition-all overflow-hidden border border-transparent hover:border-accent" 
                        onClick={onLogout} 
                        type="button" 
                        title="Click to logout"
                        aria-label="Log out"
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
                )}
            </div>
        </nav>
    );
}
