import React, { createContext, useContext, useState, useEffect } from "react";
import { SystemUser } from "../types";
import { createActivityLog } from "../lib/activityLogService";

// Inactivity timeout (ms). After this much user inactivity the
// session is cleared and the next navigation forces a re-login.
// This is additive only — it does not change JWT expiry, role
// logic, or the existing auth architecture.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthContextType {
  user: SystemUser | null;
  isLoading: boolean;
  currentAdminEmail?: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const session = localStorage.getItem("shiv_infra_active_user");
      if (session) {
        setUser(JSON.parse(session));
      }
      const adminEmail = localStorage.getItem("admin_email");
      if (adminEmail) {
        setCurrentAdminEmail(JSON.parse(adminEmail));
      }
    } catch {
      localStorage.removeItem("shiv_infra_active_user");
      localStorage.removeItem("admin_email");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Additive inactivity timeout.
  // Only active when a user is authenticated. Resets on any user
  // interaction (click/scroll/key) so a working session is never
  // interrupted. After INACTIVITY_TIMEOUT_MS of no activity the
  // local session is cleared; the next navigation re-requests
  // login. Does NOT change JWT expiry or role logic.
  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setUser(null);
        localStorage.removeItem("shiv_infra_active_user");
        localStorage.removeItem("token");
        createActivityLog("Access", "Session expired due to inactivity", user?.email || "unknown").catch(() => {});
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "focus"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      if (!response.ok) {
        try {
          data = await response.json();
        } catch {
          // empty or non-JSON error body
        }
        return { success: false, error: data.message || "Invalid email or password" };
      }

      try {
        data = await response.json();
      } catch {
        return { success: false, error: "Server connection failed" };
      }

      if (!data.user || !data.token) {
        return { success: false, error: "Invalid login response" };
      }

      const loggedUser: SystemUser = {
        id: data.user.id,
        company_id: data.user.company_id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        status: "Active",
      };

      setUser(loggedUser);
      localStorage.setItem("shiv_infra_active_user", JSON.stringify(loggedUser));
      localStorage.setItem("token", data.token);

      createActivityLog("Access", `Admin login successful ${email}`, email).catch(() => {});

      return { success: true };
    } catch {
      console.error("LOGIN ERROR:");
      return { success: false, error: "Server connection failed" };
    }
  };

  const logout = async () => {
    // Best-effort server-side logout hook so the call no longer 404s.
    const token = localStorage.getItem("token");
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      });
    } catch {
      // Non-fatal: local session is cleared regardless.
    }
    setUser(null);
    localStorage.removeItem("shiv_infra_active_user");
    localStorage.removeItem("token");
    createActivityLog("Access", "Admin logout", user?.email || "unknown").catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, currentAdminEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
