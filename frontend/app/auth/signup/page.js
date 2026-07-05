"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "../../../stores/authStore"
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
    const check = () => setIsLight(document.documentElement.classList.contains('light'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: isLight ? "#f5f3ef" : "#030712" }}
      >
        <div style={{ color: isLight ? "#111111" : "#ffffff" }} className="font-sans text-sm font-medium">
          Loading...
        </div>
      </div>
    )
  }

  if (isAuthenticated) return null

  // Styling theme tokens
  const leftBg = isLight ? "#111111" : "#0d1527"
  const rightBg = isLight ? "#f5f3ef" : "#030712"
  const borderCol = isLight ? "#e8e4de" : "#1e293b"

  return (
    <div
      className="min-h-screen md:h-screen w-screen flex flex-col md:flex-row overflow-x-hidden md:overflow-y-hidden"
      style={{ background: rightBg, transition: "background 0.3s ease" }}
    >
      <style jsx global>{`
        body {
          font-family: var(--font-space-grotesk, system-ui, sans-serif);
          overflow-x: hidden;
        }
      `}</style>

      {/* Left Column: marketing/branding (fully filled) */}
      <div
        className="hidden md:flex md:w-1/2 min-h-screen flex-col justify-between px-12 py-8 lg:px-16 lg:py-10 relative overflow-hidden transition-colors duration-300"
        style={{ background: leftBg, borderRight: `1px solid ${borderCol}` }}
      >
        {/* Glow blobs for dark mode only */}
        {!isLight && (
          <>
            <div className="absolute" style={{
              bottom: "-40px", left: "-20px",
              width: "320px", height: "320px",
              borderRadius: "50%", background: "#2563eb",
              filter: "blur(90px)", opacity: 0.25, zIndex: 1,
            }} />
            <div className="absolute" style={{
              top: "-30px", right: "-20px",
              width: "220px", height: "220px",
              borderRadius: "50%", background: "#8b5cf6",
              filter: "blur(80px)", opacity: 0.2, zIndex: 1,
            }} />
          </>
        )}

        {/* Content (Z-index 10) */}
        <div className="relative z-10 flex flex-col justify-between h-full">

          {/* Marketing Copy */}
          <div className="my-auto py-12">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block"
              style={{ color: isLight ? "#9ca3af" : "#3b82f6" }}
            >
              For Teams & Creators
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.15] text-white tracking-tight mb-4">
              Automate your workflows.<br />Build smarter, faster.
            </h1>
            <p className="text-base text-gray-400 max-w-md leading-relaxed">
              Join thousands of teams using AutoFlow to save time and scale their operations.
            </p>
          </div>

          {/* Bottom brand tagline */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Automation made effortless
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Signup Form (fully filled) */}
      <div className="flex-1 min-h-screen flex flex-col justify-center px-6 py-12 md:p-12 lg:p-20 relative z-20">
        <SignupForm
          onSwitchToLogin={() => router.push("/auth/login")}
          isLight={isLight}
        />
      </div>
    </div>
  )
}
