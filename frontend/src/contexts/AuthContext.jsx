import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../../environment";

// Firebase imports
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
});

export const AuthProvider = ({ children }) => {
    const router = useNavigate();

    const [userData, setUserData] = useState(() => {
        const token = localStorage.getItem("token");
        const name = localStorage.getItem("name");
        const username = localStorage.getItem("username");
        const picture = localStorage.getItem("picture");
        return token ? { token, name, username, picture } : {};
    });

    // Backend registration (legacy)
    const handleRegister = async (name, username, password) => {
        const request = await client.post("/register", { name, username, password });
        if (request.status === httpStatus.CREATED) {
            return request.data.message;
        }
    };

    // Firebase Email/Password registration
    const handleFirebaseRegister = async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }
            // Optionally, you could also send this user to your backend
            return userCredential.user;
        } catch (error) {
            console.error("Firebase registration error:", error);
            throw error;
        }
    };

    // Backend login (legacy)
    const handleLogin = async (username, password) => {
        const request = await client.post("/login", { username, password });
        if (request.status === httpStatus.OK) {
            localStorage.setItem("token", request.data.token);
            if (request.data.user) {
                localStorage.setItem("name", request.data.user.name);
                localStorage.setItem("username", request.data.user.username);
                if (request.data.user.picture) localStorage.setItem("picture", request.data.user.picture);
                setUserData({
                    token: request.data.token,
                    name: request.data.user.name,
                    username: request.data.user.username,
                    picture: request.data.user.picture
                });
            }
            router("/home");
        }
    };

    // Firebase Email/Password login
    const handleFirebaseLogin = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            localStorage.setItem("token", token);
            localStorage.setItem("name", userCredential.user.displayName || "");
            localStorage.setItem("username", userCredential.user.email);
            setUserData({
                token,
                name: userCredential.user.displayName,
                username: userCredential.user.email,
                picture: userCredential.user.photoURL
            });
            router("/home");
        } catch (error) {
            console.error("Firebase login error:", error);
            throw error;
        }
    };

    const handleGoogleLogin = async (userObj) => {
        const request = await client.post("/google-login", {
            name: userObj.name,
            username: userObj.email.split('@')[0],
            picture: userObj.picture
        });
        if (request.status === httpStatus.OK) {
            localStorage.setItem("token", request.data.token);
            if (request.data.user) {
                localStorage.setItem("name", request.data.user.name);
                localStorage.setItem("username", request.data.user.username);
                if (request.data.user.picture) localStorage.setItem("picture", request.data.user.picture);
                setUserData({
                    token: request.data.token,
                    name: request.data.user.name,
                    username: request.data.user.username,
                    picture: request.data.user.picture
                });
            }
            router("/home");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        localStorage.removeItem("username");
        localStorage.removeItem("picture");
        setUserData({});
        router("/auth");
    };

    const getHistoryOfUser = async () => {
        const request = await client.get("/get_all_activity", {
            params: { token: localStorage.getItem("token") }
        });
        return request.data;
    };

    const addToUserHistory = async (meetingCode) => {
        const request = await client.post("/add_to_activity", {
            token: localStorage.getItem("token"),
            meeting_code: meetingCode
        });
        return request;
    };

    const deleteUserHistory = async (meetingCode) => {
        const request = await client.delete("/delete_activity", {
            data: {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            }
        });
        return request.data;
    };

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfUser,
        handleRegister,
        handleLogin,
        handleFirebaseRegister,
        handleFirebaseLogin,
        deleteUserHistory,
        handleGoogleLogin,
        handleLogout
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
