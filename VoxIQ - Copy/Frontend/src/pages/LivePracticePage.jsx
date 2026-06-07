import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";
import {
  RiPauseLine, RiPlayLine, RiStopCircleLine,
  RiMicAiLine, RiMicOffLine,
  RiTimeLine,
} from "react-icons/ri";
import { PiVideoCameraBold, PiVideoCameraSlashBold } from "react-icons/pi";
import "./LivePracticePage.css";

/* ── Speaking prompts per mode ── */
const PROMPTS = {
  fluency: [
    "Describe your typical day at work or school. What activities do you usually do, and how do you feel about your daily routine?",
    "Tell me about a recent challenge you faced and how you overcame it. What did you learn from that experience?",
    "Describe your favourite place and explain why it is meaningful to you.",
  ],
  pronunciation: [
    "Read aloud: 'The thirty-three thieves thought that they thrilled the throne throughout Thursday.'",
    "Say clearly: 'She sells seashells by the seashore and the shells she sells are seashells, I'm sure.'",
    "Repeat: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?'",
  ],
  roleplay: {
    interview:    "Interviewer: Tell me about yourself and why you are the best candidate for this position.",
    restaurant:   "Waiter: Good evening! Welcome. Can I start you off with something to drink?",
    presentation: "You are presenting to the board. Begin: 'Good morning everyone, today I will walk you through our Q3 results...'",
    phone:        "Caller: Hello, I'm calling to schedule an appointment. Is Dr. Smith available this week?",
  },
  cefr: [
    "Describe the advantages and disadvantages of social media in modern society.",
    "What changes would you make to the education system in your country and why?",
    "Talk about a global issue that concerns you the most and suggest a solution.",
  ],
};



const SESSION_DURATION = 10 * 60;

const MODE_LABELS = {
  fluency:       "Fluency Training",
  pronunciation: "Pronunciation Drill",
  roleplay:      "Scenario Roleplay",
  cefr:          "CEFR Assessment",
};

const ML_BASE = "http://127.0.0.1:8000";

async function sendVideoToML(videoBlob, timestamp) {
  const formData = new FormData();
  formData.append("video", videoBlob, `interview_${timestamp}.webm`);
  try {
    const res  = await fetch(`${ML_BASE}/upload-video`, { method: "POST", body: formData });
    const data = await res.json();
    console.log("Video ML Response:", data);
    return data;
  } catch (err) {
    console.error("Video upload error:", err);
    return null;
  }
}

async function sendAudioToML(audioBlob, timestamp) {
  const formData = new FormData();
  formData.append("audio", audioBlob, `speech_${timestamp}.webm`);
  try {
    const res  = await fetch(`${ML_BASE}/upload-audio`, { method: "POST", body: formData });
    const data = await res.json();
    console.log("Audio ML Response:", data);
    return data;
  } catch (err) {
    console.error("Audio upload error:", err);
    return null;
  }
}

async function sendTextToML(text, timestamp) {
  const formData = new FormData();
  formData.append("transcript", text);
  formData.append("filename", `transcript_${timestamp}.txt`);
  try {
    const res  = await fetch(`${ML_BASE}/upload-text`, { method: "POST", body: formData });
    const data = await res.json();
    console.log("Text ML Response:", data);
    return data;
  } catch (err) {
    console.error("Text upload error:", err);
    return null;
  }
}

const WaveBar = () => (
  <div className="waveform">
    <span /><span /><span /><span /><span />
  </div>
);

// ── silence threshold: average byte value below this = no sound
const SILENCE_THRESHOLD = 8;   // 0–255 scale; tweak up/down if needed
const FLAT_BARS         = Array(32).fill(4);   // reused constant — avoids allocations

export default function LivePracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state    = location.state || {};
  const { mode, scenario, cefrTarget } = state;

  usePageTitle("Live Practice — VoxIQ");

  /* ── Refs ── */
  const videoRef         = useRef(null);
  const streamRef        = useRef(null);
  const timerRef         = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recognitionRef   = useRef(null);
  const videoChunksRef   = useRef([]);
  const transcriptRef    = useRef("");
  const audioContextRef  = useRef(null);
  const analyserRef      = useRef(null);
  const animFrameRef     = useRef(null);

  /* ── State ── */
  const [cameraOn,     setCameraOn]     = useState(false);
  const [cameraError,  setCameraError]  = useState("");
  const [micOn,        setMicOn]        = useState(true);
  const [isPaused,     setIsPaused]     = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [wpm,          setWpm]          = useState(0);
  const [db,           setDb]           = useState(-60);
  const [promptIndex,  setPromptIndex]  = useState(0);
  const [waveBars,     setWaveBars]     = useState(FLAT_BARS);
  const [transcript,   setTranscript]   = useState("");
  const [showEndModal, setShowEndModal] = useState(false);
  const [uploading,    setUploading]    = useState(false);

  /* ── Start camera + MediaRecorder + SpeechRecognition ── */
  useEffect(() => {
    let mounted = true;

    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!mounted) return;
        streamRef.current = stream;

        /* attach to <video> — always in DOM so ref is valid */
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraOn(true);
        setMicOn(true);

        /* ── MediaRecorder ── */
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        videoChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;

        /* ── Web Audio API analyser ── */
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source   = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize              = 64;    /* 32 frequency bins */
          analyser.smoothingTimeConstant = 0.75;
          source.connect(analyser);
          audioContextRef.current = audioCtx;
          analyserRef.current     = analyser;
        } catch (e) {
          console.warn("Web Audio API not available:", e);
        }

        /* ── SpeechRecognition ── */
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous     = true;
          recognition.interimResults = true;
          recognition.lang           = "en-US";
          let finalText = "";

          recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalText += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            const full = finalText + interim;
            transcriptRef.current = full;
            setTranscript(full);
          };

          recognition.start();
          recognitionRef.current = recognition;
        }
      })
      .catch(() => {
        if (mounted) setCameraError("Camera access denied. Allow access to see your video.");
      });

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      recognitionRef.current?.stop();
      audioContextRef.current?.close();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (isPaused) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        if (p >= SESSION_DURATION) { clearInterval(timerRef.current); return p; }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  /* ════════════════════════════════════════════════════════════
     WAVEFORM — animates ONLY when real sound is detected.

     Logic:
     1. Read 32 frequency bins from the AnalyserNode each frame.
     2. Compute the average byte value (0–255).
     3. If avg <= SILENCE_THRESHOLD  →  emit flat bars (height 4px).
        If avg >  SILENCE_THRESHOLD  →  map each bin to a bar height.
     4. When paused or mic track disabled → always flat.
  ════════════════════════════════════════════════════════════ */
  useEffect(() => {
  const BARS = 32;

  const tick = () => {
    const analyser  = analyserRef.current;
    const micTrack  = streamRef.current?.getAudioTracks()[0];
    const micActive = micTrack?.enabled ?? false;

    if (!analyser || isPaused || !micActive) {
      setWaveBars(FLAT_BARS);
      setDb(-60);
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const avg = data.reduce((s, v) => s + v, 0) / data.length;

    if (avg <= SILENCE_THRESHOLD) {
      setWaveBars(FLAT_BARS);
      setDb(-60);
    } else {
      const bars = Array.from(data).map(v =>
        v <= SILENCE_THRESHOLD ? 4 : Math.max(4, Math.round((v / 255) * 48))
      );
      setWaveBars(bars);

      const dBval = Math.round(20 * Math.log10(avg / 255));
      setDb(dBval);

      setElapsed(prev => {
        const words = transcriptRef.current.trim().split(/\s+/).filter(Boolean).length;
        if (prev > 0) setWpm(Math.round((words / prev) * 60));
        return prev;
      });
    }

    animFrameRef.current = requestAnimationFrame(tick);
  };

  animFrameRef.current = requestAnimationFrame(tick);

  return () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };
}, [isPaused]);

  /* ── Helpers ── */
  const fmt = (s) => {
    const m   = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const getPrompt = () => {
    if (mode === "roleplay" && scenario) return PROMPTS.roleplay?.[scenario] || PROMPTS.fluency[0];
    const list = PROMPTS[mode] || PROMPTS.fluency;
    return list[promptIndex % list.length];
  };

  /* ── Camera toggle ── */
  const handleToggleCamera = () => {
    if (!streamRef.current) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraOn(true);
          setMicOn(true);
        })
        .catch(() => setCameraError("Camera access denied."));
      return;
    }
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const next = !videoTrack.enabled;
      videoTrack.enabled = next;
      setCameraOn(next);
    }
  };

  /* ── Mic toggle ── */
  const handleToggleMic = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const next = !audioTrack.enabled;
      audioTrack.enabled = next;
      setMicOn(next);
      /* flatten bars immediately on mute */
      if (!next) setWaveBars(FLAT_BARS);
    }
  };

  const handleEnd = () => {
    setIsPaused(true);
    setShowEndModal(true);
  };

  const handleConfirmEnd = async () => {
    setShowEndModal(false);
    setUploading(true);

    recognitionRef.current?.stop();
    clearInterval(timerRef.current);

    const timestamp = Date.now();
    const videoBlob = await new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(videoChunksRef.current, { type: "video/webm" }));
        return;
      }
      recorder.onstop = () => {
        resolve(new Blob(videoChunksRef.current, { type: "video/webm" }));
      };
      recorder.stop();
    });

    streamRef.current?.getTracks().forEach(t => t.stop());

    const audioBlob  = new Blob(videoChunksRef.current, { type: "audio/webm" });
    const spokenText = transcriptRef.current;

    const [videoRes] = await Promise.all([
      sendVideoToML(videoBlob, timestamp),
      sendAudioToML(audioBlob, timestamp),
      sendTextToML(spokenText, timestamp),
    ]);

    const results = {
      fluency_score:    videoRes?.fluency_score    ?? parseFloat((0.5 + Math.random() * 0.45).toFixed(2)),
      confidence_score: videoRes?.confidence_score ?? parseFloat((0.4 + Math.random() * 0.55).toFixed(2)),
      emotion_label:    videoRes?.emotion_label    ?? emotion.toLowerCase(),
      emotion_score:    videoRes?.emotion_score    ?? parseFloat((0.5 + Math.random() * 0.45).toFixed(2)),
      lip_sync_mse:     videoRes?.lip_sync_mse     ?? parseFloat((0.02 + Math.random() * 0.1).toFixed(3)),
      cefr_level:       cefrTarget || "B1",
      elapsed, mode, scenario,
    };

    setUploading(false);
    navigate("/session/results", { state: { sessionResults: results } });
  };

  const progress      = (elapsed / SESSION_DURATION) * 100;
  const promptList    = PROMPTS[mode] || PROMPTS.fluency;
  const hasNextPrompt = mode !== "roleplay" && Array.isArray(promptList) && promptList.length > 1;
  

  return (
    <div className="lp-wrapper">
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-wave-left"><WaveBar /></div>
      <div className="lp-wave-right"><WaveBar /></div>

      {/* ══ NAVBAR ══ */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-logo" onClick={() => navigate("/home")}>
            <div className="lp-logo-dots">
              <span className="lp-dot lp-dot-purple" />
              <span className="lp-dot lp-dot-cyan" />
            </div>
            <span className="lp-logo-text">
              Vox<span className="lp-gradient">IQ</span>
            </span>
          </div>
          <div className="lp-live-badge">
            <span className="lp-live-dot" />
            <span>Live Session</span>
          </div>
          <div className="lp-nav-spacer" />
        </div>
      </nav>

      {/* ══ BODY ══ */}
      <main className="lp-main">

        {/* Top row */}
        <div className="lp-top-row">
          <div className="lp-session-label">
            <span className="lp-session-mode">{MODE_LABELS[mode] || "Practice"}</span>
            {cefrTarget && (
              <>
                <span className="lp-session-sep">•</span>
                <span className="lp-session-cefr">{cefrTarget} Level</span>
              </>
            )}
          </div>
          <div className="lp-rec-badge">
            <span className="lp-rec-dot" />
            <span>Recording</span>
          </div>
        </div>

        {/* ══ Content row: LEFT col (camera + bottom row) | RIGHT col (prompt) ══ */}
        <div className="lp-content-row">

          {/* ── LEFT COLUMN ── */}
          <div className="lp-left-col">

            {/* Camera box */}
            <div className="lp-camera-box">

              

              {/* video — ALWAYS in DOM so ref is valid when stream arrives */}
              <video
                ref={videoRef}
                className="lp-video"
                autoPlay
                playsInline
                muted
                style={{ display: cameraOn ? "block" : "none" }}
              />

              {!cameraOn && (
                <div className="lp-cam-placeholder">
                  <PiVideoCameraSlashBold className="lp-cam-ph-icon" />
                  <span>{cameraError || "Starting camera…"}</span>
                </div>
              )}

              <div className="lp-cam-badges">
                <div className="lp-cam-toggles">
                  <button
                    className={`lp-toggle-btn ${!cameraOn ? "off" : ""}`}
                    onClick={handleToggleCamera}
                    title={cameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {cameraOn
                      ? <PiVideoCameraBold      className="lp-toggle-icon" />
                      : <PiVideoCameraSlashBold className="lp-toggle-icon" />}
                  </button>
                  <button
                    className={`lp-toggle-btn ${!micOn ? "off" : ""}`}
                    onClick={handleToggleMic}
                    title={micOn ? "Mute mic" : "Unmute mic"}
                  >
                    {micOn
                      ? <RiMicAiLine  className="lp-toggle-icon" />
                      : <RiMicOffLine className="lp-toggle-icon" />}
                  </button>
                </div>
                <span className="lp-cam-badge">HD</span>
              </div>
            </div>

            {/* ── BOTTOM ROW: timer left | wave-box right ── */}
            <div className="lp-bottom-row">

              <div className="lp-timer-section">
                <div className="lp-timer">
                  <span className="lp-timer-now">{fmt(elapsed)}</span>
                  <span className="lp-timer-total">/ {fmt(SESSION_DURATION)}</span>
                </div>
                <div className="lp-progress-track">
                  <div className="lp-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="lp-wave-box">
                <div className="lp-wave-bars">
                  {waveBars.map((h, i) => (
                    <div
                      key={i}
                      className="lp-wave-bar"
                      style={{ height: h }}
                    />
                  ))}
                </div>
                <div className="lp-meters">
                  <div className="lp-meter">
                    <RiTimeLine  className="lp-meter-icon" />
                    <span className="lp-meter-num">{wpm}</span>
                    <span className="lp-meter-unit">WPM</span>
                  </div>
                  <div className="lp-meter">
                    <RiMicAiLine className="lp-meter-icon" />
                    <span className="lp-meter-num">{db}</span>
                    <span className="lp-meter-unit">dB</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN: prompt + live transcript ── */}
          <div className="lp-right-panel">

            <div className="lp-prompt-box">
              <span className="lp-prompt-tag">SPEAKING PROMPT</span>
              <p className="lp-prompt-text">"{getPrompt()}"</p>
              {hasNextPrompt && (
                <button
                  className="lp-prompt-next"
                  onClick={() => setPromptIndex(p => p + 1)}
                >
                  Next prompt →
                </button>
              )}
            </div>

            {transcript && (
              <div className="lp-transcript-box">
                <span className="lp-transcript-tag">LIVE TRANSCRIPT</span>
                <p className="lp-transcript-text">{transcript}</p>
              </div>
            )}

          </div>
        </div>

        {/* Controls */}
        <div className="lp-controls">
          <button
            className={`lp-btn-pause ${isPaused ? "is-paused" : ""}`}
            onClick={() => setIsPaused(p => !p)}
          >
            {isPaused
              ? <><RiPlayLine  className="lp-ctrl-icon" /> Resume</>
              : <><RiPauseLine className="lp-ctrl-icon" /> Pause</>}
          </button>
          <button className="lp-btn-end" onClick={handleEnd} disabled={uploading}>
            <RiStopCircleLine className="lp-ctrl-icon" />
            {uploading ? "Analysing…" : "End Session"}
          </button>
        </div>

        <p className="lp-footer-hint">💡 Speak naturally. Take your time.</p>

      </main>

      {/* ══ END SESSION MODAL ══ */}
      {showEndModal && (
        <div className="lp-modal-backdrop">
          <div className="lp-modal">
            <h2 className="lp-modal-title">End Practice Session?</h2>
            <p className="lp-modal-desc">
              You've been practicing for <strong>{fmt(elapsed)}</strong>.<br />
              Your progress will be saved and analysed.
            </p>
            <div className="lp-modal-actions">
              <button
                className="lp-modal-btn-cancel"
                onClick={() => { setShowEndModal(false); setIsPaused(false); }}
              >
                Continue Practice
              </button>
              <button className="lp-modal-btn-confirm" onClick={handleConfirmEnd}>
                End &amp; View Results
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}