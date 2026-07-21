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
    },
    {
        image: "/Secure.png",
        title: "Your meeting is safe",
        text: "No one can join a meeting unless invited or admitted by the host",
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
        navigate(`/join/${code}`);
    }, [meetingCode, navigate]);

    const handleNewMeeting = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please login to create a meeting.");
                navigate('/login');
                return;
            }

            const response = await fetch(`${server}/api/v1/meetings/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userData?.username || userData?.name || "Host" })
            });
            const data = await response.json();
            
            if (response.ok && data.meetingCode) {
                localStorage.setItem(`host_${data.meetingCode}`, "true");
                addToUserHistory(data.meetingCode).catch(e => console.error("Could not add to history:", e));
                navigate(`/join/${data.meetingCode}`);
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
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userData.username || userData.name || "Host" })
            });
            const data = await response.json();
            
            if (response.ok && data.meetingCode) {
                localStorage.setItem(`host_${data.meetingCode}`, "true");
                const link = `${window.location.origin}/join/${data.meetingCode}`;
                setGeneratedLink(link);
                setShowDropdown(false);
                setShowLaterModal(true);
            } else {
                alert(data.message || "Failed to create meeting");
            }
        } catch (error) {
            console.error("Error creating meeting for later:", error);
            alert("Could not connect to server");
        }
    }, [userData, navigate]);

    const handleScheduleMeeting = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token || !userData) {
                alert("Please login to schedule a meeting.");
                navigate('/login');
                return;
            }

            const response = await fetch(`${server}/api/v1/meetings/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userData.username || userData.name || "Host" })
            });
            const data = await response.json();
            
            if (response.ok && data.meetingCode) {
                localStorage.setItem(`host_${data.meetingCode}`, "true");
                const meetingUrl = `${window.location.origin}/join/${data.meetingCode}`;
                
                const calUrl = new URL('https://calendar.google.com/calendar/r/eventedit');
                calUrl.searchParams.append('text', 'MeetSphere Video Meeting');
                calUrl.searchParams.append('details', `Join my MeetSphere video meeting here:\n${meetingUrl}`);
                calUrl.searchParams.append('location', meetingUrl);
                
                window.open(calUrl.toString(), '_blank');
            } else {
                alert(data.message || "Failed to create meeting");
            }
        } catch (error) {
            console.error("Error creating scheduled meeting:", error);
            alert("Could not connect to server");
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
        <div className="min-h-screen dash-page home-page-bg font-sans flex flex-col">
            <DashboardNav onHistory={() => navigate("/history")} onLogout={handleLogout} userPicture={userData?.picture} userName={userData?.name} />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 w-full flex flex-col md:flex-row items-center justify-between gap-12">
                
                {/* Left side actions (Google Meet style) */}
                <div className="flex-1 w-full max-w-2xl lg:pr-8">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                        Premium video meetings.
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-bold text-white/90 mb-6 tracking-tight">
                        Now free for everyone.
                    </h2>
                    
                    <p className="text-lg text-white/70 mb-12 max-w-xl leading-relaxed">
                        Connect, collaborate, and celebrate from anywhere with MeetSphere. Crystal-clear video calls tailored for modern teams.
                    </p>

                    {/* Quick Actions Panel */}
                    <div className="flex flex-col gap-6 w-full max-w-xl text-white mt-4">
                        <div>
                            <h3 className="text-sm font-bold tracking-wider text-[#ff6ec7] uppercase mb-4">Quick Actions</h3>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* New Meeting Button with Dropdown */}
                                <div className="relative w-full sm:w-1/2" ref={dropdownRef}>
                                    <button 
                                        className="heroButton heroButtonPrimary flex items-center justify-center gap-2 w-full h-[52px] font-medium shadow-sm transition-all hover:shadow-md" 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        type="button"
                                        style={{ borderRight: '3px solid #ff2ea6' }}
                                    >
                                        <Video size={20} />
                                        <span>New meeting</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-[#0a1a4a] rounded-md shadow-2xl border border-white/10 py-1 z-50">
                                            <button
                                                onClick={handleCreateForLater}
                                                className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 text-white/90 transition-colors"
                                            >
                                                <Link size={18} className="text-white/60" />
                                                <span className="font-medium text-sm">Create a meeting for later</span>
                                            </button>
                                            <button
                                                onClick={handleNewMeeting}
                                                className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-3 text-white/90 transition-colors"
                                            >
                                                <Plus size={18} className="text-white/60" />
                                                <span className="font-medium text-sm">Start an instant meeting</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <button
                                    onClick={handleScheduleMeeting}
                                    className="heroButton flex items-center justify-center gap-2 w-full sm:w-1/2 h-[52px] font-medium transition-all"
                                    style={{ backgroundColor: 'aliceblue', color: '#0F172A' }}
                                >
                                    <Calendar size={20} />
                                    <span>Schedule</span>
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                <div className="relative flex-1">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
                                        <Keyboard size={20} />
                                    </div>
                                    <input
                                        className="w-full h-[52px] pl-12 pr-4 bg-black/20 hover:bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#7b61ff] focus:ring-1 focus:ring-[#7b61ff] focus:bg-black/40 transition-all"
                                        type="text"
                                        placeholder="Enter a code or link"
                                        value={meetingCode}
                                        onChange={e => setMeetingCode(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleJoinVideoCall()}
                                    />
                                </div>
                                <button 
                                    onClick={handleJoinVideoCall}
                                    disabled={meetingCode.trim().length === 0}
                                    className={`h-[52px] px-8 font-semibold transition-all heroButton flex items-center justify-center ${meetingCode.trim().length > 0 ? 'heroButtonPrimary hover:shadow-md' : 'bg-white/10 text-white/40 cursor-not-allowed border-0'}`}
                                    style={meetingCode.trim().length > 0 ? { borderRight: '3px solid #ff2ea6' } : {}}
                                >
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side visual elements (Graphic and Time) */}
                <div className="flex flex-col items-center justify-center w-full max-w-lg mt-16 md:mt-0">
                    
                    {/* Feature Showcase (Google Meet Style Carousel) */}
                    <div className="w-full flex flex-col items-center justify-center text-center min-h-[420px] group text-white">
                        
                        {/* Image with side arrows */}
                        <div className="flex items-center justify-center gap-2 sm:gap-8 mb-6 w-full">
                            <button 
                                onClick={() => setCurrentSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length)}
                                className="p-1 sm:p-2 text-white/50 hover:text-white transition-colors flex-shrink-0"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <img 
                                    src={carouselItems[currentSlide].image} 
                                    alt={carouselItems[currentSlide].title} 
                                    className="h-40 sm:h-56 w-full object-contain transition-all duration-500 scale-[1.35]"
                                    style={{ filter: "brightness(0) invert(1) drop-shadow(0px 4px 10px rgba(255,255,255,0.2))" }}
                                />
                            </div>

                            <button 
                                onClick={() => setCurrentSlide(prev => (prev + 1) % carouselItems.length)}
                                className="p-1 sm:p-2 text-white/50 hover:text-white transition-colors flex-shrink-0"
                                aria-label="Next slide"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <h3 className="text-2xl font-normal text-white mb-3 tracking-tight">
                            {carouselItems[currentSlide].title}
                        </h3>
                        <p className="text-white/70 max-w-[280px]">
                            {carouselItems[currentSlide].text}
                        </p>
                        
                        {/* Carousel Dots */}
                        <div className="flex gap-2 mt-8">
                            {carouselItems.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-[#0b5cff]' : 'bg-white/30 hover:bg-white/50'}`}
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
                    <div className="bg-[#0a1a4a] border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6 relative text-white">
                        <button 
                            onClick={() => setShowLaterModal(false)}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                                Here's the link to your meeting
                            </h3>
                            <p className="text-sm text-white/70 leading-relaxed">
                                Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later, too.
                            </p>
                        </div>

                        <div className="bg-black/20 flex items-center justify-between p-3 rounded-lg border border-white/10 group hover:border-white/20 transition-colors">
                            <span className="text-white font-medium truncate pr-4 pl-1 selection:bg-[#e8f0fe] selection:text-[#0b5cff]">
                                {generatedLink}
                            </span>
                            <button 
                                onClick={copyToClipboard}
                                className={`p-2 rounded-md transition-all flex-shrink-0 ${isCopied ? 'bg-[#7b61ff] text-white' : 'bg-white/10 border border-white/10 shadow-sm text-white/70 hover:text-white hover:bg-white/20 hover:border-white/30'}`}
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
