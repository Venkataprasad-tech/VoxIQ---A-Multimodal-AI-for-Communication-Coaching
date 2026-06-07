import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import usePageTitle from "../hooks/usePageTitle";
import {
  RiSpeakLine, RiMicLine, RiChat3Line, RiMedalLine,
  RiBriefcaseLine, RiRestaurantLine, RiPresentationLine, RiPhoneLine,
  RiArrowLeftLine, RiArrowRightLine, RiMedalLine as RiCefrIcon,
  RiSettings3Line, RiEmotionLine, RiTranslate2,
} from "react-icons/ri";
import { TiArrowBackOutline } from "react-icons/ti";
import "./SessionSummaryPage.css";

/* ── Label maps ── */
const MODE_MAP = {
  fluency:       { icon: RiSpeakLine,        label: "Fluency Focus",       desc: "Reduce hesitations and improve flow" },
  pronunciation: { icon: RiMicLine,          label: "Pronunciation Drill",  desc: "Perfect your accent and articulation" },
  roleplay:      { icon: RiChat3Line,        label: "Scenario Roleplay",    desc: "Practice real-world conversations" },
  cefr:          { icon: RiMedalLine,        label: "Full CEFR Assess",     desc: "Evaluate your English proficiency" },
};

const SCENARIO_MAP = {
  interview:    { icon: RiBriefcaseLine,    label: "Job Interview",            desc: "Practice common interview questions and answers" },
  restaurant:   { icon: RiRestaurantLine,   label: "Ordering at a Restaurant", desc: "Practice polite ordering and casual conversation" },
  presentation: { icon: RiPresentationLine, label: "Giving a Presentation",    desc: "Practice structured public speaking" },
  phone:        { icon: RiPhoneLine,        label: "Making a Phone Call",      desc: "Practice professional phone conversations" },
};

const WaveBar = () => (
  <div className="waveform">
    <span /><span /><span /><span /><span />
  </div>
);

export default function SessionSummaryPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  usePageTitle("Session Summary — VoxIQ");

  const state = location.state || {};
  const { mode, scenario, cefrTarget, accent, emotionTracking } = state;

  /* redirect back if accessed directly without state */
  useEffect(() => {
    if (!mode && !scenario) navigate("/home", { replace: true });
  }, [mode, scenario, navigate]);

  const modeInfo     = MODE_MAP[mode]     || {};
  const scenarioInfo = SCENARIO_MAP[scenario] || {};
  const ModeIcon     = modeInfo.icon     || RiSpeakLine;
  const ScenarioIcon = scenarioInfo.icon || RiBriefcaseLine;

  const handleBegin = () => {
    navigate("/session/live", { state });
  };

  const handleBack = () => {
    navigate("/home", { state });
  };

  return (
    <div className="ss-wrapper">

      {/* ── SVG gradient def ── */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ss-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7B6EF6" />
            <stop offset="100%" stopColor="#2EECC5" />
          </linearGradient>
        </defs>
      </svg>

      {/* background */}
      <div className="ss-orb ss-orb-1" />
      <div className="ss-orb ss-orb-2" />
      <div className="ss-wave-left"><WaveBar /></div>
      <div className="ss-wave-right"><WaveBar /></div>

      {/* ── NAVBAR ── */}
      <nav className="ss-nav">
        <div className="ss-nav-inner">
          <div className="ss-logo" onClick={() => navigate("/home")}>
            <div className="ss-logo-dots">
              <span className="ss-dot ss-dot-purple" />
              <span className="ss-dot ss-dot-cyan" />
            </div>
            <span className="ss-logo-text">
              Vox<span className="ss-gradient">IQ</span>
            </span>
          </div>
          <span className="ss-nav-label">Session Summary</span>
          <button className="ss-back-pill" onClick={handleBack}>
            <TiArrowBackOutline className="ss-pill-icon" /> Back
          </button>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="ss-main">

        {/* header */}
        <div className="ss-header">
          <h1 className="ss-title">Your <span className="ss-gradient">Session Summary</span></h1>
          <p className="ss-sub">Review your selections before starting the session</p>
        </div>

        {/* ── summary card ── */}
        <div className="ss-card">

          {/* Mode + Scenario row */}
          <div className="ss-selections">

            {/* Practice Mode */}
            <div className="ss-selection-block">
              <span className="ss-block-label">Practice Mode</span>
              <div className="ss-selection-card">
                <div className="ss-sel-icon">
                  <ModeIcon />
                </div>
                <div className="ss-sel-text">
                  <h3 className="ss-sel-title">{modeInfo.label || "—"}</h3>
                  <p className="ss-sel-desc">{modeInfo.desc  || "—"}</p>
                </div>
              </div>
            </div>

            <div className="ss-selections-divider" />

            {/* Scenario */}
            <div className="ss-selection-block">
              <span className="ss-block-label">Scenario</span>
              <div className="ss-selection-card">
                <div className="ss-sel-icon">
                  <ScenarioIcon />
                </div>
                <div className="ss-sel-text">
                  <h3 className="ss-sel-title">{scenarioInfo.label || "—"}</h3>
                  <p className="ss-sel-desc">{scenarioInfo.desc  || "—"}</p>
                </div>
              </div>
            </div>

          </div>

          <div className="ss-card-divider" />

          {/* Settings row */}
          <div className="ss-settings-row">
            <span className="ss-block-label">Session Settings</span>
            <div className="ss-settings-chips">

              <div className="ss-chip">
                <RiCefrIcon className="ss-chip-icon" />
                <div className="ss-chip-text">
                  <span className="ss-chip-key">CEFR Target</span>
                  <span className="ss-chip-val">{cefrTarget || "B2"}</span>
                </div>
              </div>

              <div className="ss-chip">
                <RiTranslate2 className="ss-chip-icon" />
                <div className="ss-chip-text">
                  <span className="ss-chip-key">Accent</span>
                  <span className="ss-chip-val">{accent || "Neutral"}</span>
                </div>
              </div>

              <div className={`ss-chip ${emotionTracking ? "on" : "off"}`}>
                <RiEmotionLine className="ss-chip-icon" />
                <div className="ss-chip-text">
                  <span className="ss-chip-key">Emotion Tracking</span>
                  <span className="ss-chip-val">
                    {emotionTracking ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="ss-card-divider" />

          {/* CTA buttons */}
          <div className="ss-actions">
            <button className="ss-btn-back" onClick={handleBack}>
              <RiArrowLeftLine className="ss-btn-icon" />
              Change Selections
            </button>
            <button className="ss-btn-begin" onClick={handleBegin}>
              Begin Session
              <RiArrowRightLine className="ss-btn-icon" />
            </button>
          </div>

        </div>

      </main>
    </div>
  );
}