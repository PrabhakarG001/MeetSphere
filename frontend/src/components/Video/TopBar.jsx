import '../../styles/TopBar.css';
import { Copy, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';

export default function TopBar({ user, username, handleCopyInviteLink, inviteCopied }) {
    const router = useNavigate();

    // Helper to get initials if user has no picture
    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="absolute top-0 left-0 right-0 w-full p-4 z-30 pointer-events-none flex items-center justify-between">
            {/* Left side: MeetSphere Logo */}
            <div className="flex items-center">
                <div className="pointer-events-auto">
                    <Logo />
                </div>
            </div>

            {/* Right side: User Profile (Google Meet Style) */}
            <div className="pointer-events-auto flex items-center">
                {user?.picture ? (
                    <img 
                        src={user.picture} 
                        alt={user?.name || username || "Guest"} 
                        className="w-9 h-9 rounded-full border border-white/20 shadow-md object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium border border-white/20 shadow-md">
                        {getInitials(user?.name || username || "Guest")}
                    </div>
                )}
            </div>
        </div>
    );
}
