"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "../../../stores/authStore"
import SignupForm from "../../../components/auth/SignupForm"
import Link from "next/link"
import { SparklesIcon, BoltIcon, LinkIcon, ArrowRightIcon } from "@heroicons/react/24/outline"

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && isAuthenticated) router.push("/")
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect x="9" y="5" width="14" height="10" rx="2.5" fill="#241812" />
              <circle cx="13.5" cy="10" r="1.3" fill="#F6F1EA" />
              <circle cx="18.5" cy="10" r="1.3" fill="#F6F1EA" />
              <rect x="14.5" y="1.5" width="3" height="3.5" rx="1" fill="#241812" />
              <rect x="6" y="17" width="20" height="11" rx="3.5" fill="#241812" />
              <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#241812]">Loading AutoFlow...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) return null

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row bg-[#F6F1EA] text-[#241812] selection:bg-[#EB5E3D]/20 selection:text-[#241812] overflow-hidden">
      
      {/* Left Column: Visual Brand Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-[#241812] text-[#F6F1EA] p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#EB5E3D]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#319D84]/15 blur-3xl pointer-events-none" />

        {/* Top Brand Logo */}
        <div className="relative z-10">
          <Link href="/homepage" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                <rect x="9" y="5" width="14" height="10" rx="2.5" fill="#F6F1EA" />
                <circle cx="13.5" cy="10" r="1.3" fill="#241812" />
                <circle cx="18.5" cy="10" r="1.3" fill="#241812" />
                <rect x="14.5" y="1.5" width="3" height="3.5" rx="1" fill="#F6F1EA" />
                <rect x="6" y="17" width="20" height="11" rx="3.5" fill="#F6F1EA" />
                <rect x="2" y="18.5" width="3" height="7" rx="1.5" fill="#F6F1EA" />
                <rect x="27" y="18.5" width="3" height="7" rx="1.5" fill="#F6F1EA" />
                <circle cx="16" cy="22.5" r="1.5" fill="#EB5E3D" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">autoflow</span>
          </Link>
        </div>

        {/* Center Marketing & Interactive Mini Workflow Card */}
        <div className="relative z-10 my-auto py-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-[#EB5E3D] mb-4 backdrop-blur-md border border-white/10">
            <SparklesIcon className="w-3.5 h-3.5" />
            GET STARTED FOR FREE
          </div>
          
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.15] mb-4">
            Build your first AI workflow in under 2 minutes.
          </h1>
          
          <p className="text-sm text-[#D5CDC5] leading-relaxed mb-6">
            Visual node editor, pre-built integrations, natural language generation, and instant execution. No coding required.
          </p>

          {/* Mini Workflow Pipeline Mockup Card */}
          <div className="bg-[#2E2019] rounded-2xl p-4 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-2.5 text-[11px] text-[#A89C94] font-mono">
              <span>TEMPLATE: GMAIL_SUPPORT_AI</span>
              <span className="flex items-center gap-1 text-[#EB5E3D] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EB5E3D] animate-ping" />
                AUTO-REPLY
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#3A2C24] rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[9px] text-[#EB5E3D] uppercase font-bold">Trigger</p>
                <p className="text-[11px] font-bold text-white mt-0.5 truncate">Gmail Inbound</p>
              </div>
              <ArrowRightIcon className="w-3.5 h-3.5 text-[#EB5E3D] shrink-0" />
              <div className="flex-1 bg-[#3A2C24] rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[9px] text-[#2EA38D] uppercase font-bold">GPT-4o</p>
                <p className="text-[11px] font-bold text-white mt-0.5 truncate">Draft Reply</p>
              </div>
              <ArrowRightIcon className="w-3.5 h-3.5 text-[#EB5E3D] shrink-0" />
              <div className="flex-1 bg-[#3A2C24] rounded-xl p-2.5 border border-white/5 text-center">
                <p className="text-[9px] text-[#DDA449] uppercase font-bold">Sheets</p>
                <p className="text-[11px] font-bold text-white mt-0.5 truncate">Log Lead</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 flex items-center gap-5 text-[11px] text-[#A89C94] font-medium border-t border-white/10 pt-4">
          <span className="flex items-center gap-1.5">
            <BoltIcon className="w-3.5 h-3.5 text-[#EB5E3D]" />
            Instant Activation
          </span>
          <span className="flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[#EB5E3D]" />
            Unlimited Canvas
          </span>
          <span className="flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-[#EB5E3D]" />
            Zero Setup Required
          </span>
        </div>
      </div>

      {/* Right Column: Signup Form */}
      <div className="flex-1 h-full flex flex-col justify-center px-6 py-6 sm:px-10 lg:px-12 xl:px-16 bg-[#F6F1EA] overflow-y-auto lg:overflow-hidden">
        <SignupForm onSwitchToLogin={() => router.push("/auth/login")} />
      </div>
    </div>
  )
}
