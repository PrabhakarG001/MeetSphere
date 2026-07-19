import '../../styles/DashboardNav.css';
import { useState, useEffect } from "react";
import { ChevronLeft, Clock, LogOut } from 'lucide-react';

export default function DashboardNav({ showBack, onBack, onHistory, onLogout }) {
    const [scrolled, setScrolled] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        // Check initial state
        handleScroll();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(timer);
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
                        className="p-2 text-textSecondary hover:text-text hover:bg-slate-700/50 rounded-full transition-colors" 
                        onClick={onBack} 
                        type="button" 
                        aria-label="Go back"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <img src="/logo-navbar.png" alt="MeetSphere" className="object-contain transition-transform hover:scale-105" style={{ width: '2.5em', height: '2.5em' }} />
                    <h2 
                        className="text-2xl tracking-tight transition-transform hover:scale-105" 
                        style={{ 
                            background: 'linear-gradient(135deg, #ff2ea6 0%, #7b61ff 50%, #2d4fc2 100%)', 
                            WebkitBackgroundClip: 'text', 
                            WebkitTextFillColor: 'transparent',
                            fontWeight: '800'
                        }}
                    >
                        MeetSphere
                    </h2>
                </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
                <div className="hidden sm:flex items-center gap-2 text-slate-500 font-medium text-lg">
                    <span>{timeString}</span>
                    <span className="text-slate-300">•</span>
                    <span>{dateString}</span>
                </div>
                {onLogout && (
                    <button 
                        className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-slate-300 transition-all overflow-hidden" 
                        onClick={onLogout} 
                        type="button" 
                        title="Click to logout"
                        aria-label="Log out"
                    >
                        <img 
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=MeetSphereUser&backgroundColor=e2e8f0" 
                            alt="User account" 
                            className="w-10 h-10 object-cover"
                        />
                    </button>
                )}
            </div>
        </nav>
    );
}
