// src/components/ui/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  Package,
  Plus,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Shield,
  MapPin,
  ExternalLink,
} from "lucide-react";

export function Navbar() {
  const { user, logout, loginAsDemo, unreadNotifs, setUnreadNotifs } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadNotifs(data.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (user && mounted) fetchNotifs();
  }, [user, pathname, mounted]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setUnreadNotifs(0);
      fetchNotifs();
    } catch {}
  };

  const isCurrent = (path: string) => pathname === path || pathname?.startsWith(path + "/");
  const currentUser = mounted ? user : null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80" suppressHydrationWarning>
      {/* Top Demo Context Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-8 py-1 flex items-center justify-between border-b border-slate-800/80" suppressHydrationWarning>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Evaluation Persona
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-300">
            {currentUser ? (
              <>
                Signed in as <strong className="text-white font-medium">{currentUser.name}</strong> ({currentUser.role.replace(/_/g, " ")})
              </>
            ) : (
              "Guest View"
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 mr-1 hidden md:inline text-[10px] uppercase font-mono">Switch Role:</span>
          <button
            onClick={() => loginAsDemo("CUSTOMER")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
              currentUser?.role === "CUSTOMER"
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => loginAsDemo("DELIVERY_AGENT")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
              currentUser?.role === "DELIVERY_AGENT"
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Agent
          </button>
          <button
            onClick={() => loginAsDemo("ADMIN")}
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
              currentUser?.role === "ADMIN"
                ? "bg-emerald-600 text-white font-semibold shadow-xs"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-sm tracking-tighter group-hover:bg-blue-600 transition">
                S
              </div>
              <div className="leading-none">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  SwiftMile
                </span>
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider mt-0.5">
                  Last-Mile Platform
                </span>
              </div>
            </Link>

            {/* Role Navigation */}
            <nav className="hidden md:flex items-center gap-0.5">
              {currentUser?.role === "CUSTOMER" && (
                <>
                  <Link
                    href="/customer/dashboard"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/customer/dashboard")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/customer/create"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/customer/create")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    New Shipment
                  </Link>
                  <Link
                    href="/customer/orders"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/customer/orders")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Shipment History
                  </Link>
                </>
              )}

              {currentUser?.role === "DELIVERY_AGENT" && (
                <>
                  <Link
                    href="/agent/dashboard"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/agent/dashboard")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Dispatcher Console
                  </Link>
                  <Link
                    href="/agent/deliveries"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/agent/deliveries")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Active Route
                  </Link>
                </>
              )}

              {currentUser?.role === "ADMIN" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/admin/dashboard")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Operations Overview
                  </Link>
                  <Link
                    href="/admin/orders"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/admin/orders")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/admin/zones"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/admin/zones")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Zones & Coverage
                  </Link>
                  <Link
                    href="/admin/rate-cards"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/admin/rate-cards")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Rate Cards
                  </Link>
                  <Link
                    href="/admin/agents"
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isCurrent("/admin/agents")
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Fleet
                  </Link>
                </>
              )}

              <Link
                href="/track"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                  isCurrent("/track")
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Track
              </Link>
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5">
            {currentUser?.role === "CUSTOMER" && (
              <Link
                href="/customer/create"
                className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Book Shipment
              </Link>
            )}

            {/* Notification Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    if (!showNotifs) fetchNotifs();
                  }}
                  className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in text-xs">
                    <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-900">Notifications</span>
                      {unreadNotifs > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400">No new alerts</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-3 hover:bg-slate-50 transition">
                            <p className="font-semibold text-slate-800">{n.title}</p>
                            <p className="text-slate-600 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-slate-800 text-white font-semibold flex items-center justify-center text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name.split(" ")[0]}</p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-fade-in text-xs">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                      {currentUser.role === "CUSTOMER" && (
                        <Link
                          href="/customer/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-3.5 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          Shipment History
                        </Link>
                      )}
                      {currentUser.role === "DELIVERY_AGENT" && (
                        <Link
                          href="/agent/deliveries"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-3.5 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          Assigned Route
                        </Link>
                      )}
                      {currentUser.role === "ADMIN" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-3.5 py-1.5 text-slate-700 hover:bg-slate-50"
                        >
                          Control Tower
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-md transition shadow-2xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
