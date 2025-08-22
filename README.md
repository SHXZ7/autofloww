# AutoFlow - Visual Workflow Automation Platform

<div align="center">
  <img width="1024" height="1024" alt="ChatGPT Image Aug 22, 2025, 03_02_19 PM" src="https://github.com/user-attachments/assets/7df6f149-cb82-4cfc-a4fb-54058c4999b3" />

  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

AutoFlow is a powerful visual workflow automation platform that allows you to create, manage, and execute complex workflows using a drag-and-drop interface. Connect AI models, communication services, integrations, and automation tools in a seamless visual environment.

## ✨ Features

### 🤖 AI Integration
- **Multiple AI Models**: GPT-4o, Claude, Gemini, Llama 3, Mistral
- **Customizable Prompts**: Dynamic prompt configuration with temperature control
- **Context Awareness**: AI nodes can process content from connected document parsers
- **Model Selection**: Choose different AI models per node with real-time switching

### 💬 Communication
- **Email**: Send automated emails with attachments from workflow results
- **Discord**: Rich embeds with workflow results and file attachments
- **SMS/WhatsApp**: Send messages via Twilio integration
- **Social Media**: Automated posting to Twitter, Facebook, Instagram, LinkedIn

### 🔗 Integrations
- **Webhooks**: HTTP endpoint triggers and callbacks with custom payloads
- **Google Sheets**: Read/write spreadsheet data with range selection
- **File Upload**: Google Drive, Dropbox, and OneDrive integration
- **Document Parser**: Extract content from PDF, Word, Excel, and text files

### ⚡ Automation
- **Scheduler**: Cron-based workflow automation with flexible timing
- **Image Generation**: AI-powered image creation with DALL-E and Stability AI
- **Report Generator**: Create PDF, HTML, and Word reports from workflow data
- **Real-time Execution**: Live workflow execution with visual feedback and monitoring

### 💾 Workflow Management
- **Save/Load Workflows**: Persistent workflow storage with MongoDB
- **Workflow History**: Track execution history and performance metrics
- **Multiple Workspaces**: Organize workflows in different workspaces
- **Version Control**: Track workflow changes and updates
- **Import/Export**: Share workflows between users and environments

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- MongoDB (optional - falls back to in-memory storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SHXZ7/autofloww.git
   cd autoflow
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your API keys and MongoDB connection
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `backend/.env` with your API keys:
   ```env
   # MongoDB Configuration (optional)
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=autoflow
   
   # Set to true to force in-memory mode
   FORCE_IN_MEMORY_DB=false
   
   # API Keys
   OPENAI_API_KEY=your_openai_key
   GOOGLE_API_KEY=your_google_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   
   # Email Configuration
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # Security
   SECRET_KEY=your_jwt_secret_key_change_in_production
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```
   Backend will be available at `http://localhost:8000`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

## 📋 Usage

### Getting Started

1. **Visit Homepage**: Navigate to `http://localhost:3000/homepage` for the landing page
2. **Create Account**: Sign up with email or use demo credentials
3. **Setup 2FA** (Optional): Enable two-factor authentication in profile settings
4. **Configure API Keys**: Add your external service API keys in settings

### Creating Your First Workflow

1. **New Workflow**: Click "New" in the workflow controls
2. **Add Nodes**: Drag nodes from the categorized sidebar
3. **Connect Nodes**: Click and drag between node connection points
4. **Configure Nodes**: Double-click nodes to open configuration panels
5. **Save Workflow**: Name and save your workflow for later use
6. **Execute**: Click "Run Workflow" to execute your automation

### Advanced Features

#### Workspace Management
- **Multiple Workspaces**: Switch between different project contexts
- **Workflow Organization**: Group related workflows by workspace
- **Team Collaboration**: Share workspaces with team members (coming soon)

#### Workflow Features
- **Real-time Execution**: Watch nodes execute with visual feedback
- **Error Handling**: Comprehensive error reporting and debugging
- **Scheduling**: Set up automated workflow execution with cron expressions
- **History**: Track workflow execution history and performance

### Example Workflows

#### 📊 Document Analysis & Reporting
```
Document Parser → GPT Analysis → Report Generator → Email Notification
```
**Use Case**: Automatically analyze uploaded documents and generate insights

#### 🎨 Content Creation Pipeline
```
GPT Content Generation → Image Generation → Social Media Post → Discord Alert
```
**Use Case**: Create complete social media content with AI-generated text and images

#### ⏰ Scheduled Data Processing
```
Schedule Trigger → Google Sheets Reader → AI Processing → Automated Report
```
**Use Case**: Daily data analysis and reporting from spreadsheet data

#### 🔄 Webhook Processing
```
Webhook Trigger → Document Parser → AI Analysis → Multi-channel Notification
```
**Use Case**: Process incoming webhook data and distribute insights

## 🏗️ Architecture

### Backend (FastAPI + Python)
```
backend/
├── app/
│   ├── auth/              # Authentication & 2FA
│   │   ├── auth.py        # JWT and password handling
│   │   └── two_factor.py  # TOTP implementation
│   ├── core/              # Workflow execution engine
│   ├── models/            # Pydantic data models
│   ├── database/          # MongoDB operations
│   │   ├── connection.py  # Database connection with fallback
│   │   ├── user_operations.py    # User CRUD operations
│   │   └── workflow_operations.py # Workflow persistence
│   └── main.py            # FastAPI application with 2FA endpoints
├── services/              # Node implementations
│   ├── gpt.py            # AI model integrations
│   ├── email.py          # Email service
│   ├── discord.py        # Discord integration
│   ├── webhook.py        # HTTP webhooks
│   ├── scheduler.py      # Cron scheduling
│   └── ...
└── requirements.txt
```

### Frontend (Next.js + React + Zustand)
```
frontend/
├── components/
│   ├── auth/              # Authentication components
│   │   ├── AuthPage.jsx   # Main auth page
│   │   ├── LoginForm.jsx  # Login with 2FA support
│   │   ├── TwoFactorSetup.jsx     # 2FA configuration
│   │   └── TwoFactorLogin.jsx     # 2FA verification
│   ├── CustomNode.jsx     # Drag-and-drop node component
│   ├── NodeSidebar.jsx    # Categorized node palette
│   ├── ProfileBar.jsx     # User interface with workspace switching
│   ├── ProfileSettings.jsx # Comprehensive settings modal
│   ├── WorkflowControls.jsx # Save/load/delete workflows
│   └── ParticleBackground.jsx # Animated background
├── stores/                # Zustand state management
│   ├── authStore.js       # User auth with 2FA support
│   └── flowStore.js       # Workflow state with persistence
├── app/
│   ├── homepage/          # Landing page
│   └── page.js            # Main application
└── globals.css           # Enhanced styling
```

## 🛠️ Development

### Adding New Nodes

1. **Backend Service**: Create service file in `backend/services/`
2. **Frontend Configuration**: Add node type to `NodeSidebar.jsx`
3. **Node Implementation**: Update `CustomNode.jsx` with form fields
4. **Store Integration**: Add to node types in `flowStore.js`

## 📈 Roadmap

### Current Release (v1.0)
- [x] Visual workflow builder with drag-and-drop interface
- [x] AI model integration (GPT, Claude, Gemini, etc.)
- [x] Communication nodes (Email, Discord, SMS)
- [x] File processing and document parsing
- [x] User authentication with 2FA
- [x] Workflow persistence and management
- [x] Real-time execution with visual feedback

### Next Release (v1.1)
- [ ] **Enhanced Scheduling**: More trigger types and conditions
- [ ] **Workflow Templates**: Pre-built templates for common use cases
- [ ] **API Rate Limiting**: Better quota management and usage tracking
- [ ] **Advanced Error Handling**: Retry logic and failure recovery
- [ ] **Performance Monitoring**: Execution metrics and optimization suggestions

### Future Releases
- [ ] **Team Collaboration**: Multi-user workspaces and sharing
- [ ] **Marketplace**: Community node library and sharing
- [ ] **Mobile App**: iOS and Android applications
- [ ] **Enterprise Features**: SSO, audit logs, advanced permissions
- [ ] **Cloud Deployment**: Hosted version with scalable infrastructure
- [ ] **Workflow Analytics**: Advanced reporting and insights

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Flow**: For the excellent workflow visualization library
- **FastAPI**: For the modern Python web framework
- **Next.js**: For the React framework with great developer experience
- **Tailwind CSS**: For the utility-first CSS framework
- **Heroicons**: For the beautiful icon set

---

<div align="center">
  Made with ❤️ by Mohammed Shaaz
  
  ⭐ Star this repository if you find it helpful!
  
  [🐛 Report Bug](https://github.com/SHXZ7/autofloww/issues) • [✨ Request Feature](https://github.com/SHXZ7/autofloww/issues) • [📖 Documentation](https://github.com/SHXZ7/autofloww/wiki)
</div>
