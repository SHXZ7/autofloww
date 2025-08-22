"use client"
import { useState } from "react"
import ParticleBackground from "../ParticleBackground"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

export default function AuthPage({ mode = "login" }) {
  const [currentMode, setCurrentMode] = useState(mode)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <ParticleBackground />
      
      <div className="mx-auto w-full max-w-md p-8 glass rounded-2xl shadow-xl border border-white/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-xl flex items-center justify-center mx-auto mb-4 glow">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {currentMode === "login" ? "Sign In to AutoFlow" : "Create Your Account"}
          </h1>
          <p className="mt-2 text-gray-400">
            {currentMode === "login" 
              ? "Access your workflows and automation" 
              : "Start building powerful workflows without code"}
          </p>
        </div>

        {currentMode === "login" ? (
          <LoginForm onSwitchToSignup={() => setCurrentMode("signup")} />
        ) : (
          <SignupForm onSwitchToLogin={() => setCurrentMode("login")} />
        )}
      </div>
    </div>
  )
}
