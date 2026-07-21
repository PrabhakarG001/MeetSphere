import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';
import './GoogleAuth.css';
// Initialize Google provider using shared auth instance
const provider = new GoogleAuthProvider();
// Request email scope
provider.addScope('email');

export default function GoogleAuth({ onSuccess, onError, buttonText = "Continue with Google" }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // You can extract the token or user details here
            // const token = await user.getIdToken();
            
            if (onSuccess) {
                onSuccess({
                    name: user.displayName,
                    email: user.email,
                    picture: user.photoURL,
                    uid: user.uid
                });
            }
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            if (onError) onError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button 
            type="button" 
            className="authPrimaryButton" 
            style={{ width: '100%', borderRight: '3px solid #ff2ea6' }}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
        >
            <div className="google-icon-wrapper">
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="google-icon">
                        <g>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </g>
                    </svg>
                )}
            </div>
            <span className="google-btn-text">{isLoading ? "Connecting..." : buttonText}</span>
        </button>
    );
}
