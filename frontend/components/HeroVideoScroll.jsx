"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

/**
 * HeroVideoScroll — Clipzy-style scroll-driven video expand.
 *
 * Scroll timeline  (wrapper = 650 vh):
 *   0 → 20%   Hero text fades up and out
 *   0 → 14%   Video card invisible
 *   14→ 80%   Video card grows: width 62vw→100vw, height 38vh→100vh
 *   80→ 92%   Full-screen video holds — user can watch comfortably
 *   92→100%   Video slides up to exit; next page content is revealed below
 */
export default function HeroVideoScroll({
  children,
  src = "/videos/A_clean_second_product_dem.mp4",
}) {
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  /* ─── Hero text ─────────────────────────────────────────── */
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08, 0.22], [1, 1, 0])
  const heroY       = useTransform(scrollYProgress, [0, 0.22], [0, -60])

  /* ─── Video appearance ──────────────────────────────────── */
  const videoOpacity = useTransform(scrollYProgress, [0.08, 0.15], [0, 1])

  /* ─── Video dimensions (animate directly as CSS values) ─── */
  // Width: 62vw  →  100vw
  const videoWidth = useTransform(
    scrollYProgress,
    [0.14, 0.8],
    ["62vw", "100vw"]
  )
  // Height: 40vh  →  100vh
  const videoHeight = useTransform(
    scrollYProgress,
    [0.14, 0.8],
    ["40vh", "100vh"]
  )

  /* ─── Border radius ─────────────────────────────────────── */
  const borderRadius = useTransform(
    scrollYProgress,
    [0.14, 0.75],
    [18, 0]
  )

  /* ─── Exit (slides up) ──────────────────────────────────── */
  const videoY = useTransform(scrollYProgress, [0.92, 1], ["0%", "-102%"])

  /* ─── Scroll hint ───────────────────────────────────────── */
  const hintOpacity = useTransform(scrollYProgress, [0, 0.07], [1, 0])

  return (
    /* 650 vh = plenty of travel so each phase is leisurely */
    <section ref={containerRef} style={{ height: "650vh", position: "relative" }}>

      {/* Sticky shell — pinned to top of viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#f5f3ef",
        }}
      >

        {/* ── Hero text (children) ── */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center w-full px-4 pt-28 md:pt-36"
        >
          {children}
        </motion.div>

        {/* ── Video card — anchored to bottom-center, grows upward ── */}
        <motion.div
          style={{
            opacity: videoOpacity,
            width: videoWidth,
            height: videoHeight,
            borderRadius,
            y: videoY,
            position: "absolute",
            bottom: 0,
            left: "50%",
            translateX: "-50%",
            zIndex: 20,
            overflow: "hidden",
            backgroundColor: "#111",
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          >
            <source src={src} type="video/mp4" />
          </video>

          {/* Bottom gradient so content transition feels natural */}
          <div
            style={{
              position: "absolute",
              inset: "auto 0 0 0",
              height: "80px",
              background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))",
              pointerEvents: "none",
            }}
          />
        </motion.div>

        {/* ── Scroll hint ── */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#71717a",
              userSelect: "none",
            }}
          >
            Scroll
          </span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{ display: "block", width: 16, height: 1, borderRadius: 9999, backgroundColor: "#71717a" }}
              animate={{ opacity: [0.25, 1, 0.25], y: [0, 3, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
