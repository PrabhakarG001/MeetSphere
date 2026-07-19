import re

with open('frontend/src/pages/authentication.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to change the component to ONLY handle login flow, and add the google button + login/register buttons.
# We also need to add const navigate = useNavigate(); to route to /signup.
# Replace import { Link as RouterLink } from 'react-router-dom'; with import { Link as RouterLink, useNavigate } from 'react-router-dom';

content = content.replace(
    "import { Link as RouterLink } from 'react-router-dom';",
    "import { Link as RouterLink, useNavigate } from 'react-router-dom';"
)

# Insert const navigate = useNavigate(); and const [showLoginForm, setShowLoginForm] = React.useState(false);
content = content.replace(
    "export default function Authentication({ initialMode = 'signup' }) {",
    "export default function Authentication({ initialMode = 'login' }) {\n    const navigate = useNavigate();\n    const [showLoginForm, setShowLoginForm] = React.useState(false);"
)

# We want isSignup to be false always for this component, but the user requested keeping the structure. We can just force isSignup to false.
content = content.replace(
    "const isSignup = formState === 1;",
    "const isSignup = false;"
)

# Now, we need to replace the uthTabs, orm, and uthSwitchCopy with our new flow.
# We will use regex to find the uthTabs and everything below it up to </section>.

new_ui = '''
                    {!showLoginForm ? (
                        <div className="authOptionsContainer" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                            <button 
                                type="button"
                                className="authPrimaryButton googleLoginBtn" 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#fff', color: '#3c4043', border: '1px solid #dadce0', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' }}
                                onClick={() => alert("Google Login to be implemented!")}
                            >
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg>
                                Continue with Google
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                                <span style={{ padding: '0 10px', color: '#94a3b8', fontSize: '0.875rem' }}>or</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                            </div>

                            <button 
                                type="button"
                                className="authPrimaryButton" 
                                onClick={() => setShowLoginForm(true)}
                            >
                                Login
                            </button>

                            <button 
                                type="button"
                                className="authPrimaryButton" 
                                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                onClick={() => navigate('/signup')}
                            >
                                Register
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                        <span>Password</span>
                                        <a href="#" style={{ fontSize: '0.75rem', color: '#7b61ff', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); alert('Forgot password to be implemented'); }}>Forgot Password?</a>
                                    </div>
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
                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', flex: 0.4 }}
                                        onClick={() => {
                                            setShowLoginForm(false);
                                            resetFormFeedback();
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button className="authPrimaryButton" type="submit" disabled={loading} style={{ flex: 1 }}>
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
'''

pattern = re.compile(r'<div className="authTabs".*?</form>\s*<p className="authSwitchCopy">.*?</p>', re.DOTALL)
content = pattern.sub(new_ui.strip(), content)

with open('frontend/src/pages/authentication.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
