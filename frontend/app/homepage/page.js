"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlayIcon, StarIcon, ChevronRightIcon, CheckIcon } from "@heroicons/react/24/outline"
import dynamic from "next/dynamic"
import { useAuthStore } from "../../stores/authStore"

// Dynamically import components that use random values to avoid hydration mismatch
const WorkflowAnimation = dynamic(() => import("../../components/WorkflowAnimation"), {
  ssr: false,
  loading: () => <div className="w-full h-96 flex items-center justify-center"><div className="text-gray-400">Loading animation...</div></div>
})

const ParticleBackground = dynamic(() => import("../../components/ParticleBackground"), {
  ssr: false
})

export default function Homepage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, loading, checkAuth } = useAuthStore()

  // Check auth on component mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // If user is already authenticated, redirect to the app
  useEffect(() => {
    if (isAuthenticated === true) { // Strict comparison to true
      router.push('/')
    }
  }, [isAuthenticated, router])

  // If still loading, show loading spinner, but add a timeout to prevent infinite loading
  const [showTimeout, setShowTimeout] = useState(false)
  
  useEffect(() => {
    // If loading takes more than 3 seconds, show a timeout message
    const timeoutId = setTimeout(() => {
      if (loading) {
        setShowTimeout(true)
      }
    }, 3000)
    
    return () => clearTimeout(timeoutId)
  }, [loading])

  // Show loading, but with a timeout mechanism
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">AF</span>
          </div>
          <div className="text-white text-lg font-medium">Loading...</div>
          
          {showTimeout && (
            <div className="mt-8 max-w-md">
              <p className="text-gray-400 text-sm">
                Taking longer than expected? <button onClick={() => window.location.reload()} className="text-[#00D4FF] underline">Refresh the page</button> or continue to the <button onClick={() => router.push('/auth/login')} className="text-[#00D4FF] underline">login page</button>.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleSignup = () => {
    router.push("/auth/signup")
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  const handleStartBuilding = () => {
    router.push("/auth/signup")
  }

  const handleWatchDemo = () => {
    router.push("/auth/login?demo=true")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
        }
        
        .glow {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
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
        
        .neon-border {
          border: 1px solid transparent;
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 107, 53, 0.3)) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: exclude;
        }
        
        .workflow-card {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
          border: 1px solid rgba(0, 212, 255, 0.2);
          transition: all 0.3s ease;
        }
        
        .workflow-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 212, 255, 0.2);
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

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AF</span>
              </div>
              <span className="text-2xl font-bold gradient-text">AutoFlow</span>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#usecases" className="text-gray-300 hover:text-white transition-colors">Use Cases</a>
              <a href="#integrations" className="text-gray-300 hover:text-white transition-colors">Integrations</a>
              <a href="https://github.com/SHXZ7/autofloww.git" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                <StarIcon className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLogin}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={handleSignup}
                className="px-6 py-2 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Visual Workflow <span className="gradient-text">Automation</span> That Actually Works
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Connect AI models, automate communications, and streamline integrations with our powerful drag-and-drop platform. Build complex workflows in minutes, not hours.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleStartBuilding}
                  className="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg font-semibold text-lg hover:opacity-90 transition-all duration-300 pulse-glow flex items-center justify-center space-x-2"
                >
                  <span>Start Building Workflows</span>
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <WorkflowAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Powerful <span className="gradient-text">Automation</span> at Your Fingertips
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to build sophisticated workflows without code
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Processing",
                description: "Connect GPT-4, Claude, Gemini, and more. Smart automation that understands context and delivers intelligent results.",
                features: ["Multiple AI Models", "Context Awareness", "Smart Processing"]
              },
              {
                icon: "💬",
                title: "Omnichannel Communication",
                description: "Email, Discord, SMS, social media - reach your audience everywhere from one unified workflow platform.",
                features: ["Email Automation", "Social Media", "Real-time Messaging"]
              },
              {
                icon: "🔗",
                title: "Seamless Integrations",
                description: "Google Sheets, webhooks, file uploads - connect your entire tech stack effortlessly with pre-built connectors.",
                features: ["Google Workspace", "Webhooks", "File Processing"]
              },
              {
                icon: "⚡",
                title: "Real-Time Execution",
                description: "Watch your workflows run live with visual feedback, instant results, and comprehensive execution monitoring.",
                features: ["Live Monitoring", "Visual Feedback", "Instant Results"]
              },
              {
                icon: "🔐",
                title: "Enterprise Security",
                description: "JWT authentication, encrypted credentials, role-based access - your data stays safe with bank-level security.",
                features: ["JWT Authentication", "Encrypted Storage", "Role-based Access"]
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description: "Track performance, monitor execution history, and optimize your workflows with detailed insights and reporting.",
                features: ["Execution History", "Performance Metrics", "Optimization Tips"]
              }
            ].map((feature, index) => (
              <div key={index} className="workflow-card rounded-xl p-6 hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center space-x-2 text-sm">
                      <CheckIcon className="w-4 h-4 text-[#00D4FF]" />
                      <span className="text-gray-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Examples */}
      <section id="usecases" className="py-20 px-6 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Real-World <span className="gradient-text">Workflows</span>
            </h2>
            <p className="text-xl text-gray-300">
              See how teams use AutoFlow to solve complex automation challenges
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                title: "Document Intelligence Pipeline",
                description: "Automatically process documents, extract insights with AI, and generate reports for your team.",
                workflow: "PDF Upload → AI Analysis → Report Generation → Team Notification",
                icon: "📄",
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "Content Creation Suite",
                description: "Generate content with AI, create matching visuals, and publish across all your social channels.",
                workflow: "AI Writing → Image Generation → Social Publishing → Performance Tracking",
                icon: "✍️",
                color: "from-purple-500 to-pink-500"
              },
              {
                title: "Data Processing Automation",
                description: "Schedule data collection, process with AI models, and deliver automated insights to stakeholders.",
                workflow: "Schedule → Spreadsheet Data → AI Processing → Automated Reporting",
                icon: "📊",
                color: "from-orange-500 to-red-500"
              }
            ].map((usecase, index) => (
              <div key={index} className="glass rounded-xl p-8 hover:scale-105 transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-r ${usecase.color} rounded-xl flex items-center justify-center text-2xl mb-6`}>
                  {usecase.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{usecase.title}</h3>
                <p className="text-gray-300 mb-6">{usecase.description}</p>
                <div className="bg-[#1a1a1a] rounded-lg p-4 font-mono text-sm">
                  <span className="text-[#00D4FF]">{usecase.workflow}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Credibility */}
      <section id="integrations" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Built on <span className="gradient-text">Modern Technology</span>
            </h2>
            <p className="text-xl text-gray-300">
              Enterprise-grade stack trusted by teams worldwide
            </p>
          </div>

          {/* Technology Stack */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="glass rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold mb-2">Frontend</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {["React", "Next.js", "Tailwind CSS", "React Flow"].map(tech => (
                    <span key={tech} className="px-3 py-1 bg-[#00D4FF]/20 text-[#00D4FF] rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="glass rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold mb-2">Backend</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {["FastAPI", "Python", "MongoDB", "JWT Auth"].map(tech => (
                    <span key={tech} className="px-3 py-1 bg-[#FF6B35]/20 text-[#FF6B35] rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="glass rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold mb-2">Integrations</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {["OpenAI", "Google", "Twilio", "Discord"].map(tech => (
                    <span key={tech} className="px-3 py-1 bg-[#6c5ce7]/20 text-[#6c5ce7] rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { metric: "1000+", label: "Workflows/Hour" },
              { metric: "99.9%", label: "Uptime" },
              { metric: "<100ms", label: "Response Time" },
              { metric: "Enterprise", label: "Security" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold gradient-text mb-2">{stat.metric}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#00D4FF]/10 to-[#FF6B35]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Automate</span> Your Workflows?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of teams building the future of automation with AutoFlow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartBuilding}
              className="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg font-semibold text-lg hover:opacity-90 transition-all duration-300 pulse-glow"
            >
              Start Building Now
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-[#00D4FF] to-[#FF6B35] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AF</span>
              </div>
              <span className="text-xl font-bold gradient-text">AutoFlow</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="https://github.com/SHXZ7/autofloww.git" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Documentation
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; AutoFlow. Built with ❤️ By Mohammed Shaaz</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

