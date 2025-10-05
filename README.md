
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

### 🌟 Key Highlights

- **Visual Workflow Builder**: Intuitive drag-and-drop interface powered by React Flow
- **AI Integration**: Connect GPT-4, Claude, Gemini, Llama, and other AI models
- **Multi-Channel Communication**: Email, Discord, SMS, social media automation
- **Document Processing**: Advanced PDF, Excel, and document parsing capabilities
- **Real-Time Execution**: Live workflow monitoring with visual feedback
- **Enterprise Security**: JWT authentication, encrypted credentials, role-based access
- **Scalable Architecture**: FastAPI backend with MongoDB for enterprise workloads

## ✨ Features

### 🤖 AI-Powered Automation
- **Multiple AI Models**: GPT-4, Claude, Gemini, Llama, Mistral support
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

### Frontend (Next.js)
```
frontend/
├── app/                    # Next.js 13+ app directory
│   ├── auth/              # Authentication pages
│   ├── homepage/          # Landing page
│   └── workflow/          # Workflow builder
├── components/            # Reusable React components
├── stores/               # Zustand state management
└── styles/               # Tailwind CSS styling
```

### Backend (FastAPI)
```
backend/
├── app/
│   ├── auth/             # JWT authentication system
│   ├── core/             # Workflow execution engine
│   ├── database/         # MongoDB operations
│   ├── models/           # Pydantic data models
│   └── routes/           # API endpoints
├── services/             # External service integrations
└── config/              # Configuration management
```

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
cd backend && uvicorn app:app --reload --port 8000

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

Visit `http://localhost:3000` to access AutoFlow!

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
uvicorn app:app --reload --port 8000
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

### Production Deployment

#### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

#### Manual Deployment

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run build
npm start
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=autoflow

# Authentication
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# AI Services
OPENAI_API_KEY=sk-your-openai-key
OPENROUTER_API_KEY=sk-your-openrouter-key
ANTHROPIC_API_KEY=your-claude-key

# Communication Services
GMAIL_APP_PASSWORD=your-gmail-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Google Services
GOOGLE_CREDENTIALS_JSON=path-to-service-account.json
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=AutoFlow
```

### Service Configuration

#### Google Services Setup
1. Create a Google Cloud Project
2. Enable required APIs (Drive, Sheets, Gmail)
3. Create service account credentials
4. Download JSON key file

#### AI Model Configuration
- **OpenAI**: Get API key from OpenAI platform
- **OpenRouter**: Alternative for multiple AI models
- **Anthropic**: For Claude AI models

## 📖 Usage Guide

### Creating Your First Workflow

1. **Access Workflow Builder**
   - Navigate to `/workflow` after logging in
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

## 🔧 API Documentation

### Authentication

All API requests require JWT authentication:

```bash
# Login to get token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/workflows"
```

### Core Endpoints

#### Workflows
```bash
# Get user workflows
GET /api/workflows

# Create workflow
POST /api/workflows
{
  "name": "My Workflow",
  "nodes": [...],
  "edges": [...]
}

# Execute workflow
POST /api/workflows/{workflow_id}/execute

# Get execution history
GET /api/workflows/{workflow_id}/executions
```

#### User Management
```bash
# Get user profile
GET /api/user/profile

# Update user settings
PUT /api/user/profile

# Get API key status
GET /api/user/api-keys
```

### Webhook Endpoints

```bash
# Trigger workflow via webhook
POST /webhook/{workflow_id}

# Get webhook URL
GET /api/workflows/{workflow_id}/webhook-url
```

## 🧩 Workflow Components

### Node Types

| Node Type | Description | Inputs | Outputs |
|-----------|-------------|---------|---------|
| GPT | AI text processing | prompt, model | generated_text |
| Email | Send emails | recipient, subject, body | status |
| Discord | Discord messaging | webhook_url, message | status |
| Document Parser | Extract document text | file_path | parsed_content |
| Google Sheets | Spreadsheet operations | spreadsheet_id, range | data |
| File Upload | Upload files | file_path, destination | upload_url |
| Image Generation | AI image creation | prompt, style | image_path |
| Webhook | HTTP requests | url, method, data | response |

### Data Flow

Data flows between nodes through edges, with automatic type conversion and validation:

```json
{
  "node_id": "unique_identifier",
  "type": "gpt",
  "data": {
    "prompt": "Analyze this document: {{previous_node_output}}",
    "model": "gpt-4"
  },
  "position": {"x": 100, "y": 100}
}
```

## 📋 Examples

### Example 1: Document Analysis Pipeline

```json
{
  "name": "Document Analysis Pipeline",
  "nodes": [
    {
      "id": "upload",
      "type": "file_upload",
      "data": {"destination": "documents/"}
    },
    {
      "id": "parse",
      "type": "document_parser",
      "data": {"file_path": "{{upload.output}}"}
    },
    {
      "id": "analyze",
      "type": "gpt",
      "data": {
        "prompt": "Analyze this document: {{parse.content}}",
        "model": "gpt-4"
      }
    },
    {
      "id": "notify",
      "type": "email",
      "data": {
        "recipient": "team@company.com",
        "subject": "Document Analysis Complete",
        "body": "{{analyze.output}}"
      }
    }
  ],
  "edges": [
    {"source": "upload", "target": "parse"},
    {"source": "parse", "target": "analyze"},
    {"source": "analyze", "target": "notify"}
  ]
}
```

### Example 2: Social Media Content Creation

```json
{
  "name": "Social Media Automation",
  "nodes": [
    {
      "id": "generate_content",
      "type": "gpt",
      "data": {
        "prompt": "Create engaging social media content about AI",
        "model": "gpt-4"
      }
    },
    {
      "id": "create_image",
      "type": "image_generation",
      "data": {
        "prompt": "{{generate_content.output}}",
        "style": "professional"
      }
    },
    {
      "id": "post_social",
      "type": "social_media",
      "data": {
        "platforms": ["twitter", "linkedin"],
        "content": "{{generate_content.output}}",
        "image": "{{create_image.output}}"
      }
    }
  ]
}
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Prepare Environment**
```bash
# Clone repository
git clone https://github.com/SHXZ7/autofloww.git
cd autofloww

# Configure environment
cp .env.example .env
# Edit .env with production values
```

2. **Deploy with Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Setup Reverse Proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Cloud Deployment Options

#### Vercel + Railway
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway
- **Database**: MongoDB Atlas

#### AWS Deployment
- **Frontend**: S3 + CloudFront
- **Backend**: ECS or Lambda
- **Database**: DocumentDB or MongoDB Atlas

#### Google Cloud Platform
- **Frontend**: Cloud Run
- **Backend**: Cloud Run
- **Database**: Firestore or MongoDB Atlas

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

#### Authentication Issues
```bash
# Verify JWT secret
echo $SECRET_KEY

# Check token expiration
# Tokens expire after 30 days by default
```

### Performance Optimization

#### Database Optimization
```javascript
// Add MongoDB indexes
db.workflows.createIndex({ "user_id": 1, "created_at": -1 })
db.executions.createIndex({ "workflow_id": 1, "created_at": -1 })
```

#### Caching Strategy
- Enable Redis for session caching
- Implement workflow result caching
- Use CDN for static assets

### Monitoring and Logging

#### Application Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs
npm run build && npm start
```

#### Performance Monitoring
- Monitor API response times
- Track workflow execution duration
- Monitor memory usage and CPU

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Flow** - For the amazing workflow visualization library
- **FastAPI** - For the high-performance Python web framework
- **MongoDB** - For flexible document storage
- **OpenAI** - For powerful AI model integration
- **Tailwind CSS** - For beautiful, utility-first styling

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/SHXZ7/autofloww/issues)
- **Documentation**: [Full documentation](https://docs.autoflow.com)
- **Community**: [Join our Discord](https://discord.gg/autoflow)
- **Email**: support@autoflow.com

---

<div align="center">

**Built with ❤️ by Mohammed Shaaz**

[⭐ Star this repo](https://github.com/SHXZ7/autofloww) • [🐛 Report bug](https://github.com/SHXZ7/autofloww/issues) • [💡 Request feature](https://github.com/SHXZ7/autofloww/issues)

</div>
