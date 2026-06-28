import '../styles/history.css';
import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardNav from '../components/layout/DashboardNav'
import SectionHeader from '../components/layout/SectionHeader'
import MeetingCard from '../components/layout/MeetingCard'
import EmptyState from '../components/layout/EmptyState'
import SearchBar from '../components/layout/SearchBar'
import FilterChips from '../components/layout/FilterChips'
import SkeletonCard from '../components/layout/SkeletonCard'
import { Info } from 'lucide-react'

const FILTERS = ['All', 'Today', 'This Week', 'This Month'];

export default function History() {
    const { getHistoryOfUser, addToUserHistory, deleteUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState(null);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history || []);
            } catch {
                // Ignore errors
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredMeetings = useMemo(() => {
        let result = [...meetings];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(m => m.meetingCode.toLowerCase().includes(q));
        }
        const now = new Date();
        if (activeFilter === 'Today') {
            result = result.filter(m => new Date(m.date).toDateString() === now.toDateString());
        } else if (activeFilter === 'This Week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            result = result.filter(m => new Date(m.date) >= weekAgo);
        } else if (activeFilter === 'This Month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            result = result.filter(m => new Date(m.date) >= monthAgo);
        }
        return result;
    }, [meetings, searchQuery, activeFilter]);

    const handleRejoin = useCallback(async (meetingCode) => {
        await addToUserHistory(meetingCode);
        routeTo(`/${meetingCode}`);
    }, [addToUserHistory, routeTo]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDeleteConfirm = async () => {
        if (!meetingToDelete) return;
        setIsDeleting(true);
        
        const previousMeetings = [...meetings];
        setMeetings(prev => prev.filter(m => m.meetingCode !== meetingToDelete));

        try {
            await deleteUserHistory(meetingToDelete);
            showToast('success', 'Meeting removed from history.');
            setMeetingToDelete(null);
        } catch {
            setMeetings(previousMeetings);
            showToast('error', 'Failed to delete meeting.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="dash-page auth-gradient-bg">
            <DashboardNav showBack onBack={() => routeTo("/home")} />
            
            <main className="max-w-6xl mx-auto px-6 py-8 pb-20">
                <header className="mb-10">
                    <SectionHeader
                        title="Meeting History"
                        description="Browse and manage all your past meetings"
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 auth-glass-card p-4">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by meeting code..."
                        />
                        <FilterChips
                            filters={FILTERS}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                    </div>
                </header>

                {!loading && filteredMeetings.length > 0 && (
                    <div className="flex items-center gap-2 mb-6 text-sm text-[#0b5cff] bg-[#0b5cff]/10 px-4 py-2 rounded-lg border border-[#0b5cff]/20 w-fit">
                        <Info size={16} className="text-[#0b5cff]" />
                        <span>{filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} found</span>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filteredMeetings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMeetings.map((m, i) => (
                            <MeetingCard
                                key={m.meetingCode + '-' + i}
                                meetingCode={m.meetingCode}
                                date={m.date}
                                onRejoin={() => handleRejoin(m.meetingCode)}
                                onDelete={setMeetingToDelete}
                                delay={i * 60}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title={searchQuery || activeFilter !== 'All' ? 'No matches found' : 'No meeting history yet'}
                        description={searchQuery || activeFilter !== 'All' ? 'Try adjusting your search or filters' : 'Your past meetings will appear here.'}
                        actionLabel={searchQuery || activeFilter !== 'All' ? 'Clear Filters' : 'Create New Meeting'}
                        onAction={searchQuery || activeFilter !== 'All' ? () => { setSearchQuery(''); setActiveFilter('All'); } : () => routeTo('/home')}
                    />
                )}
            </main>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
                    <div className={`px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 border ${
                        toast.type === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                        <Info size={18} />
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {meetingToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02082c]/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm auth-glass-card overflow-hidden animate-scale-in">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center mx-auto mb-4">
                                <Info size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Meeting?</h3>
                            <p className="text-sm text-white/70 mb-8">This action cannot be undone. Are you sure you want to remove this meeting from your history?</p>
                            <div className="flex items-center gap-3">
                                <button 
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-colors" 
                                    onClick={() => setMeetingToDelete(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="flex-1 px-4 py-2.5 auth-danger-btn" 
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}