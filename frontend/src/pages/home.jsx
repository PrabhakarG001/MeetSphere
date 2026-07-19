import '../styles/home.css';
import '../styles/landing.css'; // Import Landing CSS for heroButton styles
import { useContext, useState, useCallback, useEffect, useRef } from "react";
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import server from '../../environment';
import DashboardNav from '../components/layout/DashboardNav';
import { Video, Keyboard, ChevronLeft, ChevronRight, ShieldCheck, Link, Calendar, Plus, Copy, Check, X } from 'lucide-react';

const carouselItems = [
    {
        image: "/Sharelink.png",
        title: "Get a link you can share",
        text: <>Click <strong>New meeting</strong> to get a link you can send to people you want to meet with</>,
        scale: "scale-[1.6] rounded-full border-[3px] border-[#0b5cff] p-4"
    },
    {
        image: "/Secure.png",
        title: "Your meeting is safe",
        text: "No one can join a meeting unless invited or admitted by the host",
        scale: "scale-[1.35]"
    }
];

function HomeComponent() {
    const navigate = useNavigate();
    const { addToUserHistory, userData } = useContext(AuthContext);
    const [meetingCode, setMeetingCode] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());

    // New Meeting Options State
    const [showDropdown, setShowDropdown] = useState(false);
    const [showLaterModal, setShowLaterModal] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
        const slideTimer = setInterval(() => setCurrentSlide(prev => (prev + 1) % carouselItems.length), 5000);
        
        return () => {
            clearInterval(timer);
            clearInterval(slideTimer);
        };
    }, []);

    const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

    const handleJoinVideoCall = useCallback(() => {
        if (!meetingCode) return;
        // Basic check if they pasted a full link or just the code
        let code = meetingCode.trim();
        if (code.includes('http')) {
            const parts = code.split('/');
            code = parts[parts.length - 1];
        }
        navigate(`/room/${code}`);
    }, [meetingCode, navigate]);

    const handleNewMeeting = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token || !userData) {
                alert("Please login to create a meeting.");
                navigate('/login');
                return;
            }

            const response = await fetch(`${server}/api/v1/meetings/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: userData.username || userData.name || "Host" })
            });
            const data = await response.json();
            
            if (response.ok && data.meetingCode) {
                addToUserHistory(data.meetingCode).catch(e => console.error("Could not add to history:", e));
                navigate(`/room/${data.meetingCode}`);
            } else {
                alert(data.message || "Failed to create meeting");
            }
        } catch (error) {
            console.error("Error creating meeting:", error);
            alert("Error creating meeting. Please try again.");
        }
    }, [addToUserHistory, navigate, userData]);

    const handleCreateForLater = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token || !userData) {
                alert("Please login to create a meeting.");
                navigate('/login');
                return;
            }

            const response = await fetch(`${server}/api/v1/meetings/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: userData.username || userData.name || "Host" })
            });
            const data = await response.json();
            
            if (response.ok && data.meetingCode) {
                const link = `${window.location.origin}/room/${data.meetingCode}`;
                setGeneratedLink(link);
                setShowDropdown(false);
                setShowLaterModal(true);
            } else {
                alert(data.message || "Failed to create meeting");
            }
        } catch (error) {
            console.error("Error creating meeting:", error);
            alert("Error creating meeting. Please try again.");
        }
    }, [userData, navigate]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link: ', err);
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/auth");
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            <DashboardNav onHistory={() => navigate("/history")} onLogout={handleLogout} />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 w-full flex flex-col md:flex-row items-center justify-between gap-12">
                
                {/* Left side actions (Google Meet style) */}
                <div className="flex-1 w-full max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-normal text-slate-900 mb-2 tracking-tight">
                        Premium video meetings.
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-normal text-slate-600 mb-10 tracking-tight">
                        Now free for everyone.
                    </h2>
                    
                    <p className="text-lg text-slate-500 mb-10 max-w-xl">
                        Connect, collaborate, and celebrate from anywhere with MeetSphere. Crystal-clear video calls tailored for modern teams.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-center justify-center sm:justify-start w-full mt-4">
                        
                        {/* New Meeting Button with Dropdown */}
                        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                            <button 
                                className="heroButton heroButtonPrimary flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto !min-h-[48px] !px-6" 
                                onClick={() => setShowDropdown(!showDropdown)}
                                type="button"
                            >
                                <Video size={20} />
                                <span>New meeting</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white rounded-md shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-100 py-1 z-50">
                                    <button
                                        onClick={handleCreateForLater}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-slate-700 transition-colors"
                                    >
                                        <Link size={18} className="text-slate-500" />
                                        <span className="font-medium text-sm">Create a meeting for later</span>
                                    </button>
                                    <button
                                        onClick={handleNewMeeting}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-slate-700 transition-colors"
                                    >
                                        <Plus size={18} className="text-slate-500" />
                                        <span className="font-medium text-sm">Start an instant meeting</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative flex items-center w-full sm:w-auto mt-2 sm:mt-0">
                            <div className="absolute left-4 text-slate-400">
                                <Keyboard size={20} />
                            </div>
                            <input
                                className="w-full sm:w-64 pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#7b61ff] focus:ring-1 focus:ring-[#7b61ff] transition-all"
                                type="text"
                                placeholder="Enter a code or link"
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleJoinVideoCall()}
                            />
                        </div>

                        {meetingCode.trim().length > 0 && (
                            <button 
                                onClick={handleJoinVideoCall}
                                className="w-full sm:w-auto px-6 py-3 text-[#7b61ff] font-semibold hover:bg-purple-50 rounded-lg transition-colors mt-2 sm:mt-0"
                            >
                                Join
                            </button>
                        )}
                    </div>

                    {/* Removed Schedule and Share Screen buttons per user request */}
                    <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
                    </div>
                </div>

                {/* Right side visual elements (Graphic and Time) */}
                <div className="flex flex-col items-center justify-center w-full max-w-md mt-16 md:mt-0">
                    
                    {/* Feature Showcase (Google Meet Style Carousel) */}
                    <div className="w-full max-w-md flex flex-col items-center justify-center text-center mb-12 min-h-[360px]">
                        
                        {/* Image with side arrows */}
                        <div className="flex items-center justify-center gap-2 sm:gap-8 mb-6 w-full">
                            <button 
                                onClick={() => setCurrentSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length)}
                                className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {carouselItems[currentSlide].image.startsWith("lucide:") ? (
                                    <ShieldCheck size={160} className="text-[#0b5cff] opacity-80 transition-opacity duration-500" strokeWidth={1.5} />
                                ) : (
                                    <img 
                                        src={carouselItems[currentSlide].image} 
                                        alt={carouselItems[currentSlide].title} 
                                        className={`h-40 sm:h-56 w-full object-contain transition-all duration-500 mix-blend-multiply ${carouselItems[currentSlide].scale || ''}`} 
                                    />
                                )}
                            </div>

                            <button 
                                onClick={() => setCurrentSlide(prev => (prev + 1) % carouselItems.length)}
                                className="p-1 sm:p-2 text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
                                aria-label="Next slide"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <h3 className="text-2xl font-normal text-slate-800 mb-3 tracking-tight">
                            {carouselItems[currentSlide].title}
                        </h3>
                        <p className="text-slate-500 max-w-[280px]">
                            {carouselItems[currentSlide].text}
                        </p>
                        
                        {/* Carousel Dots */}
                        <div className="flex gap-2 mt-8">
                            {carouselItems.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-[#0b5cff]' : 'bg-gray-300 hover:bg-gray-400'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                </div>

            </main>

            {/* Create for Later Modal */}
            {showLaterModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                        <button 
                            onClick={() => setShowLaterModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-medium text-slate-800 mb-2 tracking-tight">
                                Here's the link to your meeting
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
                            </p>
                        </div>

                        <div className="bg-gray-50 flex items-center justify-between p-3 rounded-lg border border-gray-200 group hover:border-gray-300 transition-colors">
                            <span className="text-slate-700 font-medium truncate pr-4 pl-1 selection:bg-[#e8f0fe] selection:text-[#0b5cff]">
                                {generatedLink}
                            </span>
                            <button 
                                onClick={copyToClipboard}
                                className={`p-2 rounded-md transition-all flex-shrink-0 ${isCopied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300'}`}
                                title="Copy meeting link"
                            >
                                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export { HomeComponent as GuestHomeComponent };
export default withAuth(HomeComponent);
