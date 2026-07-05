"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  StarIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  CircleStackIcon,
  DocumentChartBarIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  LinkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAuthStore } from "../../stores/authStore"
import LogoSlider from "../../components/LogoSlider"
import ThemeSwitch from "../../components/ThemeSwitch"

const VideoRevealSection = dynamic(() => import("../../components/VideoRevealSection"), { ssr: false })
const HowItWorksSection = dynamic(() => import("../../components/HowItWorksSection"), { ssr: false })
const ParticleBackground = dynamic(() => import("../../components/ParticleBackground"), { ssr: false })

export default function Homepage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showTimeout, setShowTimeout] = useState(false)
  const { isAuthenticated, loading, checkAuth } = useAuthStore()
  const [isLight, setIsLight] = useState(false)

  // Sync isLight state with HTML class list
  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  useEffect(() => {
    if (isAuthenticated === true) router.push("/")
  }, [isAuthenticated, router])

  useEffect(() => {
    const id = setTimeout(() => { if (loading) setShowTimeout(true) }, 3000)
    return () => clearTimeout(id)
  }, [loading])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isLight ? "bg-[#f5f3ef]" : "bg-[#030712]"}`}>
        <div className="text-center">
          <div className="mx-auto mb-4">
            <img src="/images/autoflow.png" alt="AutoFlow" className="h-16 w-auto object-contain" />
          </div>
          <div className={`text-lg font-medium ${isLight ? "text-[#111]" : "text-white"}`}>Loading...</div>
          {showTimeout && (
            <p className="mt-4 text-sm text-[#71717a]">
              <button onClick={() => window.location.reload()} className="text-[#3b82f6] underline">Refresh</button>
              {" or "}
              <button onClick={() => router.push("/auth/login")} className="text-[#3b82f6] underline">go to login</button>
            </p>
          )}
        </div>
      </div>
    )
  }

  // Theme Design Variables matching the provided image
  const primaryBg = isLight ? "#f5f3ef" : "#030712"
  const secondaryBg = isLight ? "#ffffff" : "#0d1527"
  const footerBg = isLight ? "#f5f3ef" : "#050814"
  const accentColor = isLight ? "#e35b1a" : "#3b82f6"
  const accentHover = isLight ? "#c2410c" : "#2563eb"
  const primaryText = isLight ? "#111111" : "#ffffff"
  const secondaryText = isLight ? "#52525b" : "#9ca3af"
  const mutedText = isLight ? "#71717a" : "#6b7280"
  const borderColor = isLight ? "#e8e4de" : "#1e293b"
  const ctaBtnBg = isLight ? "#111" : "#2563eb"
  const ctaBtnHover = isLight ? "#27272a" : "#1d4ed8"

  return (
    <div
      className="min-h-screen overflow-x-hidden transition-colors duration-300"
      style={{ background: primaryBg, color: primaryText }}
    >
      {/* Header */}
      <header className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 w-[94%] sm:w-[92%] max-w-6xl z-50 transition-all duration-300">
        <div
          className="backdrop-blur-md border shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[20px] px-3 py-2 sm:px-6 sm:py-4 transition-colors duration-300"
          style={{
            background: isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(13, 21, 39, 0.8)",
            borderColor: borderColor,
          }}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-0">
              <img src="/images/autoflow.png" alt="AutoFlow" className="h-9 sm:h-12 w-auto object-contain" />
              <span className="hidden min-[420px]:inline text-base sm:text-lg font-bold tracking-tight transition-colors -ml-2" style={{ color: primaryText }}>AutoFlow</span>
            </a>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Switcher Toggle */}
              <ThemeSwitch className={isLight ? "text-[#52525b] hover:bg-[#e2e8f0]" : "text-[#9ca3af] hover:bg-[#1e293b]"} />

              <button
                onClick={() => router.push("/auth/login")}
                className="hidden sm:inline-flex text-sm font-medium transition-colors px-3 py-2"
                style={{ color: secondaryText }}
              >
                Log in
              </button>
              <button
                onClick={() => router.push("/auth/signup")}
                className="flex items-center gap-1 sm:gap-2 rounded-xl px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-all hover:scale-[1.02]"
                style={{ background: ctaBtnBg }}
                onMouseEnter={(e) => { e.currentTarget.style.background = ctaBtnHover }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ctaBtnBg }}
              >
                Get Started
                <ArrowUpRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero section ── */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center px-4 md:px-8 transition-colors duration-300"
        style={{ background: primaryBg }}
      >
        {!isLight && <ParticleBackground />}
        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm transition-colors"
            style={{
              borderColor: borderColor,
              background: isLight ? "rgba(255, 255, 255, 0.7)" : "rgba(13, 21, 39, 0.7)",
              color: secondaryText,
            }}
          >
            <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
            Open-source workflow automation platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl text-[1.85rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold leading-[1.15] tracking-tight transition-colors"
            style={{ color: primaryText }}
          >
            The AI platform that makes your{" "}
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: accentColor,
              }}
              className="transition-colors"
            >
              workflows effortless
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-base md:text-lg transition-colors"
            style={{ color: secondaryText }}
          >
            Visual automation for teams — connect AI, APIs, and services to build powerful workflows without code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4"
          >
            <button
              onClick={() => router.push("/auth/signup")}
              className="flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium text-white transition-colors md:px-7 md:text-base hover:opacity-90"
              style={{ background: ctaBtnBg }}
            >
              Get Started Free
              <ArrowUpRightIcon className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="rounded-full border px-6 py-3.5 text-sm font-medium transition-colors md:px-7 md:text-base"
              style={{
                borderColor: borderColor,
                background: secondaryBg,
                color: primaryText,
              }}
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* Scroll nudge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: secondaryText }}>Scroll</span>
          <motion.div
            className="w-px h-10 bg-gradient-to-b to-transparent"
            style={{ "--tw-gradient-from": accentColor }}
            animate={{ scaleY: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ── GSAP scroll-driven video reveal ── */}
      <VideoRevealSection isLight={isLight} />

      {/* Use Cases Slider */}
      <section
        className="use-cases-section border-y py-4 md:py-6 transition-colors duration-300 relative z-30"
        style={{
          background: primaryBg,
          borderColor: borderColor,
        }}
      >
        <style jsx>{`
          .use-cases-section {
            margin-top: 0 !important;
          }
          @media (min-width: 769px) {
            .use-cases-section {
              margin-top: -25vh !important;
            }
          }
        `}</style>
        <LogoSlider
          speed={40}
          pauseOnHover
          showBlur={false}
          className="[&_.logo-slider__item]:text-[#52525b]"
          logos={[
            <span key="doc-intel" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><DocumentTextIcon className="w-4 h-4" />Document Intelligence</span>,
            <span key="content" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><PencilSquareIcon className="w-4 h-4" />Content Creation</span>,
            <span key="data" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><CircleStackIcon className="w-4 h-4" />Data Pipelines</span>,
            <span key="report" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><DocumentChartBarIcon className="w-4 h-4" />AI Report Generation</span>,
            <span key="social" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><MegaphoneIcon className="w-4 h-4" />Social Media Automation</span>,
            <span key="email" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><EnvelopeIcon className="w-4 h-4" />Email Campaigns</span>,
            <span key="webhook" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><LinkIcon className="w-4 h-4" />Webhook Triggers</span>,
            <span key="scheduled" className="flex items-center gap-2 text-sm md:text-base font-semibold px-3 py-2 whitespace-nowrap" style={{ color: secondaryText }}><ClockIcon className="w-4 h-4" />Scheduled AI Tasks</span>,
          ]}
        />
      </section>

      {/* How it works — replaces old features grid */}
      <HowItWorksSection />

      {/* Footer CTA */}
      <section className="py-16 md:py-24 transition-colors duration-300" style={{ background: primaryBg }}>
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: primaryText }}>Ready to automate?</h2>
          <p className="text-base mb-8 md:mb-10" style={{ color: secondaryText }}>Join teams building the future of automation with AutoFlow</p>
          <button
            onClick={() => router.push("/auth/signup")}
            className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium text-white transition-colors hover:opacity-95"
            style={{ background: ctaBtnBg }}
          >
            Start Building Now
            <ArrowRightIcon className="w-5 h-5" />
          </button>
          <p className="text-sm mt-4" style={{ color: mutedText }}>No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t transition-colors duration-300" style={{ background: footerBg, borderColor: borderColor }}>
        <div className="container mx-auto px-4 md:px-8 pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center justify-center flex-wrap gap-3">
              <span className="text-sm font-medium" style={{ color: secondaryText }}>Follow us</span>
              {[
                {
                  href: "https://github.com/SHXZ7/autofloww.git", label: "GitHub",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '15px', height: '15px' }}><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0C17.3 5.3 18.3 5.6 18.3 5.6c.6 1.7.2 2.9.1 3.2.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6C20.2 21.4 23.5 17.1 23.5 12 23.5 5.7 18.3.5 12 .5z" /></svg>
                },
                {
                  href: "#", label: "LinkedIn",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '15px', height: '15px' }}><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.93v5.68H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" /></svg>
                },
                {
                  href: "#", label: "X / Twitter",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '15px', height: '15px' }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                },
              ].map(({ href, label, svg }) => (
                <a key={label} href={href} aria-label={label} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                  style={{
                    background: isLight ? "#e8e0d8" : "#0d1527",
                    color: secondaryText,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = primaryText }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = secondaryText }}
                >{svg}</a>
              ))}
            </div>

            <nav className="grid grid-cols-2 sm:flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-2 text-center md:text-left">
              {[
                { label: 'Pricing', href: '#' },
                { label: 'Help', href: '#' },
                { label: 'GitHub', href: 'https://github.com/SHXZ7/autofloww.git' },
                { label: 'Templates', href: '#' },
                { label: 'Integrations', href: '#integrations' },
              ].map(({ label, href }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="text-sm transition-colors"
                  style={{ color: secondaryText }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = primaryText }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = secondaryText }}
                >{label}</a>
              ))}
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 pb-7 pt-5 border-t" style={{ borderColor: borderColor }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ background: accentColor }} />
              <span className="text-lg font-bold tracking-tight">autoflow</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-4 gap-y-1 text-center">
              <span className="text-xs" style={{ color: mutedText }}>© 2026 AutoFlow Inc.</span>
              {['Privacy Policy', 'Terms of Service', 'Legal'].map(item => (
                <a key={item} href="#" className="text-xs transition-colors" style={{ color: mutedText }} onMouseEnter={(e) => { e.currentTarget.style.color = primaryText }} onMouseLeave={(e) => { e.currentTarget.style.color = mutedText }}>{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
