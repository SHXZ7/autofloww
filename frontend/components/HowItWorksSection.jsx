"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const USE_CASES = [
  {
    id: "data_integrations",
    title: "Data & integrations",
    subtitle: "Webhooks, Sheets & Drive sync",
    description:
      "Capture inbound webhooks, ingest files from Google Drive, and append structured data rows directly into Google Sheets in real time.",
    bgColor: "#5B9EB5", // Cerulean Blue
    textColor: "#FFFFFF",
    shapeType: "rect", // Square / Rectangle
    accentTop: null,
    accentBottom: {
      type: "arch",
      color: "#EB5E3D",
    },
  },
  {
    id: "ai_agents",
    title: "AI agents & workflows",
    subtitle: "GPT-4, Claude & Gemini intelligence",
    description:
      "Deploy AI nodes powered by GPT-4, Claude 3.5, and Gemini to read, reason, summarize content, and extract structured data automatically.",
    bgColor: "#DDA449", // Mustard Ochre
    textColor: "#FFFFFF",
    shapeType: "circle", // Circle
    accentTop: {
      type: "dot",
      color: "#7E755F",
    },
    accentBottom: null,
  },
  {
    id: "scheduling_triggers",
    title: "Scheduling & triggers",
    subtitle: "Cron jobs & Gmail listeners",
    description:
      "Trigger automations on inbound Gmail messages, configure time-based cron schedules, and coordinate timed execution delays.",
    bgColor: "#9B5A53", // Terracotta Rust
    textColor: "#FFFFFF",
    shapeType: "u_arch", // U-curve / Rounded bottom
    accentTop: {
      type: "cross",
      color: "#D4A5CE",
    },
    accentBottom: {
      type: "diamond",
      color: "#5B9EB5",
    },
  },
  {
    id: "comms_alerts",
    title: "Communication & alerts",
    subtitle: "Discord, WhatsApp & Email dispatch",
    description:
      "Dispatch automated Discord channel notifications, broadcast WhatsApp messages, and send transactional emails effortlessly.",
    bgColor: "#319D84", // Jade Emerald Teal
    textColor: "#FFFFFF",
    shapeType: "quadrant", // Rounded Top Right
    accentTop: null,
    accentBottom: {
      type: "square_dot",
      color: "#DDA449",
    },
  },
]

export default function HowItWorksSection() {
  const [activeId, setActiveId] = useState("ai_agents")

  return (
    <section
      id="features"
      className="py-20 sm:py-28 bg-[#F6F1EA] overflow-hidden"
      style={{ backgroundColor: "#F6F1EA" }}
    >
      <div className="max-w-[1560px] mx-auto px-4 sm:px-8 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDE6DC] border border-[#E5DCD0] text-xs font-semibold text-[#EB5E3D] mb-4 shadow-2xs">
            BUILT FOR EVERY USE CASE
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-[3.5rem] font-bold text-[#241812] tracking-tight leading-[1.08] mb-4">
            Transform any process into a workflow
          </h2>
          <p className="text-sm sm:text-base text-[#736357] leading-relaxed max-w-2xl mx-auto">
            Hover or tap each category below to explore how teams use AutoFlow across departments and platforms.
          </p>
        </div>

        {/* ── INTERLOCKING GEOMETRIC SHAPES ROW (FAUNA STYLE) ── */}
        <div className="relative w-full min-h-[540px] sm:min-h-[580px] flex items-center justify-center py-10">
          <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-5 lg:gap-0">
            {USE_CASES.map((item, index) => {
              const isActive = activeId === item.id

              // Shape styling depending on geometric type
              let shapeClasses = ""
              if (item.shapeType === "rect") {
                shapeClasses = "rounded-[28px] lg:rounded-none"
              } else if (item.shapeType === "circle") {
                shapeClasses = "rounded-[36px] lg:rounded-full"
              } else if (item.shapeType === "u_arch") {
                shapeClasses = "rounded-[28px] lg:rounded-t-none lg:rounded-b-[240px]"
              } else if (item.shapeType === "quadrant") {
                shapeClasses = "rounded-[28px] lg:rounded-none lg:rounded-tr-[280px]"
              }

              return (
                <div
                  key={item.id}
                  className="relative flex flex-col items-center justify-center w-full lg:w-auto"
                >
                  {/* Top Floating Accent Icon */}
                  {item.accentTop && (
                    <motion.div
                      animate={{
                        y: isActive ? [0, -8, 0] : 0,
                        rotate: isActive ? [0, 12, -12, 0] : 0,
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 2.4, repeat: isActive ? Infinity : 0, ease: [0.45, 0, 0.55, 1] }}
                      className="absolute -top-9 sm:-top-11 z-20 pointer-events-none hidden lg:block"
                    >
                      {item.accentTop.type === "dot" && (
                        <div
                          className="w-13 h-13 rounded-full shadow-md"
                          style={{ backgroundColor: item.accentTop.color }}
                        />
                      )}
                      {item.accentTop.type === "cross" && (
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <div className="absolute w-11 h-3 rounded-full rotate-45" style={{ backgroundColor: item.accentTop.color }} />
                          <div className="absolute w-11 h-3 rounded-full -rotate-45" style={{ backgroundColor: item.accentTop.color }} />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Main Interlocking Geometric Card */}
                  <motion.button
                    layout
                    onClick={() => setActiveId(item.id)}
                    onMouseEnter={() => setActiveId(item.id)}
                    onFocus={() => setActiveId(item.id)}
                    animate={{
                      scale: isActive ? 1.02 : 0.98,
                      zIndex: isActive ? 30 : 10 + index,
                    }}
                    whileHover={{ scale: isActive ? 1.03 : 1.005 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{
                      layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                      scale: { duration: 0.35, ease: "easeOut" },
                    }}
                    style={{
                      backgroundColor: item.bgColor,
                    }}
                    className={`relative p-9 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-shadow ${
                      shapeClasses
                    } ${
                      isActive
                        ? "shadow-[0_24px_60px_rgba(36,24,18,0.18)] ring-4 ring-white/20"
                        : "shadow-[0_8px_28px_rgba(36,24,18,0.06)] hover:brightness-105"
                    } ${
                      // Scaled up dynamic width and height on desktop
                      isActive
                        ? "lg:w-[500px] lg:h-[480px] w-full min-h-[380px]"
                        : "lg:w-[320px] lg:h-[480px] w-full min-h-[260px]"
                    } -my-2 lg:-my-0 lg:-mx-5`}
                  >
                    {/* Title */}
                    <h3 className="text-3xl sm:text-4xl md:text-[2.5rem] font-extrabold text-white tracking-tight leading-[1.12] max-w-[320px]">
                      {item.title}
                    </h3>

                    {/* Subtitle / Description (Smooth Expand On Active) */}
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          key="active-desc"
                          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="mt-4 flex flex-col items-center"
                        >
                          <p className="text-sm sm:text-base md:text-[16px] text-white/95 font-medium leading-relaxed max-w-[380px]">
                            {item.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Bottom Floating Accent Icon */}
                  {item.accentBottom && (
                    <motion.div
                      animate={{
                        y: isActive ? [0, 8, 0] : 0,
                        rotate: isActive ? [0, -10, 10, 0] : 0,
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 2.4, repeat: isActive ? Infinity : 0, ease: [0.45, 0, 0.55, 1] }}
                      className="absolute -bottom-10 sm:-bottom-12 z-20 pointer-events-none hidden lg:block"
                    >
                      {item.accentBottom.type === "arch" && (
                        <div
                          className="w-16 h-9 rounded-t-full shadow-md"
                          style={{ backgroundColor: item.accentBottom.color }}
                        />
                      )}
                      {item.accentBottom.type === "diamond" && (
                        <div
                          className="w-10 h-10 rotate-45 rounded-md shadow-md"
                          style={{ backgroundColor: item.accentBottom.color }}
                        />
                      )}
                      {item.accentBottom.type === "square_dot" && (
                        <div
                          className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-md"
                          style={{ backgroundColor: item.accentBottom.color }}
                        >
                          <div className="w-4 h-4 rounded-full bg-white" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
