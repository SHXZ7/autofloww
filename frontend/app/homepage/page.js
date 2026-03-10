"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { StarIcon, BoltIcon, PuzzlePieceIcon, ChartBarIcon, CpuChipIcon, ShieldCheckIcon, ArrowRightIcon, DocumentTextIcon, PencilSquareIcon, CircleStackIcon, DocumentChartBarIcon, MegaphoneIcon, EnvelopeIcon, LinkIcon, ClockIcon } from "@heroicons/react/24/outline"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useAuthStore } from "../../stores/authStore"
import ThemeSwitch from "../../components/ThemeSwitch"

const ParticleBackground = dynamic(() => import("../../components/ParticleBackground"), { ssr: false })
import LogoSlider from "../../components/LogoSlider"

const Cover = dynamic(
  () => import("../../components/ui/Cover").then(m => ({ default: m.Cover })),
  { ssr: false, loading: () => <span>WORKFLOWS</span> }
)

const NAV_ITEMS = [
  { title: "FEATURES", href: "#features" },
  { title: "USE CASES", href: "#usecases" },
  { title: "GITHUB", href: "https://github.com/SHXZ7/autofloww.git" },
]

const LABELS = [
  { icon: CpuChipIcon, label: "AI-Powered Processing" },
  { icon: PuzzlePieceIcon, label: "No-Code Builder" },
  { icon: BoltIcon, label: "Real-time Execution" },
]

const FEATURES = [
  { icon: CpuChipIcon, label: "AI-Powered Processing", description: "Connect GPT-4, Claude, Gemini, and 10+ models. Smart automation that understands context and extracts meaningful insights." },
  { icon: BoltIcon, label: "Intelligent Automation", description: "Streamline complex pipelines with drag-and-drop simplicity. From trigger to result in seconds, not hours." },
  { icon: ChartBarIcon, label: "Real-time Analytics", description: "Monitor executions live with visual feedback, performance metrics, and full execution history." },
  { icon: PuzzlePieceIcon, label: "Seamless Integrations", description: "Google Sheets, Discord, Email, Webhooks — connect your entire tech stack effortlessly." },
  { icon: ShieldCheckIcon, label: "Enterprise Security", description: "JWT authentication, encrypted credentials and role-based access. Your data stays protected." },
  { icon: StarIcon, label: "Visual Flow Builder", description: "Design workflows visually with our node-based canvas. No code required, endless possibilities." },
]

export default function Homepage() {
  const router = useRouter()
  const featuresRef = useRef(null)
  const [featuresOrder, setFeaturesOrder] = useState(FEATURES)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showTimeout, setShowTimeout] = useState(false)
  const { isAuthenticated, loading, checkAuth } = useAuthStore()

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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
          <div className="text-[#F1F5F9] font-mono text-lg">Loading...</div>
          {showTimeout && (
            <p className="mt-4 font-mono text-sm text-[#64748b]">
              <button onClick={() => window.location.reload()} className="text-[#3B82F6] underline">Refresh</button>
              {" or "}
              <button onClick={() => router.push("/auth/login")} className="text-[#3B82F6] underline">go to login</button>
            </p>
          )}
        </div>
      </div>
    )
  }

  const titleWords = ["THE", "AI", "PLATFORM", "FOR", "WORKFLOW", "AUTOMATION"]

  return (
    <div className="min-h-screen bg-[#020617] text-[#F1F5F9] overflow-x-hidden">
      <ParticleBackground />

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-[#020617]/80 backdrop-blur-md border-b border-[#1e293b]" : "bg-transparent"}`}>
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AF</span>
              </div>
              <span className="font-mono text-xl font-bold">AutoFlow</span>
            </a>

            <nav className="hidden md:flex items-center space-x-8">
              {NAV_ITEMS.map(item => (
                <a key={item.title} href={item.href} className="text-sm font-mono text-[#64748b] hover:text-[#F1F5F9] transition-colors">
                  {item.title}
                </a>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <ThemeSwitch />
              <button onClick={() => router.push("/auth/login")} className="px-4 py-2 text-sm font-mono text-[#94a3b8] hover:text-[#F1F5F9] transition-colors">
                LOGIN
              </button>
              <button onClick={() => router.push("/auth/signup")} className="flex items-center gap-1.5 px-5 py-2 bg-[#3B82F6] hover:bg-[#2563eb] font-mono text-sm font-bold transition-colors">
                GET STARTED <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-36 pb-20">
        <div className="flex flex-col items-center text-center">
          <motion.h1
            initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative font-mono text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl mx-auto leading-tight"
          >
            {titleWords.map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                className="inline-block mx-2 md:mx-4"
              >
                {word === "AUTOMATION" ? (
                  <Cover className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
                    {word}
                  </Cover>
                ) : word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mx-auto mt-8 max-w-2xl text-lg font-mono text-[#94a3b8] leading-relaxed"
          >
            We empower teams with cutting-edge visual automation — connect AI, APIs, and services to build powerful workflows without code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mt-10 flex flex-wrap justify-center gap-8"
          >
            {LABELS.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.12, duration: 0.5, type: "spring", stiffness: 100, damping: 10 }}
                className="flex items-center gap-2"
              >
                <item.icon className="h-5 w-5 text-[#3B82F6]" />
                <span className="text-sm font-mono text-[#94a3b8]">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.6, type: "spring", stiffness: 100, damping: 10 }}
          >
            <button
              onClick={() => router.push("/auth/signup")}
              className="mt-12 flex items-center gap-2 px-8 py-4 bg-[#3B82F6] hover:bg-[#2563eb] font-mono font-bold text-lg transition-colors"
            >
              GET STARTED <ArrowRightIcon className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>



      {/* Use Cases Slider */}
      <section id="usecases" className="py-5"> 
        <LogoSlider
          speed={40}
          pauseOnHover
          showBlur={false}
          logos={[
            <span key="doc-intel" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><DocumentTextIcon className="w-4 h-4" />Document Intelligence</span>,
            <span key="content" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><PencilSquareIcon className="w-4 h-4" />Content Creation</span>,
            <span key="data" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><CircleStackIcon className="w-4 h-4" />Data Pipelines</span>,
            <span key="report" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><DocumentChartBarIcon className="w-4 h-4" />AI Report Generation</span>,
            <span key="social" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><MegaphoneIcon className="w-4 h-4" />Social Media Automation</span>,
            <span key="email" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><EnvelopeIcon className="w-4 h-4" />Email Campaigns</span>,
            <span key="webhook" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><LinkIcon className="w-4 h-4" />Webhook Triggers</span>,
            <span key="scheduled" className="flex items-center gap-2 font-mono text-lg font-bold  px-2 py-2 whitespace-nowrap"><ClockIcon className="w-4 h-4" />Scheduled AI Tasks</span>,
          ]}
        />
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24" ref={featuresRef}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center font-mono text-4xl font-bold mb-4"
        >
          Unlock the Power of AI
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center font-mono text-[#94a3b8] mb-16"
        >
          Everything you need to automate your workflows without writing code
        </motion.p>
        <div
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          onMouseEnter={() => setFeaturesOrder(prev => [...prev].sort(() => Math.random() - 0.5))}
          onTouchStart={() => setFeaturesOrder(prev => [...prev].sort(() => Math.random() - 0.5))}
        >
          {featuresOrder.map((feature) => (
            <motion.div
              key={feature.label}
              layout
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 120, mass: 1.2 }}
              className="flex flex-col items-center text-center p-8 border border-[#1e293b] hover:border-[#3B82F6] transition-colors duration-300 group"
            >
              <div className="mb-6 rounded-full bg-[#3B82F6]/10 p-4 group-hover:bg-[#3B82F6]/20 transition-colors">
                <feature.icon className="h-8 w-8 text-[#3B82F6]" />
              </div>
              <h3 className="mb-4 font-mono text-lg font-bold text-[#F1F5F9]">{feature.label}</h3>
              <p className="font-mono text-sm text-[#64748b] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>



      {/* Footer CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-mono text-4xl font-bold mb-4">Ready to Automate?</h2>
          <p className="font-mono text-[#94a3b8] mb-10">Join teams building the future of automation with AutoFlow</p>
          <button
            onClick={() => router.push("/auth/signup")}
            className="px-10 py-4 bg-[#3B82F6] hover:bg-[#2563eb] font-mono font-bold text-lg transition-colors"
          >
            START BUILDING NOW
          </button>
          <p className="font-mono text-xs text-[#475569] mt-4">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* Footer */}
      <footer className=" html-light-footer">
        <style jsx>{`
          html.light .html-light-footer { border-top-color: #e2e8f0; background: #f5f0eb; }
          html.light .footer-social-icon { background: #e8e0d8 !important; color: #52525b !important; }
          html.light .footer-social-icon:hover { background: #d4cdc4 !important; color: #1e293b !important; }
          html.light .footer-nav-link { color: #52525b !important; }
          html.light .footer-nav-link:hover { color: #1e293b !important; }
          html.light .footer-divider { border-top-color: #e2e8f0 !important; }
          html.light .footer-logo-text { color: #1e293b !important; }
          html.light .footer-logo-bar { background: #e35b1a !important; }
          html.light .footer-copy { color: #71717a !important; }
          html.light .footer-legal-link { color: #71717a !important; }
          html.light .footer-legal-link:hover { color: #1e293b !important; }
          html.light .footer-follow { color: #52525b !important; }
        `}</style>

        {/* Top row: Follow us + nav links */}
        <div className="container mx-auto px-8 pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">

            {/* Follow us + social icons */}
            <div className="flex items-center gap-3">
              <span className="footer-follow text-sm text-[#64748b] font-medium">Follow us</span>
              {[
                { href: "https://github.com/SHXZ7/autofloww.git", label: "GitHub",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:'15px',height:'15px'}}><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.2-1.3-5.2-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0C17.3 5.3 18.3 5.6 18.3 5.6c.6 1.7.2 2.9.1 3.2.8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6C20.2 21.4 23.5 17.1 23.5 12 23.5 5.7 18.3.5 12 .5z"/></svg> },
                { href: "#", label: "LinkedIn",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:'15px',height:'15px'}}><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.93v5.68H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.22 0z"/></svg> },
                { href: "#", label: "X / Twitter",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:'15px',height:'15px'}}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> },
                { href: "#", label: "YouTube",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:'15px',height:'15px'}}><path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.2 2.7 12 2.7 12 2.7s-5.2 0-8.3.2c-.4.1-1.4.1-2.3 1-.7.7-.9 2.3-.9 2.3S.2 8 .2 9.8v1.7c0 1.8.3 3.6.3 3.6s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.8.2 7.6.2 7.6.2s5.2 0 8.3-.2c.4-.1 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.8.3-3.6V9.8c0-1.8-.3-3.6-.3-3.6zM9.7 14.8V8.7l6.2 3.1-6.2 3z"/></svg> },
                { href: "#", label: "RSS",
                  svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:'15px',height:'15px'}}><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/></svg> },
              ].map(({ href, label, svg }) => (
                <a key={label} href={href} aria-label={label} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="footer-social-icon"
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center',
                    width:'32px', height:'32px', borderRadius:'50%',
                    background:'rgba(30,41,59,0.6)', color:'#94a3b8',
                    transition:'background 0.15s, color 0.15s', flexShrink:0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.15)'; e.currentTarget.style.color='#F1F5F9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(30,41,59,0.6)'; e.currentTarget.style.color='#94a3b8'; }}
                >{svg}</a>
              ))}
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-2">
              {[
                { label: 'Pricing', href: '#' },
                { label: 'Help', href: '#' },
                { label: 'Developer Platform', href: '#' },
                { label: 'GitHub', href: 'https://github.com/SHXZ7/autofloww.git' },
                { label: 'Enterprise', href: '#' },
                { label: 'Templates', href: '#' },
                { label: 'Integrations', href: '#integrations' },
                { label: 'Partners Program', href: '#' },
              ].map(({ label, href }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  className="footer-nav-link font-mono text-sm text-[#64748b] hover:text-[#F1F5F9] transition-colors"
                >{label}</a>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom row: logo + copyright */}
        <div className="footer-divider container mx-auto px-8 pb-7 pt-5 border-t border-[#1e293b]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">

            {/* Logo */}
            <div className="flex items-center gap-1">
              <span className="footer-logo-bar" style={{display:'inline-block', width:'14px', height:'3px', borderRadius:'2px', background:'#3B82F6', marginRight:'2px'}} />
              <span className="footer-logo-text font-mono text-lg font-bold text-[#F1F5F9]" style={{letterSpacing:'-0.02em'}}>autoflow</span>
            </div>

            {/* Copyright + legal */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-4 gap-y-1">
              <span className="footer-copy font-mono text-xs text-[#475569]">© 2026 AutoFlow Inc.</span>
              {['Privacy Policy', 'Terms of Service', 'Legal'].map(item => (
                <a key={item} href="#"
                  className="footer-legal-link font-mono text-xs text-[#475569] hover:text-[#F1F5F9] transition-colors"
                >{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

