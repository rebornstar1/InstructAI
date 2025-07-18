# InstructAI Deployment Guide

## Issues Fixed

### 1. Redis Repository Configuration Issue
- **Problem**: Spring Boot was trying to configure JPA repositories as Redis repositories
- **Solution**: Added `@SpringBootApplication(exclude = {RedisRepositoriesAutoConfiguration.class})` to exclude Redis repository auto-configuration
- **Files Modified**: `InterviewFeedback.java`

### 2. Database Connection Issues
- **Problem**: Missing default values for database environment variables
- **Solution**: Added fallback values in `application.properties`
- **Files Modified**: `application.properties`

### 3. Missing @Repository Annotations
- **Problem**: Some repository interfaces were missing `@Repository` annotation
- **Solution**: Added `@Repository` annotation to all repository interfaces
- **Files Modified**: `UserRepository.java`, `QuizRepository.java`

### 4. Socket.IO Configuration Warnings
- **Problem**: BeanPostProcessor warnings for SocketIO beans
- **Solution**: Added `@Role(BeanDefinition.ROLE_INFRASTRUCTURE)` and `@Lazy` annotations
- **Files Modified**: `SocketIOConfig.java`

### 5. Environment Variables Configuration
- **Problem**: Missing environment variables for deployment
- **Solution**: Updated `render.yaml` with complete environment variable configuration
- **Files Modified**: `render.yaml`

## Environment Variables Required for Deployment

### Database Configuration
- `SPRING_DATASOURCE_URL`: PostgreSQL connection string
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME`: `org.postgresql.Driver`

### Redis Configuration
- `REDIS_HOST`: Redis server host
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)
- `REDIS_DATABASE`: Redis database index (default: 0)

### Application Configuration
- `SERVER_PORT`: Application server port (default: 8007)
- `SOCKETIO_HOST`: Socket.IO server host (default: 0.0.0.0)
- `SOCKETIO_PORT`: Socket.IO server port (default: 9092)
- `FRONTEND_CLIENT`: Frontend URL for CORS
- `JWT_SECRET`: JWT signing secret (generate a secure random string)
- `JWT_EXPIRATION`: JWT expiration time in milliseconds (default: 86400000)
- `GEMINI_API_KEY`: Google Gemini API key

## Deployment Steps

### 1. Local Development
```bash
# Set environment variables
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/instructai_db
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your_password
# ... other environment variables

# Run the application
./mvnw spring-boot:run
```

### 2. Docker Deployment
```bash
# Build Docker image
docker build -t instructai-server .

# Run with environment variables
docker run -p 8007:8007 -p 9092:9092 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/instructai_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=password \
  # ... other environment variables
  instructai-server
```

### 3. Render.com Deployment
1. Push code to GitHub
2. Connect repository to Render
3. Use the provided `render.yaml` configuration
4. Render will automatically create:
   - PostgreSQL database
   - Redis instance
   - Web service with proper environment variables

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- **Error**: `Unable to open JDBC Connection for DDL execution`
- **Solution**: Verify database credentials and connection string
- **Check**: Ensure PostgreSQL is running and accessible

#### 2. Redis Repository Configuration
- **Error**: `Could not safely identify store assignment for repository`
- **Solution**: Ensure `RedisRepositoriesAutoConfiguration` is excluded in main application class

#### 3. Bean Creation Errors
- **Error**: `Error creating bean with name 'userRepository'`
- **Solution**: Verify all repository interfaces have `@Repository` annotation

#### 4. Socket.IO Warnings
- **Error**: `Bean 'socketIOConfig' is not eligible for getting processed by all BeanPostProcessors`
- **Solution**: Add `@Role(BeanDefinition.ROLE_INFRASTRUCTURE)` to SocketIO configuration

### Health Check
Access `http://localhost:8007/actuator/health` to verify application health

### Logs
Check application logs for detailed error information:
```bash
# Docker logs
docker logs <container_id>

# Render logs
View in Render dashboard
```

## Configuration Files

### Key Configuration Files:
- `application.properties`: Default configuration with fallback values
- `application-prod.properties`: Production-specific configuration
- `render.yaml`: Render.com deployment configuration
- `Dockerfile`: Docker containerization setup

## Database Schema
The application uses JPA with `spring.jpa.hibernate.ddl-auto=update` to automatically create/update database schema.

## Security
- JWT authentication enabled
- CORS configured for frontend URL
- Redis password protection (if configured)

## Monitoring
- Actuator endpoints enabled for health checks
- Prometheus metrics available at `/actuator/metrics`
- Application logs with structured logging levels
