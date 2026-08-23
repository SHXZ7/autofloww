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
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "../../stores/authStore"
import LogoSlider from "../../components/LogoSlider"

const HowItWorksSection = dynamic(() => import("../../components/HowItWorksSection"), { ssr: false })
const InteractiveWorkflowPlayground = dynamic(() => import("../../components/InteractiveWorkflowPlayground"), { ssr: false })

export default function Homepage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showTimeout, setShowTimeout] = useState(false)
  const { isAuthenticated, loading, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [checkAuth])

  useEffect(() => {
    const fn = () => setIsScrolled(window.scrollY > 30)
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

  useEffect(() => {
    const orig = document.body.style.backgroundColor
    document.body.style.backgroundColor = "#F6F1EA"
    return () => {
      document.body.style.backgroundColor = orig
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#241812]">
              <rect x="14" y="8" width="20" height="14" rx="4" fill="#241812" />
              <circle cx="20" cy="15" r="2" fill="#F6F1EA" />
              <circle cx="28" cy="15" r="2" fill="#F6F1EA" />
              <rect x="22" y="2" width="4" height="6" rx="2" fill="#241812" />
              <rect x="10" y="24" width="28" height="16" rx="5" fill="#241812" />
              <rect x="4" y="26" width="4" height="10" rx="2" fill="#241812" />
              <rect x="40" y="26" width="4" height="10" rx="2" fill="#241812" />
              <rect x="16" y="42" width="5" height="5" rx="1.5" fill="#241812" />
              <rect x="27" y="42" width="5" height="5" rx="1.5" fill="#241812" />
            </svg>
          </div>
          <div className="text-base font-semibold text-[#241812] tracking-tight">AutoFlow</div>
          {showTimeout && (
            <p className="mt-4 text-sm text-[#736357]">
              <button onClick={() => window.location.reload()} className="text-[#EB5E3D] underline">Refresh</button>
              {" or "}
              <button onClick={() => router.push("/auth/login")} className="text-[#EB5E3D] underline">go to login</button>
            </p>
          )}
        </div>
      </div>
    )
  }

  // Warm, premium aesthetic design tokens matching reference
  const bgMain = "#F6F1EA"
  const bgPill = "#EDE6DC"
  const textDark = "#241812"
  const textMuted = "#736357"
  const coralAccent = "#EB5E3D"
  const coralHover = "#D94F2F"
  const borderLight = "#E5DCD0"

  const navLinks = [
    { label: "Home", href: "#", active: true },
    { label: "Playground", href: "#playground" },
    { label: "Workflows", href: "#workflows" },
    { label: "How It Works", href: "#features" },
  ]

  return (
    <div
      className="min-h-screen bg-[#F6F1EA] text-[#241812] font-sans selection:bg-[#EB5E3D]/20 selection:text-[#241812] overflow-x-hidden"
      style={{ backgroundColor: "#F6F1EA" }}
    >
      
      {/* ── Top Navigation Bar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-3 bg-[#F6F1EA]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(36,24,18,0.04)]"
            : "py-5 sm:py-7 bg-[#F6F1EA]"
        }`}
        style={{ backgroundColor: "#F6F1EA" }}
      >
        <div className="max-w-[1340px] mx-auto px-5 sm:px-10 flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#241812] group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                {/* Robot Head */}
                <rect x="9" y="5" width="14" height="10" rx="2.5" fill="#241812" />
                <circle cx="13.5" cy="10" r="1.3" fill="#F6F1EA" />
                <circle cx="18.5" cy="10" r="1.3" fill="#F6F1EA" />
                {/* Antenna */}
                <rect x="14.5" y="1.5" width="3" height="3.5" rx="1" fill="#241812" />
                {/* Robot Body */}
                <rect x="6" y="17" width="20" height="11" rx="3.5" fill="#241812" />
                {/* Arms */}
                <rect x="2" y="18.5" width="3" height="7" rx="1.5" fill="#241812" />
                <rect x="27" y="18.5" width="3" height="7" rx="1.5" fill="#241812" />
                {/* Chest LED Accent */}
                <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tighter text-[#241812] leading-none">
              autoflow
            </span>
          </a>

          {/* Center & Right Navigation Container */}
          <div className="hidden md:flex items-center gap-3">
            {/* Pill Navigation Links */}
            <nav
              className="flex items-center bg-[#EDE6DC] rounded-full px-7 py-2.5 gap-7 shadow-[0_1px_3px_rgba(36,24,18,0.03)] border border-[#E5DCD0]/60"
              style={{ backgroundColor: "#EDE6DC" }}
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-[15px] font-medium tracking-tight transition-colors ${
                    link.active
                      ? "text-[#EB5E3D] font-semibold"
                      : "text-[#241812] hover:text-[#EB5E3D]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Request / Start CTA Button */}
            <button
              onClick={() => router.push("/auth/signup")}
              className="bg-[#EB5E3D] hover:bg-[#D94F2F] text-white text-[15px] font-medium px-6 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger & Quick CTA */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => router.push("/auth/signup")}
              className="bg-[#EB5E3D] hover:bg-[#D94F2F] text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-all"
            >
              Get Started
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-[#EDE6DC] text-[#241812] border border-[#E5DCD0]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mx-4 mt-3 p-4 bg-[#EDE6DC] rounded-2xl border border-[#E5DCD0] shadow-lg flex flex-col gap-3"
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium py-1.5 px-3 rounded-lg transition-colors ${
                    link.active ? "text-[#EB5E3D] bg-white/50" : "text-[#241812] hover:text-[#EB5E3D]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-[#E5DCD0] flex gap-2">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="flex-1 py-2.5 text-sm font-medium text-[#241812] bg-white/70 rounded-xl"
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-[#EB5E3D] rounded-xl"
                >
                  Sign Up
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Hero Section ── */}
      <section
        className="pt-28 sm:pt-36 md:pt-40 pb-16 sm:pb-24 px-4 sm:px-8 bg-[#F6F1EA]"
        style={{ backgroundColor: "#F6F1EA" }}
      >
        <div className="max-w-[1300px] mx-auto text-center">
          
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-[2.6rem] sm:text-6xl md:text-7xl lg:text-[5.25rem] font-extrabold tracking-[-0.035em] text-[#241812] leading-[1.06]">
              Visual, smart, fast. <br className="hidden sm:inline" />
              Workflows for everyone.
            </h1>
          </motion.div>

          {/* Subtext and Quick Access */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-xl mx-auto text-base sm:text-lg text-[#736357] font-normal mb-8 sm:mb-12 leading-relaxed"
          >
            Visual, intelligent automation that connects AI, APIs, and workflows in real time. Build and run powerful automations without code.
          </motion.p>

          {/* Hero Media Video Showcase with Huge Rounded Top Curves */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative w-full rounded-[24px] sm:rounded-[36px] md:rounded-[48px] overflow-hidden bg-[#241812] shadow-[0_25px_60px_-15px_rgba(36,24,18,0.18)] border border-[#E5DCD0]/80"
          >
            <div className="aspect-[16/9] sm:aspect-[16/9] md:aspect-[21/10] w-full relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover object-center"
              >
                <source src="/videos/Product_demo_workflow_animation_1080p_202608231731.mp4" type="video/mp4" />
              </video>

              {/* Subtle overlay gradient for depth */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Use Cases / Integration Capabilities Ticker ── */}
      <section id="use-cases" className="py-10 sm:py-14 bg-[#F6F1EA]" style={{ backgroundColor: "#F6F1EA" }}>
        <div className="max-w-[1300px] mx-auto px-4">
          {/* Small Heading like 'Trusted by' */}
          <div className="text-center mb-7 sm:mb-9">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#8A7C72]">
              Things we can do
            </p>
          </div>

          <LogoSlider
            speed={35}
            pauseOnHover
            showBlur={false}
            className="[&_.logo-slider__item]:w-[290px] [&_.logo-slider__item]:h-[76px]"
            logos={[
              <div key="doc-intel" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <DocumentTextIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Document Intelligence</span>
              </div>,
              <div key="content" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <PencilSquareIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Content Creation</span>
              </div>,
              <div key="data" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <CircleStackIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Data Pipelines</span>
              </div>,
              <div key="report" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <DocumentChartBarIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">AI Report Generation</span>
              </div>,
              <div key="social" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <MegaphoneIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Social Media Automation</span>
              </div>,
              <div key="email" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <EnvelopeIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Email Campaigns</span>
              </div>,
              <div key="webhook" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <LinkIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Webhook Triggers</span>
              </div>,
              <div key="scheduled" className="flex items-center gap-3 bg-[#EDE6DC] rounded-[22px] px-6 py-3.5 border border-[#E5DCD0]/80 shadow-[0_2px_10px_rgba(36,24,18,0.03)] hover:border-[#EB5E3D]/40 transition-colors">
                <ClockIcon className="w-5 h-5 text-[#EB5E3D] shrink-0" />
                <span className="text-sm sm:text-[15px] font-semibold text-[#241812] whitespace-nowrap">Scheduled AI Tasks</span>
              </div>,
            ]}
          />
        </div>
      </section>

      {/* ── Make your custom workflows (Bento Section) ── */}
      <section id="workflows" className="py-16 sm:py-28 bg-[#F6F1EA]" style={{ backgroundColor: "#F6F1EA" }}>
        <div className="max-w-[1560px] mx-auto px-4 sm:px-8 md:px-12">
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-[3.75rem] font-bold text-[#241812] tracking-tight leading-[1.06]">
              Make your custom workflows
            </h2>
          </div>

          {/* 3-Column Bento Grid with Asymmetric Heights matching Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 sm:gap-8 items-stretch">
            
            {/* ── COLUMN 1 (460px + 310px) ── */}
            <div className="flex flex-col gap-7 sm:gap-8">
              {/* Card 1A: AI / LLM node integration */}
              <div className="bg-[#EDE6DC] rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 border border-[#E5DCD0]/70 shadow-[0_2px_12px_rgba(36,24,18,0.02)] min-h-[440px] lg:h-[460px] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgba(36,24,18,0.05)]">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-t-full border-[3.5px] border-b-0 border-[#241812] mb-3" />
                  <h3 className="text-xl sm:text-2xl font-bold text-[#241812] tracking-tight">
                    AI / LLM node integration
                  </h3>
                </div>

                {/* AI / LLM Node Interactive Canvas Graphic */}
                <div className="w-full my-3 flex flex-col gap-3">
                  
                  {/* Model Selector Pills */}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["GPT-4o", "Claude 3.5", "Gemini Pro", "Llama 3"].map((model, idx) => (
                      <span
                        key={model}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                          idx === 0
                            ? "bg-[#241812] text-white border-[#241812] shadow-xs"
                            : "bg-[#F6F1EA] text-[#736357] border-[#E5DCD0] hover:border-[#241812]"
                        }`}
                      >
                        {model}
                      </span>
                    ))}
                  </div>

                  {/* Connected Nodes Diagram */}
                  <div className="relative bg-[#F6F1EA] rounded-2xl p-4 border border-[#E5DCD0] shadow-xs">
                    
                    {/* Node 1: Input Trigger */}
                    <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2 border border-[#E5DCD0] shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2EA38D]" />
                        <span className="text-xs sm:text-sm font-semibold text-[#241812]">Input Prompt</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#8A7C72] bg-[#EDE6DC] px-2 py-0.5 rounded">text</span>
                    </div>

                    {/* Connecting Flow Line */}
                    <div className="flex justify-center my-1.5">
                      <div className="w-0.5 h-4 bg-[#EB5E3D] relative">
                        <div className="w-2 h-2 bg-[#EB5E3D] rounded-full absolute -top-0.5 -left-[3px] animate-pulse" />
                      </div>
                    </div>

                    {/* Node 2: Active LLM Engine */}
                    <div className="flex items-center justify-between bg-[#241812] text-white rounded-xl px-4 py-2.5 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-[#EB5E3D]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
                        </svg>
                        <div className="text-left">
                          <div className="text-xs sm:text-sm font-bold leading-none">LLM Inference Node</div>
                          <div className="text-[11px] text-[#A89F97] mt-1">GPT-4o · temp: 0.7</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#2EA38D] bg-white/10 px-2.5 py-0.5 rounded-full">Active</span>
                    </div>

                    {/* Connecting Flow Line */}
                    <div className="flex justify-center my-1.5">
                      <div className="w-0.5 h-4 bg-[#2EA38D]" />
                    </div>

                    {/* Node 3: Output Result */}
                    <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2 border border-[#E5DCD0] shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#EB5E3D]" />
                        <span className="text-xs sm:text-sm font-semibold text-[#241812]">Structured Response</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#8A7C72] bg-[#EDE6DC] px-2 py-0.5 rounded">json</span>
                    </div>

                  </div>
                </div>

                {/* Bottom caption */}
                <p className="text-xs sm:text-[13px] text-[#736357] text-center">
                  Drag, drop, and chain state-of-the-art AI models with custom parameters.
                </p>
              </div>

              {/* Card 1B: Multi-app connections (Compact Landscape) */}
              <div className="bg-[#EDE6DC] rounded-[32px] sm:rounded-[40px] p-7 sm:p-9 border border-[#E5DCD0]/70 shadow-[0_2px_12px_rgba(36,24,18,0.02)] min-h-[290px] lg:h-[310px] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgba(36,24,18,0.05)]">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-t-full border-[3.5px] border-b-0 border-[#241812] mb-2" />
                  <h3 className="text-lg sm:text-xl font-bold text-[#241812] tracking-tight">
                    Multi-app connections
                  </h3>
                </div>

                {/* App Integrations Grid Hub */}
                <div className="w-full my-2 bg-[#F6F1EA] rounded-2xl p-3.5 border border-[#E5DCD0] shadow-xs">
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* Gmail */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-[#E5DCD0] shadow-2xs hover:scale-105 transition-transform">
                      <EnvelopeIcon className="w-5 h-5 text-[#EB5E3D] mb-1" />
                      <span className="text-xs font-bold text-[#241812]">Gmail</span>
                    </div>

                    {/* Google Sheets */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-[#E5DCD0] shadow-2xs hover:scale-105 transition-transform">
                      <DocumentChartBarIcon className="w-5 h-5 text-[#2EA38D] mb-1" />
                      <span className="text-xs font-bold text-[#241812]">Sheets</span>
                    </div>

                    {/* Discord */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-[#E5DCD0] shadow-2xs hover:scale-105 transition-transform">
                      <MegaphoneIcon className="w-5 h-5 text-[#5865F2] mb-1" />
                      <span className="text-xs font-bold text-[#241812]">Discord</span>
                    </div>

                    {/* Webhooks */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-[#E5DCD0] shadow-2xs hover:scale-105 transition-transform">
                      <LinkIcon className="w-5 h-5 text-[#D97706] mb-1" />
                      <span className="text-xs font-bold text-[#241812]">Webhooks</span>
                    </div>

                    {/* Database */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-[#E5DCD0] shadow-2xs hover:scale-105 transition-transform">
                      <CircleStackIcon className="w-5 h-5 text-[#736357] mb-1" />
                      <span className="text-xs font-bold text-[#241812]">Database</span>
                    </div>

                    {/* More Apps */}
                    <div className="flex flex-col items-center justify-center p-2.5 bg-[#241812] text-white rounded-xl shadow-xs hover:scale-105 transition-transform">
                      <span className="text-sm font-extrabold text-[#EB5E3D] mb-0.5">+20</span>
                      <span className="text-[10px] font-semibold text-white/80">Services</span>
                    </div>

                  </div>
                </div>

                {/* Bottom caption */}
                <p className="text-xs text-[#736357] text-center">
                  Connect Gmail, Sheets, Discord, Webhooks, and custom APIs seamlessly.
                </p>
              </div>
            </div>

            {/* ── COLUMN 2 (Extra-tall 610px + Compact 160px) ── */}
            <div className="flex flex-col gap-7 sm:gap-8">
              {/* Card 2A: Real-time workflow monitoring (EXTRA TALL) */}
              <div className="bg-[#EDE6DC] rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 border border-[#E5DCD0]/70 shadow-[0_2px_12px_rgba(36,24,18,0.02)] min-h-[580px] lg:h-[610px] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgba(36,24,18,0.05)]">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-t-full border-[3.5px] border-b-0 border-[#241812] mb-3" />
                  <h3 className="text-xl sm:text-2xl font-bold text-[#241812] tracking-tight">
                    Real-time workflow monitoring
                  </h3>
                </div>

                {/* Real-time Monitoring Live Trace Dashboard */}
                <div className="w-full my-4 bg-[#F6F1EA] rounded-2xl p-4 sm:p-5 border border-[#E5DCD0] shadow-xs flex flex-col gap-3">
                  
                  {/* Live Status Bar */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DCD0]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2EA38D] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2EA38D]" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#241812]">Execution Stream</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[#2EA38D] bg-[#2EA38D]/10 px-2.5 py-0.5 rounded-full">LIVE</span>
                  </div>

                  {/* Step 1: Trigger */}
                  <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-[#E5DCD0] text-left shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#2EA38D]/15 text-[#2EA38D] text-[10px] font-bold flex items-center justify-center">✓</span>
                      <span className="text-xs sm:text-sm font-semibold text-[#241812]">Inbound Webhook</span>
                    </div>
                    <span className="text-xs font-mono text-[#736357]">14ms</span>
                  </div>

                  {/* Step 2: AI Inference */}
                  <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-[#E5DCD0] text-left shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#2EA38D]/15 text-[#2EA38D] text-[10px] font-bold flex items-center justify-center">✓</span>
                      <span className="text-xs sm:text-sm font-semibold text-[#241812]">Claude 3.5 Analysis</span>
                    </div>
                    <span className="text-xs font-mono text-[#736357]">320ms</span>
                  </div>

                  {/* Step 3: Database Sync (Active Step) */}
                  <div className="bg-[#241812] text-white rounded-xl px-4 py-3 shadow-sm text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#EB5E3D] animate-ping" />
                        <span className="text-xs sm:text-sm font-bold">Google Sheets Sync</span>
                      </div>
                      <span className="text-[11px] text-[#EB5E3D] font-mono font-bold">Running</span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#EB5E3D] h-full rounded-full w-2/3 animate-pulse" />
                    </div>
                  </div>

                  {/* Step 4: Discord Notification */}
                  <div className="flex items-center justify-between bg-white/60 rounded-xl px-3.5 py-2 border border-[#E5DCD0]/70 text-left opacity-60">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#EDE6DC] text-[#736357] text-[10px] font-bold flex items-center justify-center">⋯</span>
                      <span className="text-xs sm:text-sm font-medium text-[#241812]">Discord Notification</span>
                    </div>
                    <span className="text-xs font-mono text-[#736357]">Queued</span>
                  </div>

                </div>

                {/* Bottom Metric Badges */}
                <div className="flex items-center justify-between pt-1 text-xs font-medium text-[#736357] px-1">
                  <span>Latency: <strong className="text-[#241812]">142ms avg</strong></span>
                  <span>Uptime: <strong className="text-[#2EA38D]">99.99%</strong></span>
                  <span>Logs: <strong className="text-[#241812]">Instant</strong></span>
                </div>
              </div>

              {/* Card 2B: Scheduling & triggers (COMPACT SHORT CARD) */}
              <div className="bg-[#EDE6DC] rounded-[32px] sm:rounded-[40px] px-7 py-6 border border-[#E5DCD0]/70 shadow-[0_2px_12px_rgba(36,24,18,0.02)] min-h-[150px] lg:h-[160px] flex flex-col justify-center text-center transition-all hover:shadow-[0_8px_30px_rgba(36,24,18,0.05)]">
                <div className="w-4 h-4 rounded-t-full border-[3px] border-b-0 border-[#241812] mx-auto mb-2" />
                <h3 className="text-base sm:text-lg font-bold text-[#241812] tracking-tight mb-1">
                  Scheduling & triggers
                </h3>
                <p className="text-xs sm:text-[13px] text-[#736357] leading-relaxed max-w-sm mx-auto">
                  Run workflows on custom cron intervals, delays, or instant webhook payloads.
                </p>
              </div>
            </div>

            {/* ── COLUMN 3 (460px + 310px) ── */}
            <div className="flex flex-col gap-7 sm:gap-8">
              {/* Card 3A: Natural language → workflow generation */}
              <div className="bg-[#EDE6DC] rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 border border-[#E5DCD0]/70 shadow-[0_2px_12px_rgba(36,24,18,0.02)] min-h-[440px] lg:h-[460px] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgba(36,24,18,0.05)]">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-t-full border-[3.5px] border-b-0 border-[#241812] mb-3" />
                  <h3 className="text-xl sm:text-2xl font-bold text-[#241812] tracking-tight">
                    Natural language → workflow generation
                  </h3>
                </div>

                {/* Text-to-Workflow Generator Interface Graphic */}
                <div className="w-full my-3 bg-[#F6F1EA] rounded-2xl p-4 border border-[#E5DCD0] shadow-xs flex flex-col gap-3">
                  
                  {/* Prompt Input Box */}
                  <div className="bg-white rounded-xl p-3 border border-[#E5DCD0] shadow-2xs text-left">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#EB5E3D] mb-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
                      </svg>
                      <span>Natural Language Prompt</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#241812] font-medium leading-relaxed">
                      "Parse inbound emails, extract receipt data with Gemini, and log to Google Sheets."
                    </p>
                  </div>

                  {/* Generation Synthesis Flow Line */}
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#EB5E3D]">
                    <span className="w-2 h-2 rounded-full bg-[#EB5E3D] animate-ping" />
                    <span>Auto-generating workflow nodes</span>
                    <span className="text-sm">↓</span>
                  </div>

                  {/* Generated Node Sequence */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    
                    {/* Node 1 */}
                    <div className="bg-white rounded-xl p-2.5 border border-[#E5DCD0] text-center shadow-2xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2EA38D] mx-auto mb-1" />
                      <div className="text-xs font-bold text-[#241812] truncate">Email Trigger</div>
                    </div>

                    {/* Node 2 */}
                    <div className="bg-[#241812] text-white rounded-xl p-2.5 text-center shadow-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#EB5E3D] mx-auto mb-1 animate-pulse" />
                      <div className="text-xs font-bold truncate">Gemini Node</div>
                    </div>

                    {/* Node 3 */}
                    <div className="bg-white rounded-xl p-2.5 border border-[#E5DCD0] text-center shadow-2xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2EA38D] mx-auto mb-1" />
                      <div className="text-xs font-bold text-[#241812] truncate">Sheets Sync</div>
                    </div>

                  </div>

                </div>

                {/* Bottom caption */}
                <p className="text-xs sm:text-[13px] text-[#736357] text-center">
                  Type plain text to instantly synthesize fully editable canvas nodes and connections.
                </p>
              </div>

              {/* Card 3B: Smart node ordering / auto dependency resolution */}
              <div className="bg-[#EDE6DC] rounded-[32px] sm:rounded-[40px] p-7 sm:p-9 border border-[#E5DCD0]/70 shadow-[0_2px_12px_rgba(36,24,18,0.02)] min-h-[290px] lg:h-[310px] flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgba(36,24,18,0.05)]">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded-t-full border-[3.5px] border-b-0 border-[#241812] mb-2" />
                  <h3 className="text-lg sm:text-xl font-bold text-[#241812] tracking-tight">
                    Smart node ordering & resolution
                  </h3>
                </div>

                {/* DAG / Auto-ordering Branching Diagram */}
                <div className="w-full my-2 bg-[#F6F1EA] rounded-2xl p-3.5 border border-[#E5DCD0] shadow-xs">
                  
                  {/* Root Node */}
                  <div className="flex items-center justify-center mb-2">
                    <div className="bg-white rounded-lg px-3 py-1 border border-[#E5DCD0] text-xs font-bold text-[#241812] shadow-2xs">
                      1. Trigger Received
                    </div>
                  </div>

                  {/* Branching Forks */}
                  <div className="grid grid-cols-2 gap-2.5 my-2 relative">
                    <div className="bg-white rounded-xl p-2 border border-[#E5DCD0] text-center shadow-2xs">
                      <span className="text-[10px] font-mono text-[#EB5E3D] font-bold block">Branch A</span>
                      <span className="text-xs font-semibold text-[#241812]">AI Summary</span>
                    </div>
                    <div className="bg-white rounded-xl p-2 border border-[#E5DCD0] text-center shadow-2xs">
                      <span className="text-[10px] font-mono text-[#2EA38D] font-bold block">Branch B</span>
                      <span className="text-xs font-semibold text-[#241812]">Extract Data</span>
                    </div>
                  </div>

                  {/* Merge Resolution Node */}
                  <div className="flex items-center justify-center mt-2">
                    <div className="bg-[#241812] text-white rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EB5E3D]" />
                      Auto-Resolved Merge
                    </div>
                  </div>

                </div>

                {/* Bottom caption */}
                <p className="text-xs text-[#736357] text-center">
                  Auto-detects data dependencies to execute tasks in the exact optimal sequence.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Interactive Live Workflow Playground ── */}
      <div id="playground">
        <InteractiveWorkflowPlayground />
      </div>

      {/* ── How It Works Section ── */}
      <HowItWorksSection />

      {/* ── Call To Action Section ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-8 bg-[#F6F1EA]">
        <div className="max-w-4xl mx-auto text-center bg-[#EDE6DC] rounded-[32px] sm:rounded-[44px] p-8 sm:p-16 border border-[#E5DCD0] shadow-[0_12px_40px_rgba(36,24,18,0.04)]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 text-xs font-semibold text-[#EB5E3D] tracking-wide mb-6">
            <StarIcon className="w-3.5 h-3.5 fill-[#EB5E3D]" />
            NEXT-GEN AUTOMATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#241812] tracking-tight mb-5">
            Ready to build your first workflow?
          </h2>
          <p className="text-base sm:text-lg text-[#736357] max-w-xl mx-auto mb-9 leading-relaxed">
            Join developers, creators, and teams automating their systems with modern AI nodes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push("/auth/signup")}
              className="bg-[#EB5E3D] hover:bg-[#D94F2F] text-white text-base font-medium px-8 py-4 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
            >
              Start Building Now
              <ArrowRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/auth/login")}
              className="bg-white/80 hover:bg-white text-[#241812] text-base font-medium px-7 py-4 rounded-full transition-all border border-[#E5DCD0]"
            >
              Log In to Workspace
            </button>
          </div>
          <p className="text-xs text-[#8F8177] mt-5">No credit card required · Free setup in 2 minutes</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#EFE8DF] border-t border-[#E5DCD0]">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-10 pt-12 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            
            {/* Logo & Follow */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <a href="#" className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-[#241812]">
                  <rect x="9" y="5" width="14" height="10" rx="2.5" fill="#241812" />
                  <circle cx="13.5" cy="10" r="1.3" fill="#EFE8DF" />
                  <circle cx="18.5" cy="10" r="1.3" fill="#EFE8DF" />
                  <rect x="14.5" y="1.5" width="3" height="3.5" rx="1" fill="#241812" />
                  <rect x="6" y="17" width="20" height="11" rx="3.5" fill="#241812" />
                  <rect x="2" y="18.5" width="3" height="7" rx="1.5" fill="#241812" />
                  <rect x="27" y="18.5" width="3" height="7" rx="1.5" fill="#241812" />
                  <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
                </svg>
                <span className="text-lg font-bold text-[#241812] tracking-tighter">autoflow</span>
              </a>
              <span className="hidden sm:inline text-[#C8BCB0]">|</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#736357]">Follow</span>
                {[
                  {
                    href: "https://github.com/SHXZ7/autofloww.git", label: "GitHub",
                    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0C17.3 5.3 18.3 5.6 18.3 5.6c.6 1.7.2 2.9.1 3.2.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6C20.2 21.4 23.5 17.1 23.5 12 23.5 5.7 18.3.5 12 .5z" /></svg>
                  },
                  {
                    href: "#", label: "LinkedIn",
                    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.93v5.68H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z" /></svg>
                  },
                  {
                    href: "#", label: "X / Twitter",
                    svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" /></svg>
                  },
                ].map(({ href, label, svg }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EDE6DC] text-[#241812] hover:bg-[#EB5E3D] hover:text-white transition-colors border border-[#E5DCD0]"
                  >
                    {svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <nav className="flex flex-wrap justify-center items-center gap-6 text-sm text-[#736357]">
              {["Product", "Workflows", "Templates", "Pricing", "GitHub"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="hover:text-[#EB5E3D] transition-colors font-medium"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E5DCD0] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8F8177]">
            <p>© {new Date().getFullYear()} AutoFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#241812] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#241812] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#241812] transition-colors">Security</a>
              </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
