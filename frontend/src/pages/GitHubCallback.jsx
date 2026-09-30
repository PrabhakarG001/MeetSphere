import { useEffect, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import GitHubIcon from "../components/common/GitHubIcon";

// Landing page for the GitHub OAuth popup. It forwards the result to the
// meeting window that opened it (same origin only) and closes itself. No
// token ever passes through this page - only a status and a safe message.
export default function GitHubCallback() {
    const [result] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status") === "ok" ? "ok" : "error";
        return { status, message: params.get("message") || "" };
    });

    useEffect(() => {
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                    { type: "github-auth", status: result.status, message: result.message },
                    window.location.origin
                );
            }
        } catch {
            // Opener may be gone; the fallback UI below still works.
        }

        if (result.status === "ok") {
            const timer = setTimeout(() => {
                try {
                    window.close();
                } catch {
                    // Window was not script-opened; user can close it manually.
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [result]);

    return (
        <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4">
                    <GitHubIcon size={22} className="text-white" />
                </div>

                {result.status === "ok" ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                            <Check size={20} className="text-green-400" />
                        </div>
                        <h1 className="text-lg font-semibold text-white">GitHub connected</h1>
                        <p className="text-sm text-slate-400">
                            You can close this window and continue your meeting.
                        </p>
                        <a href="/" className="text-sm text-[#8ab4f8] hover:underline">
                            Back to MeetSphere
                        </a>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                            <AlertCircle size={20} className="text-red-400" />
                        </div>
                        <h1 className="text-lg font-semibold text-white">Could not connect GitHub</h1>
                        <p className="text-sm text-slate-400" role="alert">
                            {result.message || "Something went wrong while connecting GitHub."}
                        </p>
                        <a href="/" className="text-sm text-[#8ab4f8] hover:underline">
                            Back to MeetSphere
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
