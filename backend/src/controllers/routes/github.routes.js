import { Router } from "express";
import crypto from "node:crypto";
import { User } from "../models/user.model.js";

const router = Router();

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

const STATE_TTL_MS = 10 * 60 * 1000;
const MAX_CONTENT_CHARS = 1500000;
const REPO_NAME_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;
const REPO_FULL_NAME_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const FILE_PATH_PATTERN = /^[A-Za-z0-9._\-/]+$/;

// Short-lived OAuth state values, kept server-side only (same single-instance
// style as the socket connection maps) and single-use to prevent CSRF on the
// OAuth callback.
const pendingStates = new Map();

const getClientConfig = () => ({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI || "http://localhost:8000/api/v1/github/callback",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
});

const getAuthUser = async (req) => {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return null;
    const sessionToken = authHeader.slice(7).trim();
    if (!sessionToken) return null;
    return await User.findOne({ token: sessionToken });
};

const prunePendingStates = () => {
    const now = Date.now();
    for (const [state, entry] of pendingStates) {
        if (entry.expiresAt <= now) pendingStates.delete(state);
    }
};

const ghHeaders = (token, hasBody = false) => ({
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`,
    "User-Agent": "MeetSphere",
    ...(hasBody ? { "Content-Type": "application/json" } : {})
});

// Calls the GitHub API with the user's stored token. The token never leaves
// this process: it is never logged and never included in a client response.
const githubRequest = async (token, path, options = {}) => {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
        method: options.method || "GET",
        headers: ghHeaders(token, Boolean(options.body)),
        body: options.body
    });
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }
    return { status: response.status, data };
};

const describeGithubError = (status, data, fallback) => {
    if (status === 401) {
        return "Your GitHub connection has expired or was revoked. Reconnect and try again.";
    }
    const message = data?.message;
    if (typeof message === "string" && message.trim()) return message.trim();
    if (status === 403) {
        return "GitHub denied the request. Check that the MeetSphere OAuth app can access your repositories.";
    }
    return fallback;
};

// Starts the OAuth flow: returns the GitHub authorization URL. The client
// secret is only ever used server-side during the token exchange.
router.get("/login", async (req, res) => {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return res.status(401).json({ message: "Sign in to your MeetSphere account to connect GitHub." });
        }

        const { clientId, clientSecret, redirectUri } = getClientConfig();
        if (!clientId || !clientSecret) {
            return res.status(503).json({
                configured: false,
                message: "GitHub integration is not configured on this server yet."
            });
        }

        prunePendingStates();
        const state = crypto.randomBytes(24).toString("hex");
        pendingStates.set(state, { userId: user._id.toString(), expiresAt: Date.now() + STATE_TTL_MS });

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: "repo",
            state
        });
        return res.status(200).json({ authUrl: `${GITHUB_AUTHORIZE_URL}?${params.toString()}` });
    } catch (error) {
        console.error("Could not start GitHub sign-in:", error?.message);
        return res.status(500).json({ message: "Could not start GitHub sign-in." });
    }
});

// OAuth callback target. Exchanges the code for an access token server-side,
// stores it on the user document, then redirects the popup back to the app.
// No token or secret ever appears in a URL or in the frontend.
router.get("/callback", async (req, res) => {
    const { clientId, clientSecret, redirectUri, frontendUrl } = getClientConfig();

    const redirectToApp = (status, message) => {
        const query = new URLSearchParams({ status });
        if (message) query.set("message", message);
        return res.redirect(`${frontendUrl}/github/callback?${query.toString()}`);
    };

    try {
        const code = typeof req.query.code === "string" ? req.query.code : "";
        const state = typeof req.query.state === "string" ? req.query.state : "";
        const pending = pendingStates.get(state);
        pendingStates.delete(state);

        if (!code || !pending) {
            return redirectToApp("error", "The GitHub sign-in session expired or was cancelled. Please try again.");
        }
        if (pending.expiresAt <= Date.now()) {
            return redirectToApp("error", "The GitHub sign-in session expired. Please try again.");
        }
        if (!clientId || !clientSecret) {
            return redirectToApp("error", "GitHub integration is not configured on this server yet.");
        }

        const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "MeetSphere"
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri
            })
        });
        const tokenData = await tokenResponse.json().catch(() => ({}));
        const accessToken = typeof tokenData.access_token === "string" ? tokenData.access_token : "";

        if (!accessToken) {
            // Only GitHub's error code is logged - never secrets or tokens.
            console.error("GitHub OAuth exchange failed:", tokenData.error_description || tokenData.error || "missing access_token");
            return redirectToApp("error", "GitHub could not authorize MeetSphere. Please try again.");
        }

        const accountResponse = await fetch(`${GITHUB_API_BASE}/user`, { headers: ghHeaders(accessToken) });
        const account = await accountResponse.json().catch(() => ({}));

        const user = await User.findById(pending.userId);
        if (!user) {
            return redirectToApp("error", "Your MeetSphere session is no longer valid.");
        }

        user.githubToken = accessToken;
        user.githubLogin = account.login || null;
        user.githubAvatar = account.avatar_url || null;
        await user.save();

        return redirectToApp("ok");
    } catch (error) {
        // Log only the error message - never the code, state or token.
        console.error("GitHub OAuth callback failed:", error?.message);
        return redirectToApp("error", "Something went wrong while connecting GitHub.");
    }
});

// Connection status for the UI. Never includes the stored token.
router.get("/status", async (req, res) => {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return res.status(401).json({ message: "Sign in to your MeetSphere account to use Push to GitHub." });
        }
        const { clientId, clientSecret } = getClientConfig();
        return res.status(200).json({
            configured: Boolean(clientId && clientSecret),
            connected: Boolean(user.githubToken),
            login: user.githubLogin || null,
            avatarUrl: user.githubAvatar || null
        });
    } catch (error) {
        console.error("GitHub status check failed:", error?.message);
        return res.status(500).json({ message: "Could not check the GitHub connection." });
    }
});

// Repositories the user can push to (for "select an existing repository").
router.get("/repos", async (req, res) => {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return res.status(401).json({ message: "Sign in to your MeetSphere account to use Push to GitHub." });
        }
        if (!user.githubToken) {
            return res.status(400).json({ connected: false, message: "Connect your GitHub account first." });
        }

        const { status, data } = await githubRequest(
            user.githubToken,
            "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator"
        );

        if (status !== 200) {
            const payload = { message: describeGithubError(status, data, "Could not load your GitHub repositories.") };
            if (status === 401) payload.connected = false;
            return res.status(status === 401 ? 401 : 502).json(payload);
        }

        const repos = (Array.isArray(data) ? data : [])
            .filter((repo) => repo && repo.full_name && repo.permissions?.push !== false)
            .map((repo) => ({
                id: repo.id,
                fullName: repo.full_name,
                private: Boolean(repo.private),
                defaultBranch: repo.default_branch || "main",
                updatedAt: repo.updated_at || null
            }));

        return res.status(200).json({ connected: true, repos });
    } catch (error) {
        console.error("Loading GitHub repositories failed:", error?.message);
        return res.status(500).json({ message: "Could not load your GitHub repositories." });
    }
});

// Creates a new repository owned by the connected GitHub account.
router.post("/repos", async (req, res) => {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return res.status(401).json({ message: "Sign in to your MeetSphere account to use Push to GitHub." });
        }
        if (!user.githubToken) {
            return res.status(400).json({ connected: false, message: "Connect your GitHub account first." });
        }

        const { name, description, private: isPrivate } = req.body || {};
        const repoName = typeof name === "string" ? name.trim() : "";
        if (!REPO_NAME_PATTERN.test(repoName) || repoName.includes("..")) {
            return res.status(400).json({
                message: "Repository names may only use letters, numbers, dots, dashes and underscores."
            });
        }

        const { status, data } = await githubRequest(user.githubToken, "/user/repos", {
            method: "POST",
            body: JSON.stringify({
                name: repoName,
                description: typeof description === "string" && description.trim()
                    ? description.trim().slice(0, 350)
                    : "Meeting exports from MeetSphere",
                private: isPrivate !== false,
                auto_init: true
            })
        });

        if (status !== 201) {
            const payload = { message: describeGithubError(status, data, "Could not create the repository.") };
            if (status === 401) payload.connected = false;
            return res.status(status === 401 ? 401 : 400).json(payload);
        }

        return res.status(201).json({
            repo: {
                id: data.id,
                fullName: data.full_name,
                private: Boolean(data.private),
                defaultBranch: data.default_branch || "main",
                updatedAt: data.created_at || null
            }
        });
    } catch (error) {
        console.error("Creating GitHub repository failed:", error?.message);
        return res.status(500).json({ message: "Could not create the repository." });
    }
});

// Pushes the selected export file to a repository (create or update file).
router.post("/push", async (req, res) => {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return res.status(401).json({ message: "Sign in to your MeetSphere account to use Push to GitHub." });
        }
        if (!user.githubToken) {
            return res.status(400).json({ connected: false, message: "Connect your GitHub account first." });
        }

        const { repoFullName, path, message, content } = req.body || {};

        if (typeof repoFullName !== "string" || !REPO_FULL_NAME_PATTERN.test(repoFullName.trim())) {
            return res.status(400).json({ message: "Choose a valid repository." });
        }

        const filePath = typeof path === "string" ? path.trim().replace(/^\/+/, "") : "";
        if (!filePath
            || filePath.length > 255
            || filePath.includes("..")
            || filePath.endsWith("/")
            || !FILE_PATH_PATTERN.test(filePath)) {
            return res.status(400).json({ message: "Choose a valid file path inside the repository." });
        }

        if (typeof content !== "string" || content.length === 0) {
            return res.status(400).json({ message: "There is no content to push." });
        }
        if (content.length > MAX_CONTENT_CHARS) {
            return res.status(413).json({ message: "The export is too large to push in one file. Trim it and try again." });
        }

        const commitMessage = (typeof message === "string" && message.trim()
            ? message.trim()
            : "Export meeting chat (MeetSphere)").slice(0, 190);

        const [owner, repo] = repoFullName.trim().split("/");
        const encodedOwner = encodeURIComponent(owner);
        const encodedRepo = encodeURIComponent(repo);
        const encodedPath = filePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");

        const repoInfo = await githubRequest(user.githubToken, `/repos/${encodedOwner}/${encodedRepo}`);
        if (repoInfo.status !== 200) {
            const payload = {
                message: repoInfo.status === 404
                    ? "Repository not found. Check the name and your access to it."
                    : describeGithubError(repoInfo.status, repoInfo.data, "Could not open the repository.")
            };
            if (repoInfo.status === 401) payload.connected = false;
            return res.status(repoInfo.status === 404 ? 404 : repoInfo.status === 401 ? 401 : 502).json(payload);
        }

        const branch = String(repoInfo.data?.default_branch || "main");

        const existing = await githubRequest(
            user.githubToken,
            `/repos/${encodedOwner}/${encodedRepo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`
        );
        if (existing.status === 200 && Array.isArray(existing.data)) {
            return res.status(400).json({ message: "That path is a directory. Choose a file path." });
        }
        const existingSha = existing.status === 200 && existing.data?.sha ? existing.data.sha : null;

        const payload = {
            message: commitMessage,
            content: Buffer.from(content, "utf8").toString("base64"),
            branch
        };
        if (existingSha) payload.sha = existingSha;

        const pushResult = await githubRequest(user.githubToken, `/repos/${encodedOwner}/${encodedRepo}/contents/${encodedPath}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        if (pushResult.status !== 200 && pushResult.status !== 201) {
            const errorPayload = {
                message: describeGithubError(pushResult.status, pushResult.data, "GitHub rejected the push.")
            };
            if (pushResult.status === 401) errorPayload.connected = false;
            return res.status(pushResult.status === 401 ? 401 : pushResult.status === 409 ? 409 : 502).json(errorPayload);
        }

        return res.status(200).json({
            ok: true,
            branch,
            commitSha: pushResult.data?.commit?.sha || null,
            htmlUrl: pushResult.data?.commit?.html_url || pushResult.data?.content?.html_url || null
        });
    } catch (error) {
        console.error("GitHub push failed:", error?.message);
        return res.status(500).json({ message: "Could not push the file to GitHub." });
    }
});

export default router;
