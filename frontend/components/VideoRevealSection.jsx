"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

/**
 * VideoRevealSection
 *
 * Structure:
 *   <outer> 220vh  ← scroll travel. Content below starts exactly after.
 *     <sticky> 100vh  ← CSS sticky: stays in view during scroll, no JS spacer
 *       <videoBox>  GSAP scrubs scale 0.62 → 0.9, borderRadius 20 → 10
 */
export default function VideoRevealSection({
  src = "/videos/A_clean_second_product_dem.mp4",
  isLight: propIsLight,
}) {
  const outerRef = useRef(null)
  const videoBoxRef = useRef(null)
  const [isLight, setIsLight] = useState(true)

  useEffect(() => {
    if (propIsLight !== undefined) {
      setIsLight(propIsLight)
      return
    }
    const update = () => setIsLight(document.documentElement.classList.contains('light'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [propIsLight])

  useEffect(() => {
    const outer = outerRef.current
    const videoBox = videoBoxRef.current
    if (!outer || !videoBox) return

    const isMobile = window.innerWidth <= 768
    const startScale = isMobile ? 0.88 : 0.62
    const startRadius = isMobile ? 10 : 20

    gsap.set(videoBox, {
      scale: startScale,
      borderRadius: startRadius,
      transformOrigin: "center center",
    })

    const ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: "top top",       // pin starts the moment outer hits viewport top
          end: "bottom bottom", // ends exactly when outer bottom = viewport bottom
          scrub: 1.2,             // slight smoothing, feels good
        },
      }).to(videoBox, {
        scale: 0.9,
        borderRadius: 10,
        ease: "none",
      })
    }, outer)

    return () => ctx.revert()
  }, [])

  const bgColor = isLight ? "#f5f3ef" : "#030712"

  return (
    <div
      ref={outerRef}
      className="video-reveal-container"
      style={{
        position: "relative",
        height: "140vh",
        background: bgColor,
        transition: "background-color 0.3s ease",
      }}
    >
      <style jsx>{`
        @media (max-width: 768px) {
          .video-reveal-container {
            display: none !important;
          }
        }
      `}</style>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: bgColor,
          transition: "background-color 0.3s ease",
        }}
      >
        {/* VIDEO BOX: starts at 62% scale, grows to 90% */}
        <div
          ref={videoBoxRef}
          style={{
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            borderRadius: "20px",
            backgroundColor: "#111",
            willChange: "transform, border-radius",
            boxShadow: "0 28px 90px -16px rgba(0,0,0,0.28)",
          }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          >
            <source src={src} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}
