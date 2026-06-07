import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute       from './components/layout/ProtectedRoute';
import LandingPage          from './pages/LandingPage';
import AuthPage             from './pages/AuthPage';
import HomePage             from './pages/HomePage';
import GoogleCallback       from './pages/GoogleCallback';
import ChatbotPage          from './pages/ChatbotPage';
import SessionSummaryPage   from './pages/SessionSummaryPage';
import SessionResultsPage   from './pages/SessionResultsPage';
import AssessmentReportPage from './pages/AssessmentReportPage';
import LivePracticePage     from './pages/LivePracticePage';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
          style={{ zIndex: 99999 }}
        />

        <Routes>
          {/* ── PUBLIC ── */}
          <Route path="/"              element={<LandingPage />} />
          <Route path="/login"         element={<AuthPage />} />
          <Route path="/register"      element={<AuthPage />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />

          {/* ── PROTECTED ── */}
          <Route path="/home" element={
            <ProtectedRoute><HomePage /></ProtectedRoute>
          } />
          <Route path="/chatbot" element={
            <ProtectedRoute><ChatbotPage /></ProtectedRoute>
          } />
          <Route path="/session/summary" element={
            <ProtectedRoute><SessionSummaryPage /></ProtectedRoute>
          } />
          <Route path="/session/live" element={
            <ProtectedRoute><LivePracticePage /></ProtectedRoute>
          } />
          <Route path="/session/results" element={
            <ProtectedRoute><SessionResultsPage /></ProtectedRoute>
          } />
          <Route path="/session/report" element={
            <ProtectedRoute><AssessmentReportPage /></ProtectedRoute>
          } />

          {/* ── FALLBACK ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}