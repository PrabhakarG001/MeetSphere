import '../../styles/DashboardNav.css';
import { useState, useEffect } from "react";
import { ChevronLeft, Clock, LogOut } from 'lucide-react';

export default function DashboardNav({ showBack, onBack, onHistory, onLogout }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        // Check initial state
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav 
            className={`sticky top-0 z-50 flex items-center justify-between px-6 transition-all duration-300 ease-in-out ${scrolled ? 'py-4 bg-[#02082c]/45 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'py-5 bg-transparent border-b border-transparent shadow-none'}`} 
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
                    <img src="/logo-navbar.png" alt="MeetSphere" className="object-contain transition-transform hover:scale-105" style={{ width: '1.8em', height: '1.8em' }} />
                    <h2 
                        className="text-xl tracking-tight transition-transform hover:scale-105" 
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
            <div className="flex items-center gap-3">
                {onHistory && (
                    <button 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-textSecondary hover:text-text hover:bg-slate-700/50 rounded-lg transition-all" 
                        onClick={onHistory} 
                        type="button" 
                        aria-label="View meeting history"
                    >
                        <Clock size={16} />
                        <span>History</span>
                    </button>
                )}
                {onLogout && (
                    <button 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" 
                        onClick={onLogout} 
                        type="button" 
                        aria-label="Log out"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                )}
            </div>
        </nav>
    );
}
