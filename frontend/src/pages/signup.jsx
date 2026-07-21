import '../styles/authentication.css';
import '../styles/theme.css';
import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import GoogleAuth from '../components/Auth/GoogleAuth';
import Logo from '../components/common/Logo';
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

export default function Signup({ initialMode = 'signup' }) {
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
    const [formState, setFormState] = React.useState(1);
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [touched, setTouched] = React.useState({});

    const { handleRegister, handleLogin, handleGoogleLogin } = React.useContext(AuthContext);
    const isSignup = true;
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
        <main className="authPage">
            <CssBaseline />

            {/* Visual Panel (Left Side) */}
            <section className="authVisualPanel" aria-label="MeetSphere product preview">
                <Logo className="authBrand" />

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
                    <Logo className="authMobileBrand" />

                    
                    <div className="signupMobileVisual">
                        <img src="/Sharelink.png" alt="Illustration" style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }} />
                        <p style={{ marginTop: '1rem', color: 'aliceblue', fontSize: '1rem' }}>Secure and seamless video meetings.</p>
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

                    

                    <div style={{ marginBottom: '1.5rem' }}>
                        <GoogleAuth 
                            onSuccess={handleGoogleLogin} 
                            onError={(err) => setError("Google Sign-In failed: " + err)}
                            buttonText="Sign up with Google"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                            <span style={{ padding: '0 10px', color: 'aliceblue', fontSize: '0.875rem' }}>or sign up with email</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                        </div>
                    </div>

                    <form className="authForm" onSubmit={handleAuth} noValidate>
                        {isSignup && (
                            <label className="authField" htmlFor="fullName">
                                <span>Full Name</span>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    autoComplete="name"
                                    value={name}
                                    onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                                    onChange={(event) => setName(event.target.value)}
                                    aria-invalid={Boolean(showFieldError('name'))}
                                    aria-describedby={showFieldError('name') ? 'fullName-error' : undefined}
                                    placeholder="Aditya Gupta"
                                />
                                {showFieldError('name') && (
                                    <small id="fullName-error" className="fieldError">
                                        <ErrorOutlineOutlinedIcon fontSize="inherit" />
                                        {fieldErrors.name}
                                    </small>
                                )}
                            </label>
                        )}

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
                                    autoComplete={isSignup ? 'new-password' : 'current-password'}
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
                            {isSignup && (
                                <div className={`passwordMeter ${passwordStrength.className}`}>
                                    <span>
                                        <i style={{ width: `${Math.max(passwordStrength.score, 1) * 25}%` }}></i>
                                    </span>
                                    <small>{passwordStrength.label}</small>
                                </div>
                            )}
                            {showFieldError('password') && (
                                <small id="password-error" className="fieldError">
                                    <ErrorOutlineOutlinedIcon fontSize="inherit" />
                                    {fieldErrors.password}
                                </small>
                            )}
                        </label>

                        {isSignup && (
                            <label className="authField" htmlFor="confirmPassword">
                                <span>Confirm Password</span>
                                <div className="passwordInput">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        aria-invalid={Boolean(showFieldError('confirmPassword'))}
                                        aria-describedby={
                                            showFieldError('confirmPassword') ? 'confirmPassword-error' : undefined
                                        }
                                        placeholder="Repeat your password"
                                    />
                                    <button
                                        type="button"
                                        className="passwordToggle"
                                        onClick={() => setShowConfirmPassword((current) => !current)}
                                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                    >
                                        {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                    </button>
                                </div>
                                {showFieldError('confirmPassword') && (
                                    <small id="confirmPassword-error" className="fieldError">
                                        <ErrorOutlineOutlinedIcon fontSize="inherit" />
                                        {fieldErrors.confirmPassword}
                                    </small>
                                )}
                            </label>
                        )}

                        {isSignup && (
                            <label className="termsRow" htmlFor="acceptedTerms">
                                <input
                                    id="acceptedTerms"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onBlur={() => setTouched((current) => ({ ...current, acceptedTerms: true }))}
                                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                                />
                                <span>
                                    I agree to the <a href="/terms" onClick={(event) => event.preventDefault()}>Terms</a>
                                    {' '}and <a href="/privacy" onClick={(event) => event.preventDefault()}>Privacy Policy</a>.
                                </span>
                            </label>
                        )}

                        {showFieldError('acceptedTerms') && (
                            <small className="fieldError">
                                <ErrorOutlineOutlinedIcon fontSize="inherit" />
                                {fieldErrors.acceptedTerms}
                            </small>
                        )}

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
                                onClick={() => navigate('/login')}
                            >
                                Back
                            </button>
                            <button className="authPrimaryButton" type="submit" disabled={loading} style={{ flex: 1, borderRight: '3px solid #ff2ea6' }}>
                                {loading ? (
                                    <>
                                        <CircularProgress size={18} color="inherit" />
                                        {isSignup ? 'Creating account...' : 'Signing in...'}
                                    </>
                                ) : (
                                    <>
                                        {isSignup ? 'Sign Up' : 'Login'}
                                        <DoneOutlinedIcon fontSize="small" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                                        <p className="authSwitchCopy">
                        Already have an account? 
                        <button type="button" onClick={() => navigate('/login')}>
                            Login
                        </button>
                    </p>
                </div>
            </section>

            <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" variant="filled" onClose={() => setOpen(false)}>
                    {message}
                </Alert>
            </Snackbar>
        </main>
    );
}








