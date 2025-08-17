"use client"
import { useState, useEffect } from "react"

export default function WorkflowAnimation() {
  const [activeStep, setActiveStep] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const nodes = [
    { id: 1, label: "AI Model", icon: "🤖", color: "#4a90e2", position: { x: 0, y: 0 } },
    { id: 2, label: "Document", icon: "📄", color: "#1abc9c", position: { x: 200, y: 0 } },
    { id: 3, label: "Report", icon: "📊", color: "#f39c12", position: { x: 400, y: 0 } },
    { id: 4, label: "Email", icon: "📧", color: "#2ecc71", position: { x: 600, y: 0 } }
  ]

  // Use fixed positions for particles to avoid hydration mismatch
  const fixedParticles = [
    { x: 20, y: 30, delay: 0 },
    { x: 80, y: 70, delay: 1 },
    { x: 40, y: 50, delay: 2 },
    { x: 60, y: 20, delay: 0.5 },
    { x: 10, y: 80, delay: 1.5 },
    { x: 90, y: 40, delay: 2.5 }
  ]

  return (
    <div className="relative w-full h-96 flex items-center justify-center">
      <style jsx>{`
        .connection-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00D4FF, transparent);
          top: 50%;
          transform: translateY(-50%);
          opacity: 0;
          animation: flow 2s infinite;
        }
        
        .connection-line.active {
          opacity: 1;
        }
        
        @keyframes flow {
          0% { opacity: 0; transform: translateY(-50%) scaleX(0); }
          50% { opacity: 1; transform: translateY(-50%) scaleX(1); }
          100% { opacity: 0; transform: translateY(-50%) scaleX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(0, 212, 255, 0.6); }
        }
        
        .node-active {
          animation: pulse 1s infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating-particle {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00D4FF" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Workflow Nodes */}
      <div className="relative">
        {nodes.map((node, index) => (
          <div key={node.id} className="absolute flex flex-col items-center" 
               style={{ 
                 left: `${node.position.x * 0.8}px`, 
                 top: `${node.position.y}px`,
                 transform: 'translate(-50%, -50%)'
               }}>
            
            {/* Node */}
            <div className={`
              w-16 h-16 rounded-xl flex items-center justify-center text-2xl
              border-2 border-white/20 backdrop-blur-sm transition-all duration-500
              ${activeStep === index ? 'node-active' : ''}
              floating-particle
            `}
            style={{
              background: `linear-gradient(135deg, ${node.color}40, ${node.color}20)`,
              borderColor: activeStep === index ? '#00D4FF' : 'rgba(255,255,255,0.2)',
              animationDelay: `${index * 0.2}s`
            }}>
              {node.icon}
            </div>
            
            {/* Label */}
            <span className="mt-3 text-sm font-medium text-gray-300">
              {node.label}
            </span>

            {/* Connection Line */}
            {index < nodes.length - 1 && (
              <div 
                className={`connection-line ${activeStep === index ? 'active' : ''}`}
                style={{
                  left: '32px',
                  width: '120px'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Fixed Floating Particles - only render on client */}
      {isClient && fixedParticles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-[#00D4FF] rounded-full opacity-60 floating-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '3s'
          }}
        />
      ))}

      {/* Workflow Status */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-16">
        <div className="glass rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#00D4FF] rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              {activeStep === 0 && "Processing with AI..."}
              {activeStep === 1 && "Analyzing document..."}
              {activeStep === 2 && "Generating report..."}
              {activeStep === 3 && "Sending notification..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
