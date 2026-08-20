// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "SwiftMile Logistics — Last-Mile Delivery Management Platform",
  description:
    "Production-grade Indian Last-Mile Delivery SaaS platform with dynamic zone pricing, volumetric rate calculations, deterministic agent auto-assignment, and live tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500" suppressHydrationWarning>
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2" suppressHydrationWarning>
              <p>© 2026 SwiftMile Logistics Pvt Ltd. Indian SI Metric Units (cm, kg, ₹ INR).</p>
              <p className="font-medium text-slate-600">Consumer, Agent & Admin Last-Mile SaaS Platform</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
