import '../styles/home.css';
import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css"
import { AuthContext } from '../contexts/AuthContext'
import DashboardNav from '../components/layout/DashboardNav'
import SectionHeader from '../components/layout/SectionHeader'
import StatsCard from '../components/layout/StatsCard'
import MeetingCard from '../components/layout/MeetingCard'
import EmptyState from '../components/layout/EmptyState'
import ActionCard from '../components/layout/ActionCard'
import SkeletonCard from '../components/layout/SkeletonCard'
import { Video, Calendar, Clock, Sparkles, Plus, Keyboard, History } from 'lucide-react'

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory, getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history || []);
            } catch {
                // Silent fail for guests or errors
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, []);

    const handleJoinVideoCall = useCallback(() => {
        if (!meetingCode.trim()) return;
        
        // Fire and forget history API, do not block navigation
        addToUserHistory(meetingCode).catch(e => console.error("Could not add to history:", e));
        
        navigate(`/${meetingCode}`);
    }, [meetingCode, addToUserHistory, navigate]);

    const handleNewMeeting = useCallback(() => {
        const randomPart = Math.random().toString(36).slice(2, 8);
        const code = `meet-${Date.now().toString(36)}-${randomPart}`;
        
        // Fire and forget history API, do not block navigation
        addToUserHistory(code).catch(e => console.error("Could not add to history:", e));
        
        navigate(`/${code}`);
    }, [addToUserHistory, navigate]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/auth");
    }, [navigate]);

    const stats = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = meetings.filter(m => new Date(m.date) >= weekAgo).length;
        return { total: meetings.length, thisWeek, hours: '\u2014', summaries: '\u2014' };
    }, [meetings]);

    const recentMeetings = useMemo(() => meetings.slice(0, 3), [meetings]);

    return (
        <div className="dash-page auth-gradient-bg">
            <DashboardNav onHistory={() => navigate("/history")} onLogout={handleLogout} />
            <main className="max-w-6xl mx-auto px-6 py-8 pb-20">
                {/* Hero */}
                <section className="dash-hero auth-glass-card p-10 mb-12 flex flex-col items-center text-center">
                    
                    <div className="relative z-10 max-w-2xl">
                        <p className="text-blue-500 font-semibold tracking-wider uppercase text-xs mb-3">Your Workspace</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
                            Welcome back to MeetSphere
                        </h1>
                        <p className="text-lg text-slate-400 mb-0">
                            Connect effortlessly. Crystal-clear video calls tailored for modern teams.
                        </p>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12" aria-label="Meeting statistics">
                    <StatsCard icon={<Video size={24} />} value={stats.total} label="Total Meetings" delay={0} />
                    <StatsCard icon={<Calendar size={24} />} value={stats.thisWeek} label="This Week" delay={100} />
                    <StatsCard icon={<Clock size={24} />} value={stats.hours} label="Hours" delay={200} />
                    <StatsCard icon={<Sparkles size={24} />} value={stats.summaries} label="AI Summaries" delay={300} />
                </section>

                {/* Join */}
                <section className="mb-12 relative z-50 pointer-events-auto" id="join-section">
                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 auth-glass-card">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-white/10 border border-white/20 text-[#6a7cff] rounded-xl">
                                <Keyboard size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Join a Meeting</h3>
                                <p className="text-sm text-slate-400">Enter a code or link to connect instantly</p>
                            </div>
                        </div>
                        <div className="flex w-full md:w-auto gap-3">
                            <input
                                className="relative z-10 flex-1 md:w-64 px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#0b5cff] focus:border-transparent transition-all text-sm"
                                type="text"
                                placeholder="Enter meeting code..."
                                value={meetingCode}
                                onChange={e => setMeetingCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleJoinVideoCall()}
                                aria-label="Meeting code"
                                id="meeting-code-input"
                            />
                            <button 
                                className="relative z-50 pointer-events-auto px-6 py-3 auth-primary-btn whitespace-nowrap text-sm" 
                                onClick={handleJoinVideoCall} 
                                type="button"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="mb-12">
                    <SectionHeader title="Quick Actions" description="Get started with a single click" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ActionCard
                            icon={<Plus size={24} />}
                            title="New Meeting"
                            description="Start an instant meeting"
                            onClick={handleNewMeeting}
                        />
                        <ActionCard
                            icon={<Keyboard size={24} />}
                            title="Join Meeting"
                            description="Enter a code to join"
                            onClick={() => {
                                const section = document.getElementById('join-section');
                                section?.scrollIntoView({ behavior: 'smooth' });
                                setTimeout(() => {
                                    document.getElementById('meeting-code-input')?.focus();
                                }, 300);
                            }}
                        />
                        <ActionCard
                            icon={<Calendar size={24} />}
                            title="Schedule"
                            description="Plan your meetings"
                            disabled={true}
                            badge="Soon"
                        />
                        <ActionCard
                            icon={<History size={24} />}
                            title="Meeting History"
                            description="View past meetings"
                            onClick={() => navigate("/history")}
                        />
                    </div>
                </section>

                {/* Recent Meetings */}
                <section>
                    <SectionHeader
                        title="Recent Meetings"
                        description="Your latest sessions"
                        action={meetings.length > 0 ? { label: 'View All', onClick: () => navigate('/history') } : null}
                    />
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : recentMeetings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentMeetings.map((m, i) => (
                                <MeetingCard
                                    key={m.meetingCode + '-' + i}
                                    meetingCode={m.meetingCode}
                                    date={m.date}
                                    onRejoin={() => {
                                        addToUserHistory(m.meetingCode).catch(e => console.error(e));
                                        navigate(`/${m.meetingCode}`);
                                    }}
                                    delay={i * 100}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No meetings yet"
                            description="Start your first meeting or join one with a code to see your history here."
                            actionLabel="Start a Meeting"
                            onAction={handleNewMeeting}
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

export { HomeComponent as GuestHomeComponent };
export default withAuth(HomeComponent);
