"use client"

import { useEffect, useState } from "react"
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"

export default function ThemeSwitch({ className = "" }) {
  const [theme, setTheme] = useState("dark")

  useEffect(() => {
    const saved = localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    setTheme(saved)
    document.documentElement.classList.toggle("light", saved === "light")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("light", newTheme === "light")
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#1e293b] transition-colors overflow-hidden ${className}`}
    >
      <SunIcon
        className={`absolute h-5 w-5 text-[#F1F5F9] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === "light"
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-50 translate-y-5 opacity-0"
        }`}
      />
      <MoonIcon
        className={`absolute h-5 w-5 text-[#F1F5F9] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === "dark"
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-50 translate-y-5 opacity-0"
        }`}
      />
    </button>
  )
}
