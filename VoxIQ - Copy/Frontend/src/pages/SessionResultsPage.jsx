import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import usePageTitle from "../hooks/usePageTitle";
import {
  RiArrowLeftLine, RiDownloadLine, RiChat3Line,
  RiCheckboxCircleLine, RiErrorWarningLine,
} from "react-icons/ri";
import { BsRobot } from "react-icons/bs";
import "./SessionResultsPage.css";

/* ── Helpers ── */
const pct = (v) => Math.min(100, Math.round(v * 100));

const scoreColor = (s) => {
  if (s >= 85) return "#2EECC5";
  if (s >= 70) return "#7B6EF6";
  if (s >= 55) return "#F6A94A";
  return "#FF6B82";
};

const fmt = (s) => {
  const m   = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

/* ── Circular score ── */
function ScoreCircle({ score, color, size = 80 }) {
  const r   = (size - 10) / 2;
  const c   = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#252D45" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth="6" strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="#EDF0FF" fontSize={size < 90 ? "16" : "24"} fontWeight="800"
        fontFamily="'Syne', sans-serif">{score}</text>
    </svg>
  );
}

/* ── Radar chart — pure SVG ── */
function RadarChart({ scores }) {
  const cx = 160; const cy = 160; const r = 100;
  const labels = Object.keys(scores);
  const n = labels.length;
  const step = (2 * Math.PI) / n;

  const pt = (i, radius) => ({
    x: cx + radius * Math.sin(i * step),
    y: cy - radius * Math.cos(i * step),
  });

  const dataPoints = labels.map((k, i) => pt(i, (scores[k] / 100) * r));
  const dataPath   = dataPoints.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width="320" height="320">
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((lvl, gi) => {
        const gpts = labels.map((_, i) => pt(i, r * lvl));
        const gpath = gpts.map((p, i) =>
          `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
        return <path key={gi} d={gpath} fill="none" stroke="#252D45" strokeWidth="1" />;
      })}
      {/* spokes */}
      {labels.map((_, i) => {
        const e = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)}
          stroke="#252D45" strokeWidth="1" />;
      })}
      {/* filled polygon */}
      <path d={dataPath} fill="rgba(123,110,246,0.18)"
        stroke="#7B6EF6" strokeWidth="2" strokeLinejoin="round" />
      {/* data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4"
          fill="#7B6EF6" stroke="#EDF0FF" strokeWidth="1.5" />
      ))}
      {/* labels */}
      {labels.map((k, i) => {
        const lp = pt(i, r + 28);
        return (
          <g key={i}>
            <text x={lp.x.toFixed(1)} y={(lp.y - 7).toFixed(1)} textAnchor="middle"
              fill="#9AA3C2" fontSize="11" fontFamily="'DM Sans', sans-serif">{k}</text>
            <text x={lp.x.toFixed(1)} y={(lp.y + 8).toFixed(1)} textAnchor="middle"
              fill="#EDF0FF" fontSize="12" fontWeight="800"
              fontFamily="'Syne', sans-serif">{scores[k]}</text>
          </g>
        );
      })}
    </svg>
  );
}

const WaveBar = () => (
  <div className="waveform">
    <span /><span /><span /><span /><span />
  </div>
);

/* ══════════════════════════
   PAGE
══════════════════════════ */
export default function SessionResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle("Session Results — VoxIQ");

  const { sessionResults = {} } = location.state || {};

  useEffect(() => {
    if (!Object.keys(sessionResults).length) navigate("/home", { replace: true });
  }, [sessionResults, navigate]);

  /* derive scores */
  const fluency      = pct(sessionResults.fluency_score    ?? 0.75);
  const confidence   = pct(sessionResults.confidence_score ?? 0.72);
  const emotionScore = pct(sessionResults.emotion_score    ?? 0.80);
  const lipSyncRaw   = sessionResults.lip_sync_mse ?? 0.05;
  const lipSync      = Math.max(0, Math.round((1 - Math.min(lipSyncRaw, 1)) * 100));
  const pronunciation= Math.round((fluency + confidence) / 2);
  const grammar      = Math.round(fluency * 0.6 + confidence * 0.4);
  const vocabulary   = Math.round(fluency * 0.5 + emotionScore * 0.5);
  const overall      = Math.round(
    (fluency + confidence + emotionScore + lipSync + pronunciation) / 5
  );

  const cefr         = sessionResults.cefr_level || "B1";
  const emotionLabel = sessionResults.emotion_label || "neutral";
  const elapsed      = sessionResults.elapsed ?? 0;
  const overallColor = scoreColor(overall);

  const detailScores = [
    { label: "Pronunciation", val: pronunciation, color: "#7B6EF6" },
    { label: "Fluency",       val: fluency,        color: "#2EECC5" },
    { label: "Grammar",       val: grammar,         color: "#F6A94A" },
    { label: "Vocabulary",    val: vocabulary,      color: "#9B8FF8" },
    { label: "Emotion",       val: emotionScore,    color: "#2EECC5" },
    { label: "Confidence",    val: confidence,      color: "#F6A94A" },
  ];

  const radarScores = {
    Pronunciation: pronunciation,
    Fluency:       fluency,
    Grammar:       grammar,
    Vocabulary:    vocabulary,
    Emotion:       emotionScore,
    Confidence:    confidence,
  };

  const strengths = [
    fluency       >= 75 && "Natural speaking pace and rhythm",
    confidence    >= 70 && "Confident body language and eye contact",
    emotionScore  >= 75 && "Good emotional engagement and expression",
    vocabulary    >= 70 && "Good use of transition words",
    lipSync       >= 75 && "Clear lip movements aligned with speech",
  ].filter(Boolean);

  const improvements = [
    pronunciation < 75 && { txt: "Work on 'th' sound pronunciation",      label: "Pronunciation", score: pronunciation },
    grammar       < 75 && { txt: "Practice past tense verb conjugation",   label: "Grammar",       score: grammar },
    fluency       < 75 && { txt: "Reduce filler words like 'um' and 'uh'", label: "Fluency",       score: fluency },
    confidence    < 70 && { txt: "Maintain more consistent eye contact",   label: "Confidence",    score: confidence },
  ].filter(Boolean);

  return (
    <div className="sr-wrapper">

      <div className="sr-wave-left"><WaveBar /></div>
      <div className="sr-wave-right"><WaveBar /></div>

      {/* ══ NAVBAR ══ */}
      <nav className="sr-nav">
        <div className="sr-nav-inner">

          <button className="sr-nav-back" onClick={() => navigate("/home")}>
            <RiArrowLeftLine className="sr-nav-icon" /> Back to Setup
          </button>

          <span className="sr-nav-title">Session Results</span>

          <div className="sr-nav-right">
            <button className="sr-nav-btn" onClick={() => navigate("/session/report", { state: { sessionResults } })}>
              <RiDownloadLine className="sr-nav-btn-icon" /> Export Report
            </button>
          </div>

        </div>
      </nav>

      <main className="sr-main">

        {/* ── Overall card ── */}
        <div className="sr-overall-card">
          <ScoreCircle score={overall} color={overallColor} size={120} />
          <div className="sr-overall-info">
            <h2 className="sr-overall-title">Overall Performance</h2>
            <p className="sr-overall-cefr">
              CEFR Level: <strong style={{ color: overallColor }}>{cefr}</strong>
            </p>
            <div className="sr-overall-meta">
              <span className="sr-meta-green">
                ↑ Emotion: {emotionLabel.charAt(0).toUpperCase() + emotionLabel.slice(1)}
              </span>
              <span className="sr-meta-muted">Session: {fmt(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* ── Detailed scores ── */}
        <div className="sr-section">
          <h3 className="sr-section-title">Detailed Scores</h3>
          <div className="sr-scores-grid">
            {detailScores.map(({ label, val, color }) => (
              <div key={label} className="sr-score-card">
                <div className="sr-score-top">
                  <span className="sr-score-label">{label}</span>
                  <span className="sr-score-trend" style={{ color }}>↑</span>
                </div>
                <ScoreCircle score={val} color={color} size={80} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Radar chart ── */}
        <div className="sr-section">
          <div className="sr-radar-card">
            <h3 className="sr-section-title">Performance Overview</h3>
            <div className="sr-radar-wrap">
              <RadarChart scores={radarScores} />
            </div>
          </div>
        </div>

        {/* ── Strengths & Improvements ── */}
        <div className="sr-feedback-row">

          <div className="sr-feedback-card">
            <div className="sr-feedback-header">
              <RiCheckboxCircleLine className="sr-fh-icon sr-icon-cyan" />
              <h3 className="sr-feedback-title">Strengths</h3>
            </div>
            {strengths.length > 0
              ? strengths.map((s, i) => (
                <div key={i} className="sr-feedback-item sr-item-green">
                  <RiCheckboxCircleLine className="sr-fi-icon sr-icon-cyan" />
                  <span>{s}</span>
                </div>
              ))
              : <p className="sr-feedback-empty">Keep practising to build your strengths!</p>
            }
          </div>

          <div className="sr-feedback-card">
            <div className="sr-feedback-header">
              <RiErrorWarningLine className="sr-fh-icon sr-icon-amber" />
              <h3 className="sr-feedback-title">Areas to Improve</h3>
            </div>
            {improvements.length > 0
              ? improvements.map((item, i) => (
                <div key={i} className="sr-feedback-item sr-item-amber">
                  <RiErrorWarningLine className="sr-fi-icon sr-icon-amber" />
                  <div className="sr-improve-text">
                    <span>{item.txt}</span>
                    <div className="sr-improve-meta">
                      <span className="sr-improve-label">{item.label}</span>
                      <span className="sr-improve-score">{item.score}</span>
                    </div>
                  </div>
                </div>
              ))
              : <p className="sr-feedback-empty">Great work — no major areas to flag!</p>
            }
          </div>

        </div>

        {/* ── CTA buttons ── */}
        <div className="sr-cta-row">
          <button className="sr-cta-secondary" onClick={() => navigate("/home")}>
            Start New Session
          </button>
        </div>

      </main>

      {/* ── Floating ARIA button — fixed bottom-right ── */}
      <div
        className="sr-aria-float"
        onClick={() => navigate("/chatbot")}
      >
        <span className="sr-aria-label">Hi, I'm ARIA</span>
        <div className="sr-aria-btn">
          <BsRobot className="sr-aria-icon" />
        </div>
      </div>

    </div>
  );
}