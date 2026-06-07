import api from './axios';

/*
  chatbotAPI.sendMessage

  sessionResults shape (all optional — send what you have):
  {
    emotion_label:    "nervous" | "happy" | "neutral" | etc.
    emotion_score:    0.0 – 1.0
    fluency_score:    0.0 – 1.0
    lip_sync_mse:     0.0 – 0.2+ (lower is better)
    confidence_score: 0.0 – 1.0
    cefr_level:       "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
    feedback_text:    "string from system"
  }
*/
export const chatbotAPI = {
  sendMessage: async (message, history = [], sessionResults = {}) => {
    const res = await api.post('/api/chatbot/chat', {
      message,
      history,
      ...sessionResults,   // spreads all score fields directly into request body
    });
    return res.data;       // { reply: "..." }
  },
};