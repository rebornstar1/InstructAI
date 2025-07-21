# InstructAI

**InstructAI** is a comprehensive AI-powered educational platform that revolutionizes learning through personalized course generation, interactive content delivery, and intelligent progress tracking. The platform combines a modern React/Next.js frontend with a robust Spring Boot backend to deliver adaptive learning experiences.

---

## Video Preview

[![InstructAI Demo](thumbnail.png)](https://www.loom.com/share/9a87f9f1cd2d479f8b34151b90fbcbde)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Technologies Used](#technologies-used)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Overview

**InstructAI** is an intelligent educational platform that leverages AI to create personalized learning experiences. The platform automatically generates courses, tracks student progress, and adapts content delivery based on individual learning patterns.

### Core Capabilities:
- **AI-Powered Course Generation:** Automatically creates comprehensive courses using Google Gemini AI
- **Interactive Learning:** Real-time chat interface with voice recognition and synthesis
- **Progress Tracking:** Detailed analytics and achievement systems
- **Multimedia Content:** Integrated video content, quizzes, and interactive exercises
- **Personalized Learning Paths:** Adaptive content based on user preferences and performance
- **Real-time Communication:** Socket.IO powered chat and collaboration features

---

## Key Features

### 🤖 AI-Powered Education
- **Dynamic Course Creation:** Generate courses on any topic using advanced AI prompts
- **Interactive Course Builder:** Multi-stage questionnaire for personalized course customization
- **Content Generation:** Automatic creation of modules, quizzes, and learning resources
- **Smart Content Adaptation:** AI adjusts content based on learning preferences

### 📚 Learning Management
- **Module-based Learning:** Structured content delivery with prerequisites
- **Progress Tracking:** Real-time progress monitoring with detailed analytics
- **Achievement System:** Gamified learning with achievements and milestones
- **Content Completion:** Track articles, videos, and quiz completions

### 🎥 Multimedia Integration
- **Video Learning:** YouTube integration with timed quizzes
- **Interactive Quizzes:** Multiple choice, fill-in-the-blank, and subjective questions
- **Visual Aids:** Dynamic content adjustment based on confusion levels
- **Speech Integration:** Voice-to-text and text-to-speech capabilities

### 👥 Social Learning
- **Real-time Chat:** Socket.IO powered messaging system
- **Community Features:** Discussion threads and collaborative learning
- **User Profiles:** Comprehensive user management with preferences

---

## Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│  (Spring Boot)  │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React 18      │    │ • REST APIs     │    │ • Google Gemini │
│ • Context API   │    │ • WebSockets    │    │ • YouTube API   │
│ • Tailwind CSS  │    │ • Spring Data   │    │ • PostgreSQL    │
│ • Framer Motion │    │ • Spring Cache  │    │ • Redis         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Backend Architecture
- **Spring Boot 3.x** - Main application framework
- **Spring Data JPA** - Database access and ORM
- **Spring Security** - JWT-based authentication
- **Spring Cache** - Redis-based caching strategy
- **Socket.IO** - Real-time communication
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

### Frontend Architecture
- **Next.js 14** - React framework with SSR support
- **React Context** - State management for progress tracking
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation and transitions
- **Axios** - HTTP client for API communication

---

## Project Structure

```
InstructAI/
├── client/                          # Frontend Next.js Application
│   ├── app/                         # Next.js 14 App Router
│   ├── components/                  # Reusable UI components
│   │   ├── AITutor.js              # Main AI tutor interface
│   │   ├── ChatInterface.js        # Real-time chat component
│   │   ├── Learn.js                # Learning interface
│   │   ├── QuestionDialog.js       # Interactive quiz modals
│   │   └── YoutubeGenerator.js     # Video integration
│   ├── context/                     # React Context providers
│   │   └── ProgressContext.jsx     # Progress tracking state
│   ├── hooks/                       # Custom React hooks
│   │   ├── useSpeechRecognition.js # Voice input handling
│   │   └── useSpeechSynthesis.js   # Text-to-speech
│   ├── lib/                        # Utility libraries
│   ├── services/                   # API service layers
│   └── public/                     # Static assets
│
├── server/                         # Backend Spring Boot Application
│   ├── src/main/java/              # Java source code
│   │   └── com/screening/interviews/
│   │       ├── config/             # Configuration classes
│   │       ├── controller/         # REST API controllers
│   │       ├── dto/               # Data Transfer Objects
│   │       ├── model/             # JPA Entity models
│   │       ├── prompts/           # AI prompt templates
│   │       ├── repo/              # Repository interfaces
│   │       ├── security/          # Security configuration
│   │       └── service/           # Business logic services
│   ├── src/main/resources/        # Configuration files
│   │   ├── application.properties
│   │   └── application-prod.properties
│   ├── docker-compose.yml         # Local development setup
│   ├── Dockerfile                 # Container configuration
│   ├── pom.xml                    # Maven dependencies
│   └── render.yaml                # Deployment configuration
│
├── Documentation.md               # API and service documentation
├── DEPLOYMENT_GUIDE.md           # Deployment instructions
└── README.md                     # This file
```

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Java** (17 or higher)
- **Maven** (3.6 or higher)
- **PostgreSQL** (12 or higher)
- **Redis** (6 or higher)

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/InstructAI.git
   cd InstructAI
   ```

2. **Database Setup:**
   ```bash
   # Create PostgreSQL database
   createdb instructai_db
   ```

3. **Configure Environment Variables:**
   ```bash
   # Create .env file in server directory
   cp server/.env.example server/.env
   ```

4. **Install and Run Backend:**
   ```bash
   cd server
   ./mvnw spring-boot:run
   ```

### Frontend Setup

1. **Install Dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Configure Environment:**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

### Docker Setup (Alternative)

```bash
# Run complete stack with Docker
cd server
docker-compose up -d
```

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/instructai_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8007
NEXT_PUBLIC_SOCKET_URL=http://localhost:9092
```

### Key Configuration Files
- [`server/application.properties`](server/src/main/resources/application.properties) - Spring Boot configuration
- [`client/next.config.mjs`](client/next.config.mjs) - Next.js configuration
- [`server/docker-compose.yml`](server/docker-compose.yml) - Local development setup

---

## API Documentation

### Core Endpoints

#### Course Management
- `POST /api/courses` - Generate new course
- `GET /api/courses/{id}` - Get course details
- `PUT /api/courses/{id}` - Update course
- `GET /api/courses/user/{userId}` - Get user courses

#### Learning Resources
- `POST /api/learning-resources/generate` - Generate learning content
- `GET /api/modules/{id}/content` - Get module content
- `POST /api/modules/{id}/quiz` - Generate quiz for module

#### Progress Tracking
- `POST /api/progress/start-module` - Start module progress
- `POST /api/progress/complete-content` - Mark content as completed
- `GET /api/progress/user/{userId}` - Get user progress summary

#### Interactive Course Creation
- `POST /api/interactive-courses/stage1` - First customization stage
- `POST /api/interactive-courses/stage2` - Second customization stage
- `POST /api/interactive-courses/stage3` - Final customization stage
- `POST /api/interactive-courses/generate` - Generate final course

For detailed API documentation, see [`Documentation.md`](server/Documentation.md).

---

## Usage

### Creating a Course

1. **Interactive Course Builder:**
   - Navigate to course creation
   - Answer personalization questions
   - AI generates customized course structure

2. **Direct Course Generation:**
   ```javascript
   const courseData = {
     topic: "Machine Learning",
     difficultyLevel: "Intermediate",
     preferences: {...}
   };
   ```

### Learning with Progress Tracking

```jsx
// Using ModuleProgress component
import { ModuleProgress } from './context/ProgressContext';

<ModuleProgress 
  moduleId="M1" 
  moduleData={moduleData}
  onProgressUpdate={handleProgress}
  onModuleCompleted={handleCompletion}
>
  {/* Your learning content */}
</ModuleProgress>
```

### Real-time Features

- **Chat Interface:** Real-time messaging with AI tutors
- **Voice Integration:** Speech-to-text and text-to-speech
- **Video Learning:** YouTube integration with timed quizzes
- **Progress Sync:** Real-time progress updates across devices

---

## Technologies Used

### Frontend
- **Framework:** Next.js 14 with App Router
- **UI Library:** Custom components with Tailwind CSS
- **State Management:** React Context API
- **Animations:** Framer Motion
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Speech:** Web Speech API integration

### Backend
- **Framework:** Spring Boot 3.x
- **Database:** PostgreSQL with Spring Data JPA
- **Caching:** Redis with Spring Cache
- **Security:** Spring Security with JWT
- **AI Integration:** Google Gemini API
- **Real-time:** Socket.IO Java
- **Build Tool:** Maven

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Deployment:** Render.com ready
- **Monitoring:** Spring Actuator with health checks
- **Testing:** JUnit 5, MockMvc

---

## Deployment

### Production Deployment

1. **Using Render.com:**
   ```bash
   # Configure render.yaml
   # Push to GitHub
   # Connect to Render.com
   ```

2. **Docker Deployment:**
   ```bash
   # Build and deploy with Docker
   docker build -t instructai-server .
   docker run -p 8007:8007 instructai-server
   ```

3. **Manual Deployment:**
   ```bash
   # Backend
   ./mvnw clean package
   java -jar target/instructai-server.jar
   
   # Frontend
   npm run build
   npm start
   ```

For detailed deployment instructions, see [`DEPLOYMENT_GUIDE.md`](server/DEPLOYMENT_GUIDE.md).

---

## Testing

### Backend Testing
```bash
cd server

# Unit tests
./mvnw test

# Integration tests
./mvnw integration-test

# All tests with coverage
./mvnw verify
```

### Test Coverage
- Unit tests for service layer
- Integration tests for repositories
- Controller tests with MockMvc
- Security and authentication tests

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Process
1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests for new functionality**
5. **Commit your changes:**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Standards
- Follow Spring Boot best practices for backend
- Use React/Next.js conventions for frontend
- Write comprehensive tests
- Document API changes
- Use meaningful commit messages

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

### Documentation
- **API Documentation:** [`Documentation.md`](server/Documentation.md)
- **Deployment Guide:** [`DEPLOYMENT_GUIDE.md`](server/DEPLOYMENT_GUIDE.md)
- **Server README:** [`server/README.md`](server/README.md)

### Contact & Support
- **Email:** [paulsanjaym@gmail.com](mailto:paulsanjaym@gmail.com)
- **GitHub:** [https://github.com/rebornstar1](https://github.com/rebornstar1)
- **Issues:** [Create an issue](https://github.com/your-username/InstructAI/issues)

### Health Monitoring
- **Health Check:** `GET /actuator/health`
- **Metrics:** `GET /actuator/metrics`
- **Info:** `GET /actuator/info`

---

## Acknowledgments

- **AI Integration:** Google Gemini API for intelligent content generation
- **Frameworks:** Spring Boot and Next.js communities
- **UI Components:** Tailwind CSS and Framer Motion
- **Real-time Communication:** Socket.IO team
- **Contributors:** All contributors who helped build this platform

---

*InstructAI - Revolutionizing education through AI-powered personalized learning experiences.*
