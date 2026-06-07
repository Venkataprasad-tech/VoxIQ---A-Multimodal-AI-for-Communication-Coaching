import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import usePageTitle from "../hooks/usePageTitle";
import { HiOutlineUser } from "react-icons/hi";
import { TbPasswordMobilePhone } from "react-icons/tb";
import { PiSignInBold, PiUserPlusBold } from "react-icons/pi";
import { BsPersonUp, BsPersonDown } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineMailLock, MdPassword } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { RiEyeCloseFill } from "react-icons/ri";
import { Link } from "react-router-dom";
import "./AuthPage.css";

const SIGNIN_DEFAULT = { email: "", password: "" };
const SIGNUP_DEFAULT = { full_name: "", email: "", password: "", confirm_password: "" };
const ERRORS_DEFAULT = { signIn: "", signUp: "" };

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, login, register, loginWithGoogle } = useAuth();

  const [showSignInPassword,  setShowSignInPassword]  = useState(false);
  const [showSignUpPassword,  setShowSignUpPassword]  = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);
  const [errors,   setErrors]   = useState(ERRORS_DEFAULT);
  const [loading,  setLoading]  = useState(false);

  const [signInData, setSignInData] = useState(SIGNIN_DEFAULT);
  const [signUpData, setSignUpData] = useState(SIGNUP_DEFAULT);

  usePageTitle(isSignUp ? "Sign Up — VoxIQ" : "Sign In — VoxIQ");

  /* Already logged in → go straight to /home */
  if (user) return <Navigate to="/home" replace />;

  /* ── change handlers ── */
  const handleSignInChange = (e) =>
    setSignInData(prev => ({ ...prev, [e.target.name]: e.target.value ?? "" }));

  const handleSignUpChange = (e) =>
    setSignUpData(prev => ({ ...prev, [e.target.name]: e.target.value ?? "" }));

  /* ── validation ── */
  const validateSignIn = () => {
    if (!signInData.email.trim() || !signInData.password.trim())
      return setErrors(p => ({ ...p, signIn: "Email and password are required." })), false;
    if (!/\S+@\S+\.\S+/.test(signInData.email))
      return setErrors(p => ({ ...p, signIn: "Enter a valid email address." })), false;
    if (signInData.password.length < 6)
      return setErrors(p => ({ ...p, signIn: "Password must be at least 6 characters." })), false;
    return true;
  };

  const validateSignUp = () => {
    if (!signUpData.full_name.trim() || !signUpData.email.trim() || !signUpData.password.trim())
      return setErrors(p => ({ ...p, signUp: "All fields are required." })), false;
    if (!/\S+@\S+\.\S+/.test(signUpData.email))
      return setErrors(p => ({ ...p, signUp: "Enter a valid email address." })), false;
    if (signUpData.password.length < 6)
      return setErrors(p => ({ ...p, signUp: "Password must be at least 6 characters." })), false;
    if (signUpData.password !== signUpData.confirm_password)
      return setErrors(p => ({ ...p, signUp: "Passwords do not match." })), false;
    return true;
  };

  /* ── Email login → /home ── */
  const handleSignIn = async () => {
    setErrors(p => ({ ...p, signIn: "" }));
    if (!validateSignIn()) return;
    setLoading(true);
    try {
      await login(signInData.email, signInData.password);
      toast.success("Login Successful! Welcome back 👋");
      navigate("/home", { replace: true });
    } catch (err) {
      setErrors(p => ({ ...p, signIn: err.message || "Login failed. Please try again." }));
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Email register → /home ── */
  const handleSignUp = async () => {
    setErrors(p => ({ ...p, signUp: "" }));
    if (!validateSignUp()) return;
    setLoading(true);
    try {
      await register(signUpData.full_name, signUpData.email, signUpData.password);
      toast.success("Account Created! Welcome to VoxIQ 🎉");
      navigate("/home", { replace: true });
    } catch (err) {
      setErrors(p => ({ ...p, signUp: err.message || "Sign up failed. Please try again." }));
      toast.error(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Google → redirects browser to Google → backend → /auth/callback → /home ── */
  const handleGoogle = () => loginWithGoogle();

  const switchToSignIn = () => { setIsSignUp(false); setErrors(ERRORS_DEFAULT); };
  const switchToSignUp = () => { setIsSignUp(true);  setErrors(ERRORS_DEFAULT); };

  return (
    <div className="auth-body-wrapper">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className={`auth-container ${isSignUp ? "active" : ""}`}>

        <Link to="/" className="auth-logo">
          <div className="logo">
            <div className="logo-dots">
              <span className="dot dot-purple" />
              <span className="dot dot-cyan" />
            </div>
            <span className="logo-text">
              Vox<span className="gradient-text">IQ</span>
            </span>
          </div>
        </Link>

        {/* ══ SIGN UP FORM ══ */}
        <div className="form-container sign-up">
          <form onSubmit={e => e.preventDefault()}>
            <h1>Create Account</h1>
            <span>Use your email for registration</span>
            {errors.signUp && <p className="auth-error">{errors.signUp}</p>}

            <div className="input-wrapper">
              <HiOutlineUser className="input-icon" />
              <input type="text" name="full_name" placeholder="Full Name"
                autoComplete="name" value={signUpData.full_name} onChange={handleSignUpChange} />
            </div>

            <div className="input-wrapper">
              <MdOutlineMailLock className="input-icon" />
              <input type="email" name="email" placeholder="Email"
                autoComplete="email" value={signUpData.email} onChange={handleSignUpChange} />
            </div>

            <div className="input-wrapper password-wrapper">
              <TbPasswordMobilePhone className="input-icon" />
              <input type={showSignUpPassword ? "text" : "password"} name="password"
                placeholder="Password" autoComplete="new-password"
                value={signUpData.password} onChange={handleSignUpChange} />
              <span className="password-toggle" onClick={() => setShowSignUpPassword(p => !p)}>
                {showSignUpPassword ? <FaEye /> : <RiEyeCloseFill />}
              </span>
            </div>

            <div className="input-wrapper password-wrapper">
              <MdPassword className="input-icon" />
              <input type={showConfirmPassword ? "text" : "password"} name="confirm_password"
                placeholder="Confirm Password" autoComplete="new-password"
                value={signUpData.confirm_password} onChange={handleSignUpChange} />
              <span className="password-toggle" onClick={() => setShowConfirmPassword(p => !p)}>
                {showConfirmPassword ? <FaEye /> : <RiEyeCloseFill />}
              </span>
            </div>

            <button type="button" onClick={handleSignUp} disabled={loading}>
              <PiUserPlusBold /> {loading ? "Creating..." : "Sign Up"}
            </button>
          </form>
        </div>

        {/* ══ SIGN IN FORM ══ */}
        <div className="form-container sign-in">
          <form onSubmit={e => e.preventDefault()}>
            <h1>Sign In</h1>
            <span>Use your email and password</span>
            {errors.signIn && <p className="auth-error">{errors.signIn}</p>}

            <div className="input-wrapper">
              <MdOutlineMailLock className="input-icon" />
              <input type="email" name="email" placeholder="Email"
                autoComplete="email" value={signInData.email} onChange={handleSignInChange} />
            </div>

            <div className="input-wrapper password-wrapper">
              <TbPasswordMobilePhone className="input-icon" />
              <input type={showSignInPassword ? "text" : "password"} name="password"
                placeholder="Password" autoComplete="current-password"
                value={signInData.password} onChange={handleSignInChange} />
              <span className="password-toggle" onClick={() => setShowSignInPassword(p => !p)}>
                {showSignInPassword ? <FaEye /> : <RiEyeCloseFill />}
              </span>
            </div>

            <span className="forgot">Forgot your password?</span>

            <button type="button" onClick={handleSignIn} disabled={loading}>
              <PiSignInBold /> {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="divider"><span>or</span></div>

            <div className="signin-google">
              <button type="button" onClick={handleGoogle}>
                <FcGoogle />
                <span>Sign In with Google</span>
              </button>
            </div>
          </form>
        </div>

        {/* ══ TOGGLE PANEL ══ */}
        <div className="toggle-container toggle-signin">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h2>Welcome Back!</h2>
              <p>Enter your personal details to use all features of VoxIQ AI.</p>
              <button className="hidden" onClick={switchToSignIn}>
                <BsPersonDown /> Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h2>Hello!</h2>
              <p>Register with your details if you are new and start improving your communication with VoxIQ.</p>
              <button className="hidden" onClick={switchToSignUp}>
                <BsPersonUp /> Sign Up
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;