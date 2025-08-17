"use client"
import { useEffect, useRef, useState } from "react"

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system with fixed seed for consistency
    const particles = []
    const particleCount = 50

    class Particle {
      constructor(index) {
        // Use index-based positioning for consistency
        const angle = (index / particleCount) * Math.PI * 2
        const radius = (index % 5) * 50 + 100
        
        this.x = (canvas.width / 2) + Math.cos(angle) * radius
        this.y = (canvas.height / 2) + Math.sin(angle) * radius
        this.vx = (Math.cos(angle + Math.PI/2) * 0.2) * (index % 2 === 0 ? 1 : -1)
        this.vy = (Math.sin(angle + Math.PI/2) * 0.2) * (index % 2 === 0 ? 1 : -1)
        this.radius = (index % 3) + 1
        this.opacity = 0.3 + (index % 3) * 0.1
        this.color = index % 2 === 0 ? '#00D4FF' : '#FF6B35'
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Initialize particles with consistent positioning
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(i))
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // Draw connections between nearby particles
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.save()
            ctx.globalAlpha = (100 - distance) / 100 * 0.1
            ctx.strokeStyle = '#00D4FF'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
            ctx.restore()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [isClient])

  // Don't render anything during SSR
  if (!isClient) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
