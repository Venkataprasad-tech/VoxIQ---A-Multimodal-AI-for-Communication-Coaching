import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePageTitle from "../hooks/usePageTitle";
import { chatbotAPI } from "../api/chatbot";
import { LuSend, LuLoaderPinwheel, LuSearch, LuPlus, LuMessageSquare } from "react-icons/lu";
import { BsLayoutTextSidebarReverse } from "react-icons/bs";
import "./ChatbotPage.css";
import { TiArrowBackOutline } from "react-icons/ti";

const SCORE_LABELS = {
  fluency:    (v) => v >= 0.85 ? "Excellent" : v >= 0.70 ? "Good" : v >= 0.55 ? "Moderate" : "Needs Work",
  confidence: (v) => v >= 0.80 ? "High"      : v >= 0.60 ? "Moderate" : v >= 0.40 ? "Low"  : "Very Low",
  lipsync:    (v) => v <= 0.03 ? "Excellent" : v <= 0.07 ? "Good"     : v <= 0.12 ? "Fair"  : "Poor",
};

const WaveBar = () => (
  <div className="waveform">
    <span /><span /><span /><span /><span />
  </div>
);

const makeConversation = (greeting) => ({
  id:       Date.now(),
  title:    "New conversation",
  messages: [{ role: "model", text: greeting }],
});

export default function ChatbotPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  usePageTitle("ARIA — VoxIQ Coach");

  const sessionResults = location.state?.sessionResults || {};
  const hasScores      = Object.keys(sessionResults).length > 0;
  const firstName      = user?.name?.split(" ")[0] || "there";

  const greeting = hasScores
    ? `Hi ${firstName} 👋 I've analysed your session results.\n\n` +
      (sessionResults.confidence_score != null
        ? `Your confidence score is **${(sessionResults.confidence_score * 100).toFixed(1)}%** ` +
          `(${SCORE_LABELS.confidence(sessionResults.confidence_score)}) and fluency is **${sessionResults.fluency_score?.toFixed(2) ?? "N/A"}** ` +
          `(${SCORE_LABELS.fluency(sessionResults.fluency_score ?? 0)}).\n\n`
        : "") +
      `Ask me anything and I'll give you personalised advice based on your scores!`
    : `Hi ${firstName} 👋 I'm **ARIA**, your VoxIQ communication coach.\n\nI can help you prepare for interviews, improve fluency, control nervousness, and much more. What would you like to work on today?`;

  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [conversations, setConversations] = useState(() => [makeConversation(greeting)]);
  const [activeId,      setActiveId]      = useState(() => Date.now());
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const activeConv = conversations.find(c => c.id === activeId) || conversations[0];
  const messages   = activeConv?.messages || [];

  const updateMessages = (id, newMsgs) =>
    setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: newMsgs } : c));

  const updateTitle = (id, text) => {
    const title = text.length > 36 ? text.slice(0, 36) + "…" : text;
    setConversations(prev =>
      prev.map(c => c.id === id && c.title === "New conversation" ? { ...c, title } : c)
    );
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  
  useEffect(() => {
    if (conversations.length > 0) setActiveId(conversations[0].id);
  }, []);

  const handleNewChat = () => {
    const newConv = makeConversation(greeting);
    setConversations(prev => [newConv, ...prev]);
    setActiveId(newConv.id);
    setInput("");
    setError("");
  };

  const handleSelectConv = (id) => {
    setActiveId(id);
    setInput("");
    setError("");
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", text }];
    updateMessages(activeId, newMessages);
    updateTitle(activeId, text);
    setInput("");
    setError("");
    setLoading(true);

    const history = newMessages
      .slice(1, -1)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const data = await chatbotAPI.sendMessage(text, history, sessionResults);
      updateMessages(activeId, [...newMessages, { role: "model", text: data.reply }]);
    } catch (err) {
      setError(err.message || "ARIA couldn't respond. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestions = hasScores
    ? [
        `Why is my confidence at ${(sessionResults.confidence_score * 100).toFixed(0)}%?`,
        "How do I reduce nervousness in interviews?",
        "Give me exercises for fluency improvement",
        `What does ${sessionResults.cefr_level || "my CEFR level"} mean?`,
      ]
    : [
        "How do I prepare for a job interview?",
        "Tips to improve pronunciation",
        "How to sound more confident?",
        "What is CEFR and which level am I?",
      ];

  const renderText = (text) =>
    text.split("**").map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );

  return (
    <div className="chat-wrapper">

      {/* ── SVG gradient def — used by sidebar icons ── */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="sidebar-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7B6EF6" />
            <stop offset="100%" stopColor="#2EECC5" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── BACKGROUND ── */}
      <div className="chat-noise-overlay" />
      <div className="chat-orb chat-orb-1" />
      <div className="chat-orb chat-orb-2" />
      <div className="chat-orb chat-orb-3" />
      <div className="chat-wave-left"><WaveBar /></div>
      <div className="chat-wave-right"><WaveBar /></div>

      {/* ══════════════════════════════════
          NAVBAR — full width, above everything
      ══════════════════════════════════ */}
      <nav className="chat-nav">
        <div className="chat-nav-inner">

          {/* Logo — left */}
          <div className="chat-logo" onClick={() => navigate("/home")}>
            <div className="chat-logo-dots">
              <span className="c-dot c-dot-purple" />
              <span className="c-dot c-dot-cyan" />
            </div>
            <span className="chat-logo-text">
              Vox<span className="c-gradient">IQ</span>
            </span>
          </div>

          {/* ARIA badge — true centre */}
          <div className="chat-nav-center">
            <div className="chat-aria-badge">
              <span className="chat-aria-dot" />
              <span className="chat-aria-name">ARIA</span>
            </div>
            <span className="chat-nav-sub">Adaptive Response & Interview Advisor</span>
          </div>

          {/* Back — right */}
          <button className="chat-back-btn" onClick={() => navigate(-1)}>
            <TiArrowBackOutline /> Back
          </button>

        </div>
      </nav>

      {/* ══════════════════════════════════
          CONTENT ROW — sidebar + chat
          sits strictly BELOW the navbar
      ══════════════════════════════════ */}
      <div className="chat-content-row">

        {/* ── SIDEBAR ── */}
        <aside className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>

          {/* Sidebar header */}
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <span className="sidebar-aria-dot-pulse" />
              <span className="sidebar-aria-name">ARIA</span>
            </div>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
            >
              <BsLayoutTextSidebarReverse />
            </button>
          </div>

          {/* New Chat */}
          <button className="sidebar-new-chat" onClick={handleNewChat}>
            <LuPlus className="sidebar-btn-icon" />
            <span>New Chat</span>
          </button>

          {/* Search */}
          <div className="sidebar-search-wrap">
            <LuSearch className="sidebar-search-icon" />
            <input
              className="sidebar-search"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Recents */}
          <div className="sidebar-recents">
            <span className="sidebar-recents-label">Recents</span>
            <div className="sidebar-conv-list">
              {filteredConvs.length === 0 && (
                <span className="sidebar-empty">No conversations found</span>
              )}
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  className={`sidebar-conv-item ${conv.id === activeId ? "active" : ""}`}
                  onClick={() => handleSelectConv(conv.id)}
                >
                  <LuMessageSquare className="sidebar-conv-icon" />
                  <span className="sidebar-conv-title">{conv.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User info */}
          <div className="sidebar-footer">
            <div className="sidebar-user-avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user?.name} />
                : <span>{user?.name?.[0]?.toUpperCase() ?? "U"}</span>
              }
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
          </div>

        </aside>

        {/* ── CHAT PANEL ── */}
        <div className="chat-panel">

          {/* Sidebar open button — shows when sidebar is closed */}
          {!sidebarOpen && (
            <button
              className="sidebar-open-btn"
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
            >
              <BsLayoutTextSidebarReverse />
            </button>
          )}

          <main className="chat-main">

            {/* session score cards */}
            {hasScores && (
              <div className="chat-score-bar">
                {sessionResults.confidence_score != null && (
                  <div className="chat-score-card">
                    <span className="chat-score-icon">💪</span>
                    <div>
                      <span className="chat-score-label">Confidence</span>
                      <span className="chat-score-value">
                        {(sessionResults.confidence_score * 100).toFixed(1)}%
                        <em>{SCORE_LABELS.confidence(sessionResults.confidence_score)}</em>
                      </span>
                    </div>
                  </div>
                )}
                {sessionResults.fluency_score != null && (
                  <div className="chat-score-card">
                    <span className="chat-score-icon">🎙️</span>
                    <div>
                      <span className="chat-score-label">Fluency</span>
                      <span className="chat-score-value">
                        {sessionResults.fluency_score.toFixed(2)}
                        <em>{SCORE_LABELS.fluency(sessionResults.fluency_score)}</em>
                      </span>
                    </div>
                  </div>
                )}
                {sessionResults.emotion_label && (
                  <div className="chat-score-card">
                    <span className="chat-score-icon">😊</span>
                    <div>
                      <span className="chat-score-label">Emotion</span>
                      <span className="chat-score-value">
                        {sessionResults.emotion_label}
                        {sessionResults.emotion_score != null &&
                          <em>{(sessionResults.emotion_score * 100).toFixed(0)}%</em>
                        }
                      </span>
                    </div>
                  </div>
                )}
                {sessionResults.lip_sync_mse != null && (
                  <div className="chat-score-card">
                    <span className="chat-score-icon">👄</span>
                    <div>
                      <span className="chat-score-label">Lip Sync</span>
                      <span className="chat-score-value">
                        {sessionResults.lip_sync_mse.toFixed(3)}
                        <em>{SCORE_LABELS.lipsync(sessionResults.lip_sync_mse)}</em>
                      </span>
                    </div>
                  </div>
                )}
                {sessionResults.cefr_level && (
                  <div className="chat-score-card">
                    <span className="chat-score-icon">📊</span>
                    <div>
                      <span className="chat-score-label">CEFR</span>
                      <span className="chat-score-value">{sessionResults.cefr_level}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* messages */}
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble-row ${msg.role}`}>
                  {msg.role === "model" && <div className="chat-avatar-aria">A</div>}
                  <div className={`chat-bubble ${msg.role}`}>
                    {renderText(msg.text)}
                  </div>
                  {msg.role === "user" && (
                    <div className="chat-avatar-user">
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt="you" />
                        : <span>{user?.name?.[0]?.toUpperCase() ?? "U"}</span>
                      }
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="chat-bubble-row model">
                  <div className="chat-avatar-aria">A</div>
                  <div className="chat-bubble model chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              {error && <div className="chat-error">{error}</div>}
              <div ref={bottomRef} />
            </div>

            {/* suggestion chips */}
            {messages.length <= 1 && (
              <div className="chat-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="chat-chip"
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* input */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Ask ARIA about your communication skills..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                {loading
                  ? <LuLoaderPinwheel className="chat-send-spinner" />
                  : <LuSend />
                }
              </button>
            </div>

            <p className="chat-disclaimer">
              ARIA only answers communication, fluency, and interview coaching questions.
            </p>

          </main>
        </div>

      </div>{/* end chat-content-row */}
    </div>
  );
}