import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, ExternalLink, AlertCircle, Plus, RefreshCw, FileText } from 'lucide-react';
import server from '../../../environment';
import GitHubIcon from '../common/GitHubIcon';

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const Spinner = () => (
    <span
        className="inline-block w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
    />
);

// "Push to GitHub" exports the meeting chat + participant list as a Markdown
// file into a repository the user picks (or creates). All GitHub token handling
// happens on the backend - the browser only ever sees connection status.
export default function PushGitHubModal({ onClose, messages = [], username = "", videos = [] }) {
    const meetingCode = useMemo(
        () => (window.location.pathname.split('/').filter(Boolean).pop() || 'meeting')
            .replace(/[^A-Za-z0-9._-]/g, '-'),
        []
    );

    const initialExport = useMemo(() => {
        const now = new Date();
        const participants = [
            { name: username || 'You', host: false, self: true },
            ...videos.map(v => ({ name: v.username || 'Guest', host: Boolean(v.isHost), self: false }))
        ];
        const lines = [
            '# MeetSphere Meeting Chat',
            '',
            `- **Meeting:** \`${meetingCode}\``,
            `- **Date:** ${now.toLocaleString()}`,
            `- **Exported by:** ${username || 'Participant'}`,
            '',
            `## Participants (${participants.length})`,
            ...participants.map(p => `- ${p.name}${p.host ? ' (Host)' : ''}${p.self ? ' (You)' : ''}`),
            '',
            '## Chat',
            ''
        ];
        if (messages.length > 0) {
            messages.forEach(m => lines.push(`**${m.sender || 'Participant'}:** ${m.data}`));
        } else {
            lines.push('_No messages were sent in this meeting._');
        }
        lines.push('');
        return {
            content: lines.join('\n'),
            path: `meetings/${meetingCode}-${now.toISOString().slice(0, 10)}.md`
        };
    }, [messages, username, videos, meetingCode]);

    // loading | signed-out | connect | ready | success
    const [phase, setPhase] = useState('loading');
    const [status, setStatus] = useState(null);
    const [configured, setConfigured] = useState(true);

    const [authBusy, setAuthBusy] = useState(false);
    const [authError, setAuthError] = useState('');

    const [repos, setRepos] = useState([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [reposError, setReposError] = useState('');
    const [repoMode, setRepoMode] = useState('existing');
    const [selectedRepo, setSelectedRepo] = useState('');
    const [newRepoName, setNewRepoName] = useState('');
    const [newRepoPrivate, setNewRepoPrivate] = useState(true);
    const [creatingRepo, setCreatingRepo] = useState(false);
    const [createError, setCreateError] = useState('');

    const [filePath, setFilePath] = useState(initialExport.path);
    const [commitMessage, setCommitMessage] = useState(`Export meeting chat (${meetingCode})`);
    const [content, setContent] = useState(initialExport.content);
    const [pushing, setPushing] = useState(false);
    const [pushError, setPushError] = useState('');
    const [successUrl, setSuccessUrl] = useState('');

    const popupRef = useRef(null);
    const watchCleanupRef = useRef(null);

    const stopAuthWatch = useCallback(() => {
        if (watchCleanupRef.current) {
            watchCleanupRef.current();
            watchCleanupRef.current = null;
        }
    }, []);

    const loadRepos = useCallback(async () => {
        setReposLoading(true);
        setReposError('');
        try {
            const res = await fetch(`${server}/api/v1/github/repos`, { headers: authHeaders() });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setPhase('signed-out');
                return;
            }
            if (!res.ok) {
                if (data.connected === false) {
                    setPhase('connect');
                }
                setReposError(data.message || 'Could not load your repositories.');
                return;
            }
            setRepos(data.repos || []);
            setSelectedRepo(prev => prev || (data.repos && data.repos[0] ? data.repos[0].fullName : ''));
        } catch {
            setReposError('Could not load your repositories.');
        } finally {
            setReposLoading(false);
        }
    }, []);

    const loadStatus = useCallback(async () => {
        if (!localStorage.getItem('token')) {
            setPhase('signed-out');
            return;
        }
        try {
            const res = await fetch(`${server}/api/v1/github/status`, { headers: authHeaders() });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setPhase('signed-out');
                return;
            }
            if (!res.ok) {
                setAuthError(data.message || 'Could not check the GitHub connection.');
                setPhase('connect');
                return;
            }
            setConfigured(data.configured !== false);
            setStatus(data);
            if (data.connected) {
                setPhase('ready');
                loadRepos();
            } else {
                setPhase('connect');
            }
        } catch {
            setAuthError('Could not reach the server to check the GitHub connection.');
            setPhase('connect');
        }
    }, [loadRepos]);

    useEffect(() => {
        // Deferred so the effect body itself never sets state synchronously.
        const timer = setTimeout(loadStatus, 0);
        return () => {
            clearTimeout(timer);
            stopAuthWatch();
            try {
                popupRef.current?.close?.();
            } catch {
                // Popup may already be closed.
            }
        };
    }, [loadStatus, stopAuthWatch]);

    const connectGitHub = async () => {
        setAuthBusy(true);
        setAuthError('');
        try {
            const res = await fetch(`${server}/api/v1/github/login`, { headers: authHeaders() });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setPhase('signed-out');
                return;
            }
            if (!res.ok) {
                if (data.configured === false) setConfigured(false);
                setAuthError(data.message || 'Could not start GitHub sign-in.');
                return;
            }

            const popup = window.open(data.authUrl, 'meetsphere-github-auth', 'width=520,height=640');
            if (!popup) {
                setAuthError('The sign-in window was blocked. Allow popups for this site and try again.');
                return;
            }
            popupRef.current = popup;

            const handleMessage = (event) => {
                if (event.origin !== window.location.origin) return;
                if (!event.data || event.data.type !== 'github-auth') return;
                stopAuthWatch();
                try {
                    popup.close();
                } catch {
                    // Already closed.
                }
                if (event.data.status === 'ok') {
                    setAuthError('');
                    setPhase('ready');
                    loadStatus();
                } else {
                    setAuthError(event.data.message || 'GitHub sign-in was cancelled.');
                }
            };

            window.addEventListener('message', handleMessage);

            const interval = setInterval(() => {
                if (popup.closed) {
                    stopAuthWatch();
                    setAuthError(prev => prev || 'The GitHub window was closed before sign-in finished. Try again.');
                }
            }, 800);

            const timeout = setTimeout(() => {
                stopAuthWatch();
                try {
                    popup.close();
                } catch {
                    // Already closed.
                }
                setAuthError(prev => prev || 'GitHub sign-in timed out. Please try again.');
            }, 120000);

            watchCleanupRef.current = () => {
                window.removeEventListener('message', handleMessage);
                clearInterval(interval);
                clearTimeout(timeout);
            };
        } catch {
            setAuthError('Could not start GitHub sign-in.');
        } finally {
            setAuthBusy(false);
        }
    };

    const createRepo = async () => {
        const name = newRepoName.trim();
        if (!name) {
            setCreateError('Enter a repository name.');
            return;
        }
        setCreatingRepo(true);
        setCreateError('');
        try {
            const res = await fetch(`${server}/api/v1/github/repos`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, private: newRepoPrivate })
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setPhase('signed-out');
                return;
            }
            if (!res.ok) {
                if (data.connected === false) {
                    setPhase('connect');
                }
                setCreateError(data.message || 'Could not create the repository.');
                return;
            }
            const repo = data.repo;
            setRepos(prev => [repo, ...prev.filter(r => r.fullName !== repo.fullName)]);
            setSelectedRepo(repo.fullName);
            setRepoMode('existing');
            setNewRepoName('');
        } catch {
            setCreateError('Could not create the repository.');
        } finally {
            setCreatingRepo(false);
        }
    };

    const pushToGitHub = async () => {
        if (!selectedRepo) {
            setPushError('Select a repository first.');
            return;
        }
        if (!filePath.trim()) {
            setPushError('Enter a file path.');
            return;
        }
        if (!content.trim()) {
            setPushError('There is no content to push.');
            return;
        }
        setPushing(true);
        setPushError('');
        try {
            const res = await fetch(`${server}/api/v1/github/push`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoFullName: selectedRepo,
                    path: filePath.trim(),
                    message: commitMessage.trim(),
                    content
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setPhase('signed-out');
                return;
            }
            if (!res.ok) {
                if (data.connected === false) {
                    setPhase('connect');
                    return;
                }
                setPushError(data.message || 'Could not push to GitHub.');
                return;
            }
            setSuccessUrl(data.htmlUrl || '');
            setPhase('success');
        } catch {
            setPushError('Could not push to GitHub. Check your connection and try again.');
        } finally {
            setPushing(false);
        }
    };

    const inputClass = "w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors";
    const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <GitHubIcon size={18} className="text-white" />
                        <h3 className="text-white font-semibold text-[15px] m-0">Push chat to GitHub</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        aria-label="Close"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {phase === 'loading' && (
                        <div className="flex items-center justify-center gap-3 py-8 text-slate-400 text-sm">
                            <Spinner />
                            <span>Checking GitHub connection...</span>
                        </div>
                    )}

                    {phase === 'signed-out' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-200" role="alert">
                            Push to GitHub needs a MeetSphere account. Sign in, then reopen this dialog to connect
                            your GitHub account and push meeting chats.
                        </div>
                    )}

                    {phase === 'connect' && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400 leading-relaxed m-0">
                                Connect your GitHub account to export this meeting's chat and participant list
                                as a Markdown file into one of your repositories. Your GitHub token is stored
                                securely on the MeetSphere server and is never sent to the browser.
                            </p>

                            {authError && (
                                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300" role="alert">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            {!configured && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-200" role="alert">
                                    GitHub integration is not configured on this server yet. Set
                                    <code className="mx-1 px-1 rounded bg-black/30">GITHUB_CLIENT_ID</code>
                                    and
                                    <code className="mx-1 px-1 rounded bg-black/30">GITHUB_CLIENT_SECRET</code>
                                    on the backend to enable it.
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={connectGitHub}
                                disabled={authBusy || !configured}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#8ab4f8] text-[#202124] font-semibold text-sm hover:bg-[#9ebcf0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {authBusy ? <Spinner /> : <GitHubIcon size={16} />}
                                {authBusy ? 'Opening GitHub...' : 'Connect GitHub'}
                            </button>
                        </div>
                    )}

                    {phase === 'ready' && (
                        <div className="space-y-4">
                            {/* Connection chip */}
                            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                <span className="text-sm text-slate-300 truncate">
                                    Connected as <span className="text-white font-medium">{status?.login || 'GitHub'}</span>
                                </span>
                            </div>

                            {/* Repository */}
                            <div>
                                <span className={labelClass}>Repository</span>
                                <div className="flex gap-2 p-1 bg-[#1a1a1a] rounded-lg border border-[#333333] mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setRepoMode('existing')}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${repoMode === 'existing' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Existing repository
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRepoMode('new')}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${repoMode === 'new' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        New repository
                                    </button>
                                </div>

                                {repoMode === 'existing' ? (
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedRepo}
                                            onChange={(e) => setSelectedRepo(e.target.value)}
                                            className="flex-1 min-w-0 bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                                            disabled={reposLoading}
                                        >
                                            <option value="">
                                                {reposLoading ? 'Loading repositories...' : 'Select a repository...'}
                                            </option>
                                            {repos.map(repo => (
                                                <option key={repo.fullName} value={repo.fullName}>
                                                    {repo.fullName}{repo.private ? ' (private)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={loadRepos}
                                            disabled={reposLoading}
                                            className="px-3 rounded-lg border border-[#333333] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                            title="Refresh repositories"
                                            aria-label="Refresh repositories"
                                        >
                                            <RefreshCw size={15} className={reposLoading ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 focus-within:border-blue-500 transition-colors">
                                            <span className="text-xs text-slate-500 flex-shrink-0">
                                                {status?.login ? `github.com/${status.login}/` : 'github.com/'}
                                            </span>
                                            <input
                                                type="text"
                                                value={newRepoName}
                                                onChange={(e) => setNewRepoName(e.target.value)}
                                                placeholder="meeting-exports"
                                                className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-600 outline-none py-2.5"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newRepoPrivate}
                                                onChange={(e) => setNewRepoPrivate(e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-600 bg-transparent text-blue-500"
                                            />
                                            Keep this repository private
                                        </label>
                                        <button
                                            type="button"
                                            onClick={createRepo}
                                            disabled={creatingRepo}
                                            className="flex items-center gap-2 py-2 px-4 rounded-lg border border-[#333333] text-sm text-slate-200 hover:border-slate-500 hover:bg-white/5 transition-colors disabled:opacity-50"
                                        >
                                            {creatingRepo ? <Spinner /> : <Plus size={15} />}
                                            {creatingRepo ? 'Creating...' : 'Create repository'}
                                        </button>
                                    </div>
                                )}

                                {reposError && (
                                    <p className="text-xs text-red-400 mt-2 m-0" role="alert">
                                        {reposError}{' '}
                                        <button type="button" onClick={loadRepos} className="underline hover:text-red-300">Retry</button>
                                    </p>
                                )}
                                {createError && (
                                    <p className="text-xs text-red-400 mt-2 m-0" role="alert">{createError}</p>
                                )}
                            </div>

                            {/* File */}
                            <div>
                                <label className={labelClass}>File path</label>
                                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 focus-within:border-blue-500 transition-colors">
                                    <FileText size={14} className="text-slate-500 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={filePath}
                                        onChange={(e) => setFilePath(e.target.value)}
                                        placeholder="meetings/notes.md"
                                        className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-slate-600 outline-none py-2.5 font-mono"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5 m-0">
                                    Markdown file containing the chat transcript and participant list.
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>Commit message</label>
                                <input
                                    type="text"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className={inputClass}
                                    maxLength={190}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>File content (editable)</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={8}
                                    className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2.5 text-xs font-mono text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed"
                                />
                            </div>

                            {pushError && (
                                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300" role="alert">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{pushError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'success' && (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                                <Check size={24} className="text-green-400" />
                            </div>
                            <h4 className="text-white font-semibold text-base m-0">Pushed to {selectedRepo}</h4>
                            <p className="text-sm text-slate-400 font-mono m-0">{filePath}</p>
                            {successUrl && (
                                <a
                                    href={successUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm text-[#8ab4f8] hover:underline"
                                >
                                    <ExternalLink size={14} />
                                    View commit on GitHub
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(phase === 'ready' || phase === 'connect') && (
                    <div className="px-5 py-4 border-t border-white/5 flex justify-end gap-2 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        {phase === 'ready' && (
                            <button
                                type="button"
                                onClick={pushToGitHub}
                                disabled={pushing || !selectedRepo}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8ab4f8] text-[#202124] font-semibold text-sm hover:bg-[#9ebcf0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pushing ? <Spinner /> : <GitHubIcon size={15} />}
                                {pushing ? 'Pushing...' : 'Push to GitHub'}
                            </button>
                        )}
                    </div>
                )}

                {phase === 'success' && (
                    <div className="px-5 py-4 border-t border-white/5 flex justify-end flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-[#8ab4f8] text-[#202124] font-semibold text-sm hover:bg-[#9ebcf0] transition-all"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
