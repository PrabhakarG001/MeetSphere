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
        <div className="min-h-screen landingPageContainer font-sans flex flex-col">
            <DashboardNav onHistory={() => navigate("/history")} onLogout={handleLogout} userPicture={userData?.picture} userName={userData?.name} />
            
            <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 w-full flex flex-col md:flex-row items-center justify-between gap-12">
                
                {/* Left side actions (Google Meet style) */}
                <div className="flex-1 w-full max-w-2xl lg:pr-8">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
                        Premium video meetings.
                    </h1>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-6 tracking-tight">
                        Now free for everyone.
                    </h2>
                    
                    <p className="text-lg text-slate-500/90 mb-12 max-w-xl leading-relaxed">
                        Connect, collaborate, and celebrate from anywhere with MeetSphere. Crystal-clear video calls tailored for modern teams.
                    </p>

                    {/* Quick Actions Panel */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6 w-full max-w-xl relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4">Quick Actions</h3>
                            
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
                                
                                <button
                                    onClick={handleScheduleMeeting}
                                    className="flex items-center justify-center gap-2 w-full sm:w-1/2 h-[52px] font-medium text-[#0b5cff] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 shadow-sm"
                                >
                                    <Calendar size={20} />
                                    <span>Schedule</span>
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                <div className="relative flex-1">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Keyboard size={20} />
                                    </div>
                                    <input
                                        className="w-full h-[52px] pl-12 pr-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#7b61ff] focus:ring-1 focus:ring-[#7b61ff] focus:bg-white transition-all"
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
                                    className={`h-[52px] px-8 font-semibold rounded-lg transition-all ${meetingCode.trim().length > 0 ? 'bg-[#7b61ff] text-white hover:bg-[#694ce6] shadow-md hover:shadow-lg' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
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
                    <div className="w-full bg-slate-50/50 p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.03)] flex flex-col items-center justify-center text-center min-h-[420px] relative overflow-hidden group">
                        
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
