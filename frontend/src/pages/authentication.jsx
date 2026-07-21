import '../styles/authentication.css';
import '../styles/landing.css';
import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import GoogleAuth from '../components/Auth/GoogleAuth';
import '../App.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (password = '') => {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;

    if (!password) {
        return { label: 'Password strength', className: 'neutral', score: 0 };
    }

    if (score <= 1) {
        return { label: 'Weak password', className: 'weak', score };
    }

    if (score <= 3) {
        return { label: 'Good password', className: 'good', score };
    }

    return { label: 'Strong password', className: 'strong', score };
};

export default function Authentication({ initialMode = 'login' }) {
    const navigate = useNavigate();
    const [showLoginForm, setShowLoginForm] = React.useState(false);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [acceptedTerms, setAcceptedTerms] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(initialMode === 'login' ? 0 : 1);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [touched, setTouched] = React.useState({});

    const { handleRegister, handleLogin, handleGoogleLogin } = React.useContext(AuthContext);
    const isSignup = false;
    const passwordStrength = React.useMemo(() => getPasswordStrength(password), [password]);

    const resetFormFeedback = () => {
        setError('');
        setSubmitted(false);
        setTouched({});
    };

    React.useEffect(() => {
        setFormState(initialMode === 'login' ? 0 : 1);
        resetFormFeedback();
    }, [initialMode]);

    const fieldErrors = React.useMemo(() => {
        const errors = {};

        if (isSignup && !name.trim()) {
            errors.name = 'Enter your full name.';
        }

        if (!username.trim()) {
            errors.username = 'Enter your email address.';
        } else if (!emailPattern.test(username)) {
            errors.username = 'Use a valid email address.';
        }

        if (!password) {
            errors.password = 'Enter your password.';
        } else if (isSignup && password.length < 8) {
            errors.password = 'Use at least 8 characters.';
        }

        if (isSignup && confirmPassword !== password) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        if (isSignup && !acceptedTerms) {
            errors.acceptedTerms = 'Accept the terms to create your account.';
        }

        return errors;
    }, [acceptedTerms, confirmPassword, isSignup, name, password, username]);

    const showFieldError = (field) => (submitted || touched[field]) && fieldErrors[field];



    const switchForm = (state) => {
        setFormState(state);
        setConfirmPassword('');
        setAcceptedTerms(false);
        resetFormFeedback();
    };

    const handleAuth = async (event) => {
        event.preventDefault();
        setSubmitted(true);
        setError('');

        if (Object.keys(fieldErrors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            if (!isSignup) {
                await handleLogin(username, password);
                return;
            }

            const result = await handleRegister(name, username, password);
            setUsername('');
            setName('');
            setPassword('');
            setConfirmPassword('');
            setAcceptedTerms(false);
            setMessage(result || 'Account created successfully. Please login to continue.');
            setOpen(true);
            setFormState(0);
            resetFormFeedback();
        } catch (err) {
            const apiMessage = err?.response?.data?.message || err.message || 'Something went wrong. Please try again.';
            setError(apiMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="authPage landingPageContainer">
            <CssBaseline />

            {/* Visual Panel (Left Side) */}
            <section className="authVisualPanel" aria-label="MeetSphere product preview">
                  <RouterLink className="authBrand" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', borderRight: '3px solid #ff2ea6', paddingRight: '12px' }}>
                      <img src="/logo-navbar.png" alt="MeetSphere Logo" className="object-contain transition-transform hover:scale-105" style={{ width: '2rem', height: '2rem' }} />
                      <span className="lobster-two-bold" style={{ 
                          fontSize: '2.5rem',
                          background: 'linear-gradient(135deg, #ff2ea6 0%, #7b61ff 50%, #2d4fc2 100%)', 
                          WebkitBackgroundClip: 'text', 
                          WebkitTextFillColor: 'transparent'
                      }}>
                          MeetSphere
                      </span>
                  </RouterLink>

                <div className="authHeroCopy">
                    {/* Enhanced Quote Typography */}
                    <h1 className="authHeroQuote">
                        "Connect with anyone, anywhere. Secure video calls start here." 
                    </h1>
                    
                    {/* Vector Illustration directly below the quote */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '520px', marginTop: '2.5rem' }}>
                        <img 
                            src="/Vector.png" 
                            alt="Communication and Connection" 
                            style={{ width: '100%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }} 
                        />
                    </div>
                </div>
            </section>

            {/* Form Section (Right Side) */}
            <section className="authFormPanel" aria-label={isSignup ? 'Create account' : 'Login'}>
                <div className="authCard">
                      <RouterLink className="authMobileBrand" to="/" style={{ display: 'none', alignItems: 'center', gap: '10px', textDecoration: 'none', borderRight: '3px solid #ff2ea6', paddingRight: '10px' }}>
                          <img src="/logo-navbar.png" alt="MeetSphere Logo" className="object-contain transition-transform hover:scale-105" style={{ width: '1.5rem', height: '1.5rem' }} />
                          <span className="lobster-two-bold" style={{ 
                              fontSize: '2rem',
                              background: 'linear-gradient(135deg, #ff2ea6 0%, #7b61ff 50%, #2d4fc2 100%)', 
                              WebkitBackgroundClip: 'text', 
                              WebkitTextFillColor: 'transparent'
                          }}>
                              MeetSphere
                          </span>
                      </RouterLink>

                                        <div className="signupMobileVisual">
                        <img src="/Vector.png" alt="Illustration" style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }} />
                        <h1 className="authHeroQuote" style={{ fontSize: '1.25rem', marginTop: '1rem', textAlign: 'center' }}>
                            "Connect with anyone, anywhere. Secure video calls start here."
                        </h1>
                    </div>

                    <div className="authHeader">
                        <p className="authEyebrow">{isSignup ? 'Create account' : 'Welcome back'}</p>
                        <h2>{isSignup ? 'Sign up to MeetSphere' : 'Login to MeetSphere'}</h2>
                        <p>
                            {isSignup
                                ? 'Use your email to create a secure meeting account.'
                                : 'Enter your details to continue to your meetings.'}
                        </p>
                    </div>

                                        {!showLoginForm ? (
                        <div className="authOptionsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                            <GoogleAuth 
                                onSuccess={handleGoogleLogin} 
                                onError={(err) => setError("Google Sign-In failed: " + err)}
                            />
                            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'aliceblue', margin: '-0.25rem 0 0 0', opacity: 0.8 }}>
                                Recommended: Login with Google for faster access
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                                <span style={{ padding: '0 10px', color: 'aliceblue', fontSize: '0.875rem' }}>or</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                            </div>

                            <button 
                                type="button"
                                className="authPrimaryButton" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRight: '3px solid #ff2ea6' }}
                                onClick={() => setShowLoginForm(true)}
                            >
                                <LoginOutlinedIcon fontSize="small" /> Login
                            </button>

                            <button 
                                type="button"
                                className="authPrimaryButton" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRight: '3px solid #ff2ea6' }}
                                onClick={() => navigate('/signup')}
                            >
                                <PersonAddOutlinedIcon fontSize="small" /> Signup
                            </button>
                        </div>
                    ) : (
                        <div className="loginFormExpand">
                            <form className="authForm" onSubmit={handleAuth} noValidate style={{ marginTop: '1.5rem' }}>
                                <label className="authField" htmlFor="email">
                                    <span>Email Address</span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={username}
                                        onBlur={() => setTouched((current) => ({ ...current, username: true }))}
                                        onChange={(event) => setUsername(event.target.value)}
                                        aria-invalid={Boolean(showFieldError('username'))}
                                        aria-describedby={showFieldError('username') ? 'email-error' : undefined}
                                        placeholder="you@example.com"
                                    />
                                    {showFieldError('username') && (
                                        <small id="email-error" className="fieldError">
                                            <ErrorOutlineOutlinedIcon fontSize="inherit" />
                                            {fieldErrors.username}
                                        </small>
                                    )}
                                </label>

                                <label className="authField" htmlFor="password">
                                        <span>Password</span>
                                    <div className="passwordInput">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete={'current-password'}
                                            value={password}
                                            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                                            onChange={(event) => setPassword(event.target.value)}
                                            aria-invalid={Boolean(showFieldError('password'))}
                                            aria-describedby={showFieldError('password') ? 'password-error' : undefined}
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            className="passwordToggle"
                                            onClick={() => setShowPassword((current) => !current)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        </button>
                                    </div>
                                    {showFieldError('password') && (
                                        <small id="password-error" className="fieldError">
                                            <ErrorOutlineOutlinedIcon fontSize="inherit" />
                                            {fieldErrors.password}
                                        </small>
                                    )}
                                </label>

                                {error && (
                                    <div className="authError" role="alert">
                                        <ErrorOutlineOutlinedIcon fontSize="small" />
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                    <button 
                                        className="authPrimaryButton" 
                                        type="button" 
                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', flex: 0.4, borderRight: '3px solid #ff2ea6' }}
                                        onClick={() => {
                                            setShowLoginForm(false);
                                            resetFormFeedback();
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button className="authPrimaryButton" type="submit" disabled={loading} style={{ flex: 1, borderRight: '3px solid #ff2ea6' }}>
                                        {loading ? (
                                            <>
                                                <CircularProgress size={18} color="inherit" />
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Login
                                                <DoneOutlinedIcon fontSize="small" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                            
                            <p className="authSwitchCopy" style={{ marginTop: '2rem' }}>
                                New to MeetSphere?
                                <button type="button" onClick={() => navigate('/signup')}>
                                    Create account
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setOpen(false)}>
                    {message}
                </Alert>
            </Snackbar>
        </main>
    );
}








