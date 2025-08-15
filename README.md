# AutoFlow - Visual Workflow Automation Platform

<div align="center">
  <img src="https://via.placeholder.com/200x200/ff6d6d/ffffff?text=AF" alt="AutoFlow Logo" width="100" height="100">
  
  [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

AutoFlow is a powerful visual workflow automation platform that allows you to create, manage, and execute complex workflows using a drag-and-drop interface. Connect AI models, communication services, integrations, and automation tools in a seamless visual environment.

## ✨ Features

### 🤖 AI Integration
- **Multiple AI Models**: GPT-4, Claude, Gemini, Llama, Mistral
- **Customizable Prompts**: Dynamic prompt configuration with temperature control
- **Context Awareness**: AI nodes can process content from connected document parsers

### 💬 Communication
- **Email**: Send automated emails with attachments from workflow results
- **Discord**: Rich embeds with workflow results and file attachments
- **SMS/WhatsApp**: Send messages via Twilio integration
- **Social Media**: Automated posting to Twitter, Facebook, Instagram, LinkedIn

### 🔗 Integrations
- **Webhooks**: HTTP endpoint triggers and callbacks
- **Google Sheets**: Read/write spreadsheet data
- **File Upload**: Google Drive integration with automatic file processing
- **Document Parser**: Extract content from PDF, Word, Excel, and text files

### ⚡ Automation
- **Scheduler**: Cron-based workflow automation
- **Image Generation**: AI-powered image creation with DALL-E and Stability AI
- **Report Generator**: Create PDF, HTML, and Word reports from workflow data
- **Real-time Execution**: Live workflow execution with visual feedback

### 🔐 Security & Authentication
- **User Authentication**: JWT-based secure login system
- **Protected Routes**: Role-based access control
- **Credential Management**: Secure API key storage and management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/autoflow.git
   cd autoflow
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `backend/.env` with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_key
   GOOGLE_API_KEY=your_google_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   SECRET_KEY=your_jwt_secret_key
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

### Creating Your First Workflow

1. **Login**: Use demo credentials `user@autoflow.com` / `password123`
2. **Add Nodes**: Drag nodes from the sidebar to the canvas
3. **Connect Nodes**: Draw connections between node handles
4. **Configure**: Double-click nodes to configure their settings
5. **Execute**: Click "Run Workflow" to see your automation in action

### Example Workflows

#### 📊 Document Analysis & Reporting
```
Document Parser → AI Analysis (GPT) → Report Generator → Email
```

#### 🎨 Content Creation Pipeline
```
AI Content (GPT) → Image Generation → Social Media → Discord Notification
```

#### ⏰ Scheduled Data Processing
```
Schedule → Google Sheets → AI Processing → Email Summary
```

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── app/
│   ├── auth/          # Authentication & JWT
│   ├── core/          # Workflow execution engine
│   ├── models/        # Pydantic data models
│   └── main.py        # FastAPI application
├── services/          # Node implementations
│   ├── gpt.py         # AI model integrations
│   ├── email.py       # Email service
│   ├── webhook.py     # HTTP webhooks
│   └── ...
└── requirements.txt
```

### Frontend (Next.js + React)
```
frontend/
├── components/
│   ├── auth/          # Authentication components
│   ├── CustomNode.jsx # Node component
│   ├── NodeSidebar.jsx# Node palette
│   └── ProfileBar.jsx # User interface
├── stores/            # Zustand state management
│   ├── authStore.js   # User authentication
│   └── flowStore.js   # Workflow state
└── app/               # Next.js app directory
```

## 🔧 Configuration

### Node Types

| Category | Nodes | Description |
|----------|--------|-------------|
| **AI** | GPT, Claude, Gemini, Llama, Mistral | AI model integrations |
| **Communication** | Email, Discord, Twilio, Social Media | Messaging & notifications |
| **Integration** | Webhook, Google Sheets, File Upload | External service connections |
| **Automation** | Schedule, Image Gen, Doc Parser, Report Gen | Processing & automation |

## 📈 Roadmap

- [ ] **Database Integration**: PostgreSQL support for workflow persistence
- [ ] **Team Collaboration**: Multi-user workspaces and sharing
- [ ] **Advanced Scheduling**: More scheduling options and triggers
- [ ] **Marketplace**: Community node library
- [ ] **API Rate Limiting**: Enhanced quota management
- [ ] **Workflow Templates**: Pre-built workflow templates
- [ ] **Mobile App**: iOS and Android applications
- [ ] **Enterprise Features**: SSO, audit logs, advanced permissions

---

<div align="center">
  Made with ❤️ by the Mohammed Shaaz
  
  ⭐ Star this repository if you find it helpful!
</div>