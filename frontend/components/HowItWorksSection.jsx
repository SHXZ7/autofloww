"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

const STEPS = [
  {
    number: "01",
    title: "Connect your tools and triggers",
    description:
      "Link Google Sheets, Discord, Email, Webhooks, and 20+ integrations. Set triggers that kick off your workflows automatically.",
    image: "/images/firstrep.png",
    imageAlt: "Connect integrations and triggers",
    badgePosition: "top",
  },
  {
    number: "02",
    title: "Build workflows visually with AI nodes",
    description:
      "Drag and drop nodes on the canvas — connect GPT-4, Claude, Gemini, and more. No code, no guesswork, just powerful automation.",
    image: "/images/second.png",
    imageAlt: "Visual workflow builder with AI nodes",
    badgePosition: "middle",
  },
  {
    number: "03",
    title: "Run, monitor, and scale from day one",
    description:
      "Execute workflows in real time with live analytics, execution history, and performance insights — see results immediately.",
    image: "/images/thirdog.png",
    imageAlt: "Monitor workflow runs and analytics",
    badgePosition: "top",
  },
]

function StepBadge({ number, isLight }) {
  return (
    <span
      className={`inline-flex h-9 w-11 items-center justify-center rounded-lg border font-mono text-sm font-medium transition-colors ${
        isLight
          ? "border-[#d4cfc7] bg-white/60 text-[#71717a]"
          : "border-[#1e293b] bg-[#0d1527]/60 text-[#9ca3af]"
      }`}
    >
      {number}
    </span>
  )
}

export default function HowItWorksSection() {
  const [isLight, setIsLight] = useState(true)

  useEffect(() => {
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const bgColor = isLight ? "#f5f3ef" : "#030712"
  const borderColor = isLight ? "#e8e4de" : "#1e293b"
  const titleColor = isLight ? "#111" : "#ffffff"
  const descColor = isLight ? "#71717a" : "#9ca3af"
  const imageBg = isLight ? "#ebe7e1" : "#0b1329"

  return (
    <section
      id="features"
      style={{
        borderTop: `1px solid ${borderColor}`,
        background: bgColor,
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-14 text-center md:py-18"
        >
          <h2
            className="text-3xl font-bold tracking-tight md:text-5xl transition-colors"
            style={{ color: titleColor }}
          >
            How AutoFlow works
          </h2>
          <p
            className="mx-auto mt-4 max-w-2xl text-base md:text-lg transition-colors"
            style={{ color: descColor }}
          >
            From trigger to result in three simple steps — automate your workflows without writing a single line of code.
          </p>
        </motion.div>

        <div
          className={`grid md:grid-cols-3 md:divide-x transition-colors`}
          style={{ borderColor: borderColor }}
        >
          {STEPS.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.55 }}
              className="flex flex-col px-0 py-10 md:px-8 md:py-14 lg:px-10"
            >
              {index === 1 ? (
                <>
                  {/* Image at top */}
                  <div
                    className="relative mb-8 aspect-[4/3] overflow-hidden rounded-2xl transition-colors"
                    style={{ backgroundColor: imageBg }}
                  >
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Description (content) */}
                  <p
                    className="text-sm leading-relaxed md:text-[15px] transition-colors"
                    style={{ color: descColor }}
                  >
                    {step.description}
                  </p>

                  {/* Title */}
                  <h3
                    className="mt-6 text-xl font-bold leading-snug md:text-[1.65rem] md:leading-tight transition-colors"
                    style={{ color: titleColor }}
                  >
                    {step.title}
                  </h3>

                  {/* Badge 02 at bottom */}
                  <div className="mt-auto pt-8">
                    <StepBadge number={step.number} isLight={isLight} />
                  </div>
                </>
              ) : (
                <>
                  {step.badgePosition === "top" && (
                    <div className="mb-8">
                      <StepBadge number={step.number} isLight={isLight} />
                    </div>
                  )}

                  <h3
                    className="text-xl font-bold leading-snug md:text-[1.65rem] md:leading-tight transition-colors"
                    style={{ color: titleColor }}
                  >
                    {step.title}
                  </h3>

                  {step.badgePosition === "middle" ? (
                    <div className="my-10 flex flex-1 items-center md:my-14">
                      <StepBadge number={step.number} isLight={isLight} />
                    </div>
                  ) : null}

                  <p
                    className={`text-sm leading-relaxed md:text-[15px] transition-colors ${
                      step.badgePosition === "middle" ? "" : "mt-4"
                    }`}
                    style={{ color: descColor }}
                  >
                    {step.description}
                  </p>

                  <div
                    className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl md:mt-auto md:pt-10 transition-colors"
                    style={{ backgroundColor: imageBg }}
                  >
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
