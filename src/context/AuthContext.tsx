// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "CUSTOMER" | "DELIVERY_AGENT" | "ADMIN";
  customerProfile?: any;
  agentProfile?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginAsDemo: (role: "CUSTOMER" | "DELIVERY_AGENT" | "ADMIN") => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  unreadNotifs: number;
  setUnreadNotifs: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Fetch unread notifications
        const notifRes = await fetch("/api/notifications");
        const notifData = await notifRes.json();
        if (notifData.unreadCount !== undefined) {
          setUnreadNotifs(notifData.unreadCount);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginAsDemo = async (role: "CUSTOMER" | "DELIVERY_AGENT" | "ADMIN") => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        if (role === "ADMIN") router.push("/admin/dashboard");
        else if (role === "DELIVERY_AGENT") router.push("/agent/dashboard");
        else router.push("/customer/dashboard");
      }
    } catch (err) {
      console.error("Demo login error", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginAsDemo, logout, refreshUser, unreadNotifs, setUnreadNotifs }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
