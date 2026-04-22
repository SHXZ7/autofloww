
# 🚀 AutoFlow - Visual Workflow Automation Platform

<div align="center">

![AutoFlow Logo](https://img.shields.io/badge/AutoFlow-Visual_Workflow_Automation-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA9TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDBENEZGIi8+Cjwvc3ZnPgo=)

**Build powerful workflows visually. No code required.**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=flat-square&logo=github)](https://github.com/SHXZ7/autofloww.git)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)](package.json)

[🌟 Features](#features) • [🚀 Quick Start](#quick-start) • [📖 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Latest Updates (April 2026)](#-latest-updates-april-2026)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Workflow Components](#workflow-components)
- [Examples](#examples)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

AutoFlow is a powerful visual workflow automation platform that enables users to create sophisticated automation workflows using a drag-and-drop interface. Connect AI models, automate communications, process documents, and integrate with various services - all without writing code.

## 🔄 Latest Updates (April 2026)

### Mobile UX Improvements
- **Main app mobile optimization** across builder pages (`/`, `/workflows`, `/templates`, `/runs`, `/settings`, `/integrations`)
- **Unified mobile bottom navigation** component with consistent sizing, placement, and active state behavior
- **5-item mobile nav** (Integrations removed from mobile quick nav)
- **Improved control placement** for flow actions and zoom controls to prevent overlap on small screens

### Settings & Profile Modal (Mobile)
- Reworked into a compact mobile-friendly modal layout
- Added a **left icon rail** for quick section switching on mobile
- Reduced spacing/typography/input density for iPhone-size displays
- Added **mobile logout action** in settings flow
- Fixed modal clipping/overlap behavior above bottom navigation

### Auth Pages (Mobile)
- Login and Signup containers reduced for smaller screens
- Tighter mobile form spacing and typography
- Improved mobile scroll behavior to avoid clipped content
- Desktop layout remains unchanged (`md` and above)

### Frontend/Backend Connectivity
- Frontend API base URL fallbacks were aligned to current LAN backend usage (`172.20.10.2:8000`) where configured
- Existing environment-variable-based configuration (`NEXT_PUBLIC_API_URL`) remains supported

### Text-to-Workflow
- Added support for **Text-to-Workflow** creation flow
- Users can describe automation in plain language and quickly convert it into a structured workflow draft
- Designed to speed up first-time workflow creation before manual node fine-tuning

### 🌟 Key Highlights

- **Visual Workflow Builder**: Intuitive drag-and-drop interface powered by React Flow
- **Text-to-Workflow Generation**: Build workflow drafts from natural language prompts
- **AI Integration**: Connect GPT-4, Claude, Gemini, Llama, and other AI models
- **Multi-Channel Communication**: Email, Discord, SMS, social media automation
- **Document Processing**: Advanced PDF, Excel, and document parsing capabilities
- **Real-Time Execution**: Live workflow monitoring with visual feedback
- **Enterprise Security**: JWT authentication, encrypted credentials, role-based access
- **Scalable Architecture**: FastAPI backend with MongoDB for enterprise workloads

## ✨ Features

### 🤖 AI-Powered Automation
- **Multiple AI Models**: GPT-4, Claude, Gemini, Llama, Mistral support
- **Text-to-Workflow**: Convert plain-text automation requirements into editable workflow structures
- **Context-Aware Processing**: Smart data flow between workflow nodes
- **Custom Prompts**: Dynamic prompt generation with workflow context
- **Model Switching**: Easy switching between different AI providers

### 💬 Communication Automation
- **Email Integration**: Rich HTML emails with attachments and AI content
- **Discord Bot**: Advanced Discord webhooks with embeds and formatting
- **SMS/WhatsApp**: Twilio integration for mobile messaging
- **Social Media**: Automated posting across multiple platforms

### 🔗 System Integrations
- **Google Workspace**: Sheets, Drive, and document processing
- **File Management**: Upload, download, and process various file formats
- **Webhooks**: Custom webhook triggers and responses
- **API Integrations**: Extensible API connector framework

### 📊 Advanced Capabilities
- **Document Intelligence**: PDF, Excel, Word document parsing and analysis
- **Image Generation**: AI-powered image creation with DALL-E and Stable Diffusion
- **Report Generation**: Automated PDF and HTML report creation
- **Scheduling**: Cron-based workflow scheduling and automation
- **Data Processing**: Advanced data transformation and analysis tools

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 with Next.js 13+
- Tailwind CSS for styling
- React Flow for visual workflow builder
- Zustand for state management
- Heroicons for UI icons

**Backend**
- FastAPI (Python) for high-performance API
- MongoDB for data persistence
- JWT for authentication
- APScheduler for workflow scheduling
- Pydantic for data validation

**Integrations**
- OpenAI GPT-4, Claude, Gemini
- Google Workspace APIs
- Twilio for SMS/WhatsApp
- Discord Webhooks
- Various AI model providers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- MongoDB (local or cloud)
- Git

### 1-Minute Setup

```bash
# Clone the repository
git clone https://github.com/SHXZ7/autofloww.git
cd autofloww

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup frontend
cd ../frontend
npm install

# Start development servers
# Terminal 1 (Backend)
uvicorn backend.app.main:app --reload --port 8000

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

Visit `http://localhost:3000` to access AutoFlow.

If you are testing on a phone in the same network, open:
- `http://<your-machine-ip>:3000`

## 🛠️ Installation

### Development Environment

#### Backend Setup

1. **Create Virtual Environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Backend Server**
```bash
uvicorn backend.app.main:app --reload --port 8000
```

#### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Environment Configuration**
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. **Start Development Server**
```bash
npm run dev
```

## 📖 Usage Guide

### Creating Your First Workflow

1. **Access Workflow Builder**
   - Navigate to `/` after logging in
   - Click "Create New Workflow"

2. **Add Workflow Nodes**
   - Drag components from the sidebar
   - Connect nodes with edges
   - Configure node parameters

3. **Configure Node Settings**
   - Click on any node to open settings
   - Set up API keys, prompts, and parameters
   - Test individual nodes

4. **Execute Workflow**
   - Click "Run Workflow" to execute
   - Monitor real-time execution
   - View results and logs

### Workflow Components Guide

#### AI Processing Nodes
- **GPT Node**: OpenAI GPT-4 text processing
- **Claude Node**: Anthropic Claude AI
- **Gemini Node**: Google Gemini AI
- **Llama Node**: Meta Llama models

#### Communication Nodes
- **Email Node**: Send rich HTML emails
- **Discord Node**: Send Discord messages
- **SMS Node**: Send SMS via Twilio
- **Social Media Node**: Multi-platform posting

#### Data Processing Nodes
- **Document Parser**: Extract text from PDFs/documents
- **Google Sheets**: Read/write spreadsheet data
- **File Upload**: Upload files to cloud storage
- **Webhook**: HTTP requests and API calls

#### Utility Nodes
- **Schedule Node**: Time-based triggers
- **Image Generation**: AI image creation
- **Report Generator**: Automated report creation
  

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork the Repository**
```bash
git clone https://github.com/your-username/autofloww.git
cd autofloww
```

2. **Create Feature Branch**
```bash
git checkout -b feature/amazing-feature
```

3. **Make Changes**
- Follow existing code style
- Add tests for new features
- Update documentation

4. **Submit Pull Request**
- Describe your changes
- Include screenshots for UI changes
- Ensure all tests pass

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **JavaScript**: Follow Prettier configuration
- **Commits**: Use conventional commit messages

### Adding New Node Types

1. **Backend Integration**
```python
# services/your_service.py
async def run_your_node(node_data: Dict[str, Any]) -> str:
    # Implementation
    return "Success"
```

2. **Frontend Component**
```jsx
// components/nodes/YourNode.jsx
export default function YourNode({ data, onUpdate }) {
    // Node UI implementation
}
```

3. **Register Node Type**
```python
# Update NODE_TYPES in core/runner.py
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.10+

# Check dependencies
pip install -r requirements.txt

# Check MongoDB connection
python -c "import pymongo; print('MongoDB OK')"
```

#### Frontend Build Errors
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

#### Workflow Execution Fails
1. Check API keys in user settings
2. Verify node configuration
3. Check execution logs in dashboard
4. Ensure proper data flow between nodes


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Flow** - For the amazing workflow visualization library
- **FastAPI** - For the high-performance Python web framework
- **MongoDB** - For flexible document storage
- **OpenAI** - For powerful AI model integration
- **Tailwind CSS** - For beautiful, utility-first styling

<div align="center">

**Built with ❤️ by Mohammed Shaaz**

[⭐ Star this repo](https://github.com/SHXZ7/autofloww) • [🐛 Report bug](https://github.com/SHXZ7/autofloww/issues) • [💡 Request feature](https://github.com/SHXZ7/autofloww/issues)

</div>
