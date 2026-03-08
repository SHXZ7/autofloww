"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "../../../stores/authStore"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import SignupForm from "../../../components/auth/SignupForm"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthStore()
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains("light"))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: isLight ? "#f5f0eb" : "#020617" }}>
        <div style={{ color: isLight ? "#1e293b" : "#F1F5F9" }} className="font-mono">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) return null

  return (
    <div className="h-screen flex items-center justify-center overflow-hidden p-4 relative"
      style={{ background: isLight ? "#f5f0eb" : "#020617", transition: "background 0.2s" }}>
      <style jsx global>{`
        body { font-family: var(--font-space-grotesk, system-ui, sans-serif); }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.35); }
          50%       { box-shadow: 0 0 32px rgba(59,130,246,0.65); }
        }
        .signup-pulse { animation: pulse-glow 2s infinite; }
      `}</style>

      {/* Back button */}
      <button
        onClick={() => router.push("/homepage")}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 transition-all duration-200 group"
        style={{ color: isLight ? "#52525b" : "#9ca3af" }}
      >
        <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Home</span>
      </button>

      {/* Split-panel card */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
        style={{ borderRadius: "0px", border: isLight ? "1px solid #e2e8f0" : "1px solid #1e293b", height: "min(680px, calc(100vh - 60px))" }}>

        {/* ── Left: dark decorative panel ── */}
        <div className="hidden md:flex md:w-1/2 relative flex-col justify-between overflow-hidden p-8"
          style={{ background: "#000000" }}>

          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.75) 100%)",
            zIndex: 2, pointerEvents: "none"
          }} />

          {/* Stripe pattern */}
          <div className="absolute inset-0 flex opacity-20" style={{ zIndex: 1 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                flex: "0 0 12.5%",
                background: "linear-gradient(90deg, transparent, #000 60%, rgba(255,255,255,0.15))"
              }} />
            ))}
          </div>

            {/* Blue glow blob */}
          <div className="absolute" style={{
            bottom: "-40px", left: "-20px",
            width: "260px", height: "260px",
            borderRadius: "50%",
            background: "#3b82f6",
            filter: "blur(70px)",
            opacity: 0.4,
            zIndex: 1,
          }} />
          {/* Purple glow blob */}
          <div className="absolute" style={{
            top: "-30px", right: "-20px",
            width: "180px", height: "180px",
            borderRadius: "50%",
            background: "#8b5cf6",
            filter: "blur(60px)",
            opacity: 0.35,
            zIndex: 1,
          }} />

          {/* Content (above overlays) */}
          <div className="relative flex flex-col justify-between h-full" style={{ zIndex: 10 }}>
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#3B82F6,#8B5CF6)" }}>
                <span className="text-white font-bold text-sm font-mono">AF</span>
              </div>
              <span className="font-mono font-bold text-lg text-white">AutoFlow</span>
            </div>

            {/* Tagline */}
            <div>
              <h1 className="text-2xl md:text-3xl font-medium leading-tight tracking-tight text-white mb-3">
                Automate your workflows.<br />Build smarter, faster.
              </h1>
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                Join thousands of teams using AutoFlow to save time and scale their operations.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="flex flex-col gap-2">
              {["Visual workflow builder", "AI-powered automation", "100+ integrations"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "#9ca3af" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316", flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="flex-1 flex flex-col justify-center overflow-y-auto p-8 md:p-10"
          style={{ background: isLight ? "#ffffff" : "#020617", transition: "background 0.2s" }}>
          <SignupForm
            onSwitchToLogin={() => router.push("/auth/login")}
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  )
}
