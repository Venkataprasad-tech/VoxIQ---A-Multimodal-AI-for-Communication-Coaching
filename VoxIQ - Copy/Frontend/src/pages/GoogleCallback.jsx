import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "../components/layout/ProtectedRoute.css";


export default function GoogleCallback() {
  const navigate           = useNavigate();
  const [searchParams]     = useSearchParams();
  const { user, loading, setGoogleToken } = useAuth();

  /* Step 1 — on mount, read token from URL and save it to AuthContext */
  useEffect(() => {
    const token = searchParams.get("token");
    const isNew = searchParams.get("new");

    if (!token) {
      /* no token — something went wrong */
      toast.error("Google sign-in failed. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    /* save token → triggers AuthContext useEffect → fetches user profile */
    setGoogleToken(token);

    /* store isNew flag so we can show the right toast after user loads */
    sessionStorage.setItem("google_is_new", isNew === "1" ? "1" : "0");

    /* clean the token out of the URL */
    window.history.replaceState({}, "", "/auth/callback");
  }, []);


  useEffect(() => {
    if (!loading && user) {
      const isNew = sessionStorage.getItem("google_is_new");
      sessionStorage.removeItem("google_is_new");

      toast.success(
        isNew === "1"
          ? "Account Created! Welcome to VoxIQ 🎉"
          : "Login Successful! Welcome back 👋"
      );

      navigate("/home", { replace: true });
    }
  }, [loading, user]);

  
  return (
    <div className="protected-loader">
      <div className="protected-spinner" />
    </div>
  );
}