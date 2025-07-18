# InstructAI Server

A Spring Boot application providing AI-powered educational features with real-time communication capabilities.

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Local Development

#### Option 1: Using Docker Compose (Recommended)
```bash
# Windows
./start.bat

# Linux/macOS
chmod +x start.sh
./start.sh
```

#### Option 2: Manual Setup
```bash
# Start dependencies
docker-compose up -d postgres redis

# Set environment variables
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/instructai_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=password
# ... (see Environment Variables section)

# Run application
./mvnw spring-boot:run
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string | `jdbc:postgresql://localhost:5432/instructai_db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `password` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | `` |
| `SERVER_PORT` | Application server port | `8007` |
| `SOCKETIO_PORT` | Socket.IO server port | `9092` |
| `JWT_SECRET` | JWT signing secret | `yourSecretKeyHereShouldBeVeryLongAndSecure` |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `FRONTEND_CLIENT` | Frontend URL for CORS | `http://localhost:3000` |

### Configuration Files
- `application.properties`: Default configuration with fallbacks
- `application-prod.properties`: Production-specific settings
- `docker-compose.yml`: Local development setup
- `render.yaml`: Render.com deployment configuration

## 🏗️ Architecture

### Core Components
- **Spring Boot**: Main application framework
- **Spring Data JPA**: Database access layer
- **Spring Security**: Authentication and authorization
- **Spring Cache**: Redis-based caching
- **Socket.IO**: Real-time communication
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage

### Key Features
- AI-powered course generation using Google Gemini
- Real-time chat and collaboration
- User progress tracking
- JWT-based authentication
- Comprehensive caching strategy
- Health monitoring with Spring Actuator

## 📊 API Endpoints

### Core Endpoints
- `GET /actuator/health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/courses` - Course listing
- `POST /api/courses` - Course creation
- `GET /api/users/profile` - User profile
- `GET /api/threads` - Community threads

### Real-time Features
- Socket.IO endpoint: `ws://localhost:9092`
- Real-time chat messaging
- Live progress updates
- Collaborative features

## 🔧 Development

### Project Structure
```
src/
├── main/
│   ├── java/
│   │   └── com/screening/interviews/
│   │       ├── config/          # Configuration classes
│   │       ├── controller/      # REST controllers
│   │       ├── dto/            # Data transfer objects
│   │       ├── model/          # JPA entities
│   │       ├── repo/           # Repository interfaces
│   │       ├── security/       # Security configuration
│   │       └── service/        # Business logic
│   └── resources/
│       ├── application.properties
│       └── application-prod.properties
└── test/                       # Unit and integration tests
```

### Key Configuration Classes
- `InterviewFeedback.java`: Main application class
- `SecurityConfig.java`: Security configuration
- `RedisConfig.java`: Redis configuration
- `SocketIOConfig.java`: Socket.IO configuration
- `WebClientConfig.java`: HTTP client configuration

### Database Schema
The application uses JPA entities with automatic schema generation:
- `User`: User profiles and authentication
- `Course`: Course definitions
- `Module`: Course modules
- `Thread`: Community discussion threads
- `Message`: Chat messages
- `UserProgress`: Progress tracking

## 🧪 Testing

### Run Tests
```bash
# Unit tests
./mvnw test

# Integration tests
./mvnw integration-test

# All tests
./mvnw verify
```

### Test Coverage
- Unit tests for service layer
- Integration tests for repositories
- Controller tests with MockMvc
- Security tests

## 🚢 Deployment

### Local Deployment
```bash
# Development mode
./start.sh --mode dev

# Production mode
./start.sh --mode prod --rebuild
```

### Docker Deployment
```bash
# Build image
docker build -t instructai-server .

# Run container
docker run -p 8007:8007 -p 9092:9092 instructai-server
```

### Render.com Deployment
1. Fork/clone the repository
2. Connect to Render.com
3. Use the provided `render.yaml` configuration
4. Deploy automatically with environment variables

### Production Considerations
- Use strong JWT secrets
- Enable HTTPS
- Configure proper CORS origins
- Set up database backups
- Monitor application metrics
- Configure log aggregation

## 📈 Monitoring

### Health Checks
- Application health: `/actuator/health`
- Database connectivity check
- Redis connectivity check
- Custom health indicators

### Metrics
- Prometheus metrics: `/actuator/metrics`
- JVM metrics
- Database connection pool metrics
- Cache hit/miss ratios
- Custom business metrics

### Logging
- Structured logging with logback
- Configurable log levels
- Request/response logging
- Error tracking and alerting

## 🔒 Security

### Authentication
- JWT-based authentication
- Configurable token expiration
- Secure password hashing with BCrypt

### Authorization
- Role-based access control
- Method-level security
- Resource-based permissions

### Security Headers
- CORS configuration
- CSRF protection
- Security headers middleware

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Unable to open JDBC Connection for DDL execution
Solution: Check database credentials and ensure PostgreSQL is running
```

#### Redis Connection Issues
```
Error: Could not connect to Redis
Solution: Verify Redis server is running and credentials are correct
```

#### Repository Configuration Errors
```
Error: Could not safely identify store assignment for repository
Solution: Ensure RedisRepositoriesAutoConfiguration is excluded
```

### Debug Mode
```bash
# Enable debug logging
export LOGGING_LEVEL_COM_SCREENING_INTERVIEWS=DEBUG
./mvnw spring-boot:run
```

### Performance Tuning
- Database connection pool sizing
- Redis cache TTL configuration
- JVM heap settings
- Thread pool configuration

## 📚 Documentation

### API Documentation
- Swagger UI: `/swagger-ui.html` (when enabled)
- OpenAPI spec: `/v3/api-docs`

### Additional Resources
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [Redis Documentation](https://redis.io/documentation)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🤝 Contributing

### Development Guidelines
1. Follow Spring Boot best practices
2. Write comprehensive tests
3. Document API changes
4. Update configuration examples
5. Test deployment scenarios

### Code Style
- Use Spring Boot conventions
- Follow Java naming conventions
- Add proper JavaDoc comments
- Use meaningful variable names

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Check the troubleshooting guide
- Review application logs
- Check GitHub issues
- Contact the development team

---

**Made with ❤️ by the InstructAI Team**
