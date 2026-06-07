import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';
import { VscSignIn } from "react-icons/vsc";
import { RiSpeakAiLine } from "react-icons/ri";
import { VscFeedback } from "react-icons/vsc";
import { BsEmojiSmile } from "react-icons/bs";
import { MdOutlineAssessment, MdOutlineMailLock } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";

const WaveBar = () => (
  <div className="waveform">
    <span /><span /><span /><span /><span />
  </div>
);

const FeaturePill = ({ icon: IconComponent, label }) => (
  <div className="feature-pill">
    <IconComponent className="pill-icon" />
    <span className="pill-text">{label}</span>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();

  usePageTitle("VoxIQ — AI Communication Coach");

  /* Logo click — logged in → /home, not logged in → scroll top */
  const handleLogoClick = () => {
    if (user) navigate("/home");
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Google → browser redirects to Google → backend → /auth/callback → /home */
  const handleGoogle = () => loginWithGoogle();

  return (
    <div className="landing">
      <div className="noise-overlay" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div className="nav-inner container">
          <div className="nav-logo" onClick={handleLogoClick}>
            <div className="logo-mark">
              <span className="logo-dot" />
              <span className="logo-dot" />
            </div>
            <span className="logo-text">
              Vox<span className="gradient-text">IQ</span>
            </span>
          </div>
          <div className="nav-actions">
            <button className="signin-pill" onClick={() => navigate("/login")}>
              <VscSignIn className="signin-icon" />
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-wave-left"><WaveBar /></div>
        <div className="hero-wave-right"><WaveBar /></div>

        <div className="hero-inner container">
          <h1 className="hero-title anim-fade-up delay-2">
            Your <span className="gradient-text">AI Communication</span>
            <span className="hero-break" /> Coach is Ready
          </h1>

          <p className="hero-sub anim-fade-up delay-3">
            Practice pronunciation, fluency, grammar, and confidence with
            AI-powered real-time feedback.
          </p>

          <div className="cta-card glass-card anim-scale-in delay-3">

            <button className="btn-start" onClick={() => navigate("/register")}>
              <span className="btn-start-text">Begin My Session</span>
            </button>

            <div className="cta-divider">
              <span className="divider-line" />
              <span className="divider-text">or continue with</span>
              <span className="divider-line" />
            </div>

            <div className="social-btns">
              {/* Google → triggers OAuth → /auth/callback → /home */}
              <button className="btn-social" onClick={handleGoogle}>
                <FcGoogle />
                Continue with Google
              </button>

              {/* Email → go to /login */}
              <button className="btn-social" onClick={() => navigate("/login")}>
                <MdOutlineMailLock />
                Continue with Email
              </button>
            </div>

            <div className="feature-pills">
              <FeaturePill icon={RiSpeakAiLine}      label="Speech Analysis" />
              <FeaturePill icon={VscFeedback}         label="Real-time Feedback" />
              <FeaturePill icon={BsEmojiSmile}        label="Emotion Detection" />
              <FeaturePill icon={MdOutlineAssessment} label="CEFR Assessment" />
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="container footer-inner">
          <span className="footer-copy">© 2026 VoxIQ — B.Tech Major Project</span>
        </div>
      </footer>

    </div>
  );
}