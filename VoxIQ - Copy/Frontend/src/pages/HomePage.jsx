import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import usePageTitle from "../hooks/usePageTitle";
import {
  RiSpeakLine, RiMicLine, RiChat3Line, RiMedalLine,
  RiBriefcaseLine, RiRestaurantLine, RiPresentationLine, RiPhoneLine,
  RiSettings3Line, RiArrowRightLine, RiCloseLine,
} from "react-icons/ri";
import "./HomePage.css";

/* ── Data ── */
const MODES = [
  { id: "fluency",       icon: RiSpeakLine,  title: "Fluency Focus",      desc: "Reduce hesitations and improve flow" },
  { id: "pronunciation", icon: RiMicLine,    title: "Pronunciation Drill", desc: "Perfect your accent and articulation" },
  { id: "roleplay",      icon: RiChat3Line,  title: "Scenario Roleplay",   desc: "Practice real-world conversations" },
  { id: "cefr",          icon: RiMedalLine,  title: "Full CEFR Assess",    desc: "Evaluate your English proficiency" },
];

const SCENARIOS = [
  { id: "interview",    icon: RiBriefcaseLine,    title: "Job Interview",            desc: "Practice common interview questions and answers" },
  { id: "restaurant",   icon: RiRestaurantLine,   title: "Ordering at a Restaurant", desc: "Practice polite ordering and casual conversation" },
  { id: "presentation", icon: RiPresentationLine, title: "Giving a Presentation",    desc: "Practice structured public speaking" },
  { id: "phone",        icon: RiPhoneLine,        title: "Making a Phone Call",      desc: "Practice professional phone conversations" },
];

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ACCENTS     = ["Neutral", "British", "American", "Australian", "Indian"];

const WaveBar = () => (
  <div className="waveform">
    <span /><span /><span /><span /><span />
  </div>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  usePageTitle("Home — VoxIQ");

  const [dropdownOpen,     setDropdownOpen]     = useState(false);
  const [selectedMode,     setSelectedMode]     = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [cefrTarget,       setCefrTarget]       = useState("B2");
  const [accent,           setAccent]           = useState("Neutral");
  const [emotionTracking,  setEmotionTracking]  = useState(true);
  const [settingsOpen,     setSettingsOpen]     = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close settings on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setSettingsOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    toast.info("You've been logged out.");
    navigate("/", { replace: true });
  };

  const canStart = selectedMode !== null && selectedScenario !== null;

  const handleStart = () => {
    if (!canStart) return;
    navigate("/session/summary", {
      state: { mode: selectedMode, scenario: selectedScenario, cefrTarget, accent, emotionTracking }
    });
  };

  return (
    <div className="home-wrapper">
      <div className="home-orb home-orb-1" />
      <div className="home-orb home-orb-2" />
      <div className="home-wave-left"><WaveBar /></div>
      <div className="home-wave-right"><WaveBar /></div>

      {/* ── SVG gradient def — used by all card icons ── */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7B6EF6" />
            <stop offset="100%" stopColor="#2EECC5" />
          </linearGradient>
        </defs>
      </svg>

      {/* ════════════════════════════════
          SETTINGS SIDEBAR — slides from right
      ════════════════════════════════ */}
      {/* backdrop */}
      {settingsOpen && (
        <div className="settings-backdrop" onClick={() => setSettingsOpen(false)} />
      )}

      {/* sidebar panel */}
      <aside className={`settings-sidebar ${settingsOpen ? "open" : ""}`}>

        <div className="settings-sidebar-header">
          <div className="settings-sidebar-title-row">
            <RiSettings3Line className="settings-sidebar-icon" />
            <h3 className="settings-sidebar-title">Session Settings</h3>
          </div>
          <button className="settings-close-btn" onClick={() => setSettingsOpen(false)}>
            <RiCloseLine />
          </button>
        </div>

        <div className="settings-sidebar-body">

          {/* CEFR Target */}
          <div className="settings-group">
            <span className="settings-group-label">CEFR Target Level</span>
            <span className="settings-group-hint">Your target English proficiency</span>
            <div className="cefr-pills">
              {CEFR_LEVELS.map(lvl => (
                <button
                  key={lvl}
                  className={`cefr-pill ${cefrTarget === lvl ? "active" : ""}`}
                  onClick={() => setCefrTarget(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Accent */}
          <div className="settings-group">
            <span className="settings-group-label">Accent Preference</span>
            <span className="settings-group-hint">Reference accent for pronunciation</span>
            <div className="accent-pills">
              {ACCENTS.map(a => (
                <button
                  key={a}
                  className={`accent-pill ${accent === a ? "active" : ""}`}
                  onClick={() => setAccent(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Emotion Tracking */}
          <div className="settings-group">
            <div className="settings-toggle-row">
              <div>
                <span className="settings-group-label">Enable Emotion Tracking</span>
              </div>
              <button
                className={`toggle-switch ${emotionTracking ? "on" : ""}`}
                onClick={() => setEmotionTracking(p => !p)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>

          <div className="settings-divider" />

          {/* Summary */}
          <div className="settings-group">
            <span className="settings-group-label">Current Selection</span>
            <div className="settings-summary">
              <div className="summary-row">
                <span className="summary-key">CEFR Target</span>
                <span className="summary-val">{cefrTarget}</span>
              </div>
              <div className="summary-row">
                <span className="summary-key">Accent</span>
                <span className="summary-val">{accent}</span>
              </div>
              <div className="summary-row">
                <span className="summary-key">Emotion Tracking</span>
                <span className={`summary-val ${emotionTracking ? "on" : "off"}`}>
                  {emotionTracking ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

        </div>

        <div className="settings-sidebar-footer">
          <button className="settings-done-btn" onClick={() => setSettingsOpen(false)}>
            Done
          </button>
        </div>

      </aside>

      {/* ══ NAVBAR ══ */}
      <nav className="home-nav">
        <div className="home-nav-inner">

          <div className="home-logo" onClick={() => navigate("/home")}>
            <div className="home-logo-dots">
              <span className="h-dot h-dot-purple" />
              <span className="h-dot h-dot-cyan" />
            </div>
            <span className="home-logo-text">
              Vox<span className="h-gradient">IQ</span>
            </span>
          </div>

          {user && (
            <div className="home-nav-right">

              <div className="home-user-menu" ref={dropdownRef}>
                <button
                  className="home-avatar-btn"
                  onClick={() => setDropdownOpen(p => !p)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="home-avatar">
                    {user.avatar_url
                      ? <img src={user.avatar_url} alt={user.name} />
                      : <span>{user.name?.[0]?.toUpperCase() ?? "U"}</span>
                    }
                  </div>
                  <svg className={`home-chevron ${dropdownOpen ? "open" : ""}`}
                    width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="home-dropdown">
                    <div className="home-dropdown-info">
                      <div className="home-dropdown-avatar">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt={user.name} />
                          : <span>{user.name?.[0]?.toUpperCase() ?? "U"}</span>
                        }
                      </div>
                      <div className="home-dropdown-details">
                        <span className="home-dropdown-name">{user.name}</span>
                        <span className="home-dropdown-email">{user.email}</span>
                      </div>
                    </div>
                    <div className="home-dropdown-divider" />
                    <button className="home-dropdown-logout" onClick={handleLogout}>
                      <svg width="15" height="15" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ══ MAIN ══ */}
      <main className="home-main">

        <div className="home-header">
          <h1 className="home-title">
            Choose Your <span className="h-gradient">Practice Mode</span>
          </h1>
          <p className="home-sub">Select how you'd like to practice today</p>
        </div>

        {/* ── Step progress indicator ── */}
        <div className="home-stepper">
          {/* Step 1 — Mode */}
          <div className="stepper-item">
            <div className={`stepper-circle ${selectedMode ? "done" : "active"}`}>
              {selectedMode
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : "1"
              }
            </div>
            <span className={`stepper-label ${selectedMode ? "done" : "active"}`}>Mode</span>
          </div>

          <div className={`stepper-line ${selectedMode ? "done" : ""}`} />

          {/* Step 2 — Scenario */}
          <div className="stepper-item">
            <div className={`stepper-circle ${selectedScenario ? "done" : selectedMode ? "active" : ""}`}>
              {selectedScenario
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                : "2"
              }
            </div>
            <span className={`stepper-label ${selectedScenario ? "done" : selectedMode ? "active" : ""}`}>Scenario</span>
          </div>

          <div className={`stepper-line ${selectedScenario ? "done" : ""}`} />

          {/* Step 3 — Settings */}
          <div className="stepper-item">
            <div className={`stepper-circle ${canStart ? "active" : ""}`}>3</div>
            <span className={`stepper-label ${canStart ? "active" : ""}`}>Settings</span>
          </div>
        </div>

        {/* columns + settings button */}
        <div className="home-body-row">

          <div className="home-columns">

            {/* LEFT — Warm-up */}
            <div className="home-col">
              <div className="col-header">
                <h2 className="col-title">Warm-up</h2>
                <p className="col-sub">Choose a practice mode</p>
              </div>
              <div className="mode-grid">
                {MODES.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      className={`mode-card ${selectedMode === mode.id ? "selected" : ""}`}
                      onClick={() => setSelectedMode(mode.id)}
                    >
                      <div className="mode-card-icon"><Icon /></div>
                      <h3 className="mode-card-title">{mode.title}</h3>
                      <p className="mode-card-desc">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Scenario */}
            <div className="home-col">
              <div className="col-header">
                <h2 className="col-title">Select a Scenario</h2>
                <p className="col-sub">Choose the context for your practice session</p>
              </div>
              <div className="scenario-grid">
                {SCENARIOS.map(sc => {
                  const Icon = sc.icon;
                  return (
                    <button
                      key={sc.id}
                      className={`scenario-card ${selectedScenario === sc.id ? "selected" : ""}`}
                      onClick={() => setSelectedScenario(sc.id)}
                    >
                      <div className="scenario-card-icon"><Icon /></div>
                      <h3 className="scenario-card-title">{sc.title}</h3>
                      <p className="scenario-card-desc">{sc.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Settings icon — signin-pill style */}
          <button
            className={`settings-icon-btn ${settingsOpen ? "active" : ""}`}
            onClick={() => setSettingsOpen(true)}
            title="Session Settings"
          >
            <RiSettings3Line className="settings-icon-svg" />
          </button>

        </div>

        {/* Start button */}
        <div className="home-start-row">
          <button className="home-start-btn" onClick={handleStart} disabled={!canStart}>
            Start Session &nbsp;<RiArrowRightLine className="start-btn-icon" />
          </button>
          {!canStart && (
            <span className="home-start-hint">
              {!selectedMode && !selectedScenario
                ? "Select a mode and scenario to begin"
                : !selectedMode ? "Select a practice mode"
                : "Select a scenario"}
            </span>
          )}
        </div>

      </main>
    </div>
  );
}