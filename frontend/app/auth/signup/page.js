"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "../../../stores/authStore"
import { ArrowLeftIcon } from "@heroicons/react/24/outline"
import dynamic from "next/dynamic"
import SignupForm from "../../../components/auth/SignupForm"

// Import particle background for consistent homepage look
const ParticleBackground = dynamic(() => import("../../../components/ParticleBackground"), {
  ssr: false
})

export default function SignupPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, loading, router])

  const handleBackToHome = () => {
    router.push("/homepage")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to main app
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .auth-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
          50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.6); }
        }
        
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      {/* Background Particles */}
      <ParticleBackground />

      {/* Back to Home Button */}
      <button 
        onClick={handleBackToHome}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-200 group"
      >
        <ArrowLeftIcon className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </button>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">AF</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-400">Join AutoFlow to start building workflows</p>
          </div>

          {/* Auth Form */}
          <div className="auth-card rounded-2xl p-8 shadow-2xl">
            <SignupForm onSwitchToLogin={() => router.push("/auth/login")} />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2024 AutoFlow. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
