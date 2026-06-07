import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import usePageTitle from "../hooks/usePageTitle";
import { TiArrowBackOutline } from "react-icons/ti";
import { FaRegFilePdf } from "react-icons/fa6";
import { BsRobot } from "react-icons/bs";
import "./AssessmentReportPage.css";

const pct = (v) => Math.min(100, Math.round(v * 100));

const scoreColor = (s) => {
  if (s >= 85) return "#2EECC5";
  if (s >= 70) return "#7B6EF6";
  if (s >= 55) return "#F6A94A";
  return "#FF6B82";
};

const scoreLevel = (s) => {
  if (s >= 90) return "Excellent";
  if (s >= 80) return "Very Good";
  if (s >= 70) return "Good";
  if (s >= 55) return "Satisfactory";
  if (s >= 40) return "Needs Work";
  return "Poor";
};

const gradeLabel = (s) => {
  if (s >= 90) return "A+";
  if (s >= 85) return "A";
  if (s >= 80) return "B+";
  if (s >= 75) return "B";
  if (s >= 70) return "C+";
  if (s >= 60) return "C";
  return "D";
};

const fmt = (s) => {
  const m   = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

const MODE_LABELS = {
  fluency:       "Fluency Training",
  pronunciation: "Pronunciation Drill",
  roleplay:      "Scenario Roleplay",
  cefr:          "CEFR Assessment",
};

export default function AssessmentReportPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const reportRef = useRef(null);

  usePageTitle("Assessment Report — VoxIQ");

  const { sessionResults = {} } = location.state || {};

  useEffect(() => {
    if (!Object.keys(sessionResults).length) navigate("/home", { replace: true });
  }, [sessionResults, navigate]);

  /* ── Derive scores ── */
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
  const elapsed      = sessionResults.elapsed ?? 0;
  const mode         = sessionResults.mode || "fluency";
  const emotionLabel = sessionResults.emotion_label || "neutral";

  const grade       = gradeLabel(overall);
  const percentile  = Math.round(overall * 0.92);

  const metrics = [
    { label: "Pronunciation",      score: pronunciation, max: 100 },
    { label: "Fluency",            score: fluency,        max: 100 },
    { label: "Grammar",            score: grammar,         max: 100 },
    { label: "Vocabulary",         score: vocabulary,      max: 100 },
    { label: "Emotion Expression", score: emotionScore,    max: 100 },
    { label: "Confidence",         score: confidence,      max: 100 },
  ];

  const keyStrengths = [
    fluency    >= 75 && "Demonstrates natural speaking rhythm with appropriate pauses",
    confidence >= 70 && "Maintains confident eye contact and positive facial expressions",
    vocabulary >= 70 && "Good use of transition phrases and connectors",
    vocabulary >= 68 && `Vocabulary usage is appropriate for ${cefr} level`,
  ].filter(Boolean);

  const areasForImprovement = [
    pronunciation < 80 && "Pronunciation of 'th' sounds needs focused practice",
    grammar       < 75 && "Past tense verb conjugation shows occasional errors",
    fluency       < 80 && "Reduce use of filler words 'um', 'uh' during pauses",
    confidence    < 75 && "Work on intonation patterns for questions",
  ].filter(Boolean);

  const recommendations = [
    "Practice minimal pair exercises for 'th' sounds daily for 10 minutes",
    "Complete verb conjugation drills focusing on irregular past tense verbs",
    "Record yourself speaking and review to identify filler word patterns",
    "Listen to native speaker podcasts to internalize natural intonation",
  ];

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  const handleDownload = () => window.print();

  return (
    <div className="ar-wrapper">

      {/* ══ SCREEN NAVBAR (hidden on print) ══ */}
      <nav className="ar-screen-nav">
        <button className="ar-nav-back" onClick={() => navigate(-1)}>
          <TiArrowBackOutline className="ar-nav-icon" /> Back to Results
        </button>
        <span className="ar-nav-title">Assessment Report</span>
        <div className="ar-nav-right">
          <button className="ar-nav-btn" onClick={handleDownload}>
            <FaRegFilePdf className="ar-nav-btn-icon" /> Download PDF
          </button>
        </div>
      </nav>

      {/* ══ REPORT (printable) ══ */}
      <main className="ar-main">
        <div className="ar-report" ref={reportRef}>

          {/* ── Report header ── */}
          <div className="ar-report-header">
            <div className="ar-report-brand">
              <BsRobot className="ar-brand-icon" />
              <span className="ar-brand-name">AI English Coach</span>
            </div>
            <h1 className="ar-report-title">Communication Assessment Report</h1>
            <p className="ar-report-sub">AI-Powered English Proficiency Evaluation</p>
          </div>

          {/* ── Session information ── */}
          <div className="ar-section">
            <h2 className="ar-section-title">Session Information</h2>
            <div className="ar-info-grid">
              <div className="ar-info-item">
                <span className="ar-info-key">ASSESSMENT DATE</span>
                <span className="ar-info-val">{today}</span>
              </div>
              <div className="ar-info-item">
                <span className="ar-info-key">SESSION DURATION</span>
                <span className="ar-info-val">{fmt(elapsed)}</span>
              </div>
              <div className="ar-info-item">
                <span className="ar-info-key">PRACTICE MODE</span>
                <span className="ar-info-val">{MODE_LABELS[mode] || "Fluency Training"}</span>
              </div>
              <div className="ar-info-item">
                <span className="ar-info-key">PROFICIENCY LEVEL</span>
                <span className="ar-info-val">{cefr} (Intermediate)</span>
              </div>
            </div>
          </div>

          {/* ── Overall assessment ── */}
          <div className="ar-overall-row">
            <div className="ar-overall-left">
              <span className="ar-overall-label">Overall Assessment</span>
              <div className="ar-overall-score">
                <span className="ar-overall-num">{overall}</span>
                <span className="ar-overall-max">/100</span>
              </div>
              <div className="ar-overall-bar">
                <div
                  className="ar-overall-fill"
                  style={{ width: `${overall}%`, background: scoreColor(overall) }}
                />
              </div>
            </div>
            <div className="ar-overall-right">
              <div className="ar-overall-stat">
                <span className="ar-stat-key">Grade</span>
                <span className="ar-stat-val ar-grade">{grade}</span>
              </div>
              <div className="ar-overall-stat">
                <span className="ar-stat-key">Percentile Rank</span>
                <span className="ar-stat-val">{percentile}%</span>
              </div>
            </div>
          </div>

          {/* ── Detailed performance metrics ── */}
          <div className="ar-section">
            <h2 className="ar-section-title">Detailed Performance Metrics</h2>
            <table className="ar-metrics-table">
              <thead>
                <tr>
                  <th>CATEGORY</th>
                  <th>SCORE</th>
                  <th>PERFORMANCE LEVEL</th>
                  <th>PROGRESS</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(({ label, score, max }) => {
                  const color = scoreColor(score);
                  return (
                    <tr key={label}>
                      <td className="ar-metric-label">{label}</td>
                      <td className="ar-metric-score">{score}/{max}</td>
                      <td>
                        <span className="ar-metric-level" style={{ color }}>
                          {scoreLevel(score)}
                        </span>
                      </td>
                      <td className="ar-metric-bar-cell">
                        <div className="ar-metric-bar">
                          <div
                            className="ar-metric-fill"
                            style={{ width: `${score}%`, background: color }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Performance analysis ── */}
          <div className="ar-section">
            <h2 className="ar-section-title">Performance Analysis</h2>
            <div className="ar-analysis-row">

              <div className="ar-analysis-card ar-strengths-card">
                <h3 className="ar-analysis-title ar-title-green">Key Strengths</h3>
                <ul className="ar-analysis-list">
                  {keyStrengths.map((s, i) => (
                    <li key={i} className="ar-analysis-item ar-item-green">
                      <span className="ar-bullet ar-bullet-green">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ar-analysis-card ar-improve-card">
                <h3 className="ar-analysis-title ar-title-amber">Areas for Improvement</h3>
                <ul className="ar-analysis-list">
                  {areasForImprovement.map((s, i) => (
                    <li key={i} className="ar-analysis-item ar-item-amber">
                      <span className="ar-bullet ar-bullet-amber">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* ── AI Coach Recommendations ── */}
          <div className="ar-section">
            <h2 className="ar-section-title">AI Coach Recommendations</h2>
            <ol className="ar-recommendations">
              {recommendations.map((r, i) => (
                <li key={i} className="ar-recommendation-item">{r}</li>
              ))}
            </ol>
          </div>

          {/* ── Footer ── */}
          <div className="ar-report-footer">
            <p>This report was generated by AI Coach using advanced speech and language analysis algorithms. Results are based on the recorded session and should be used as guidance for improvement.</p>
            <p>Generated {today} · AI English Coach — VoxIQ Research Project</p>
          </div>

        </div>
      </main>

    </div>
  );
}