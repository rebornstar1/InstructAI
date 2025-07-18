FROM maven:3.8.5-openjdk-21-slim AS build
COPY . .
RUN mvn clean package -DskipTests

FROM openjdk:21-jdk-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the JAR file
COPY --from=build /target/*.jar app.jar

# Add health check with dynamic port
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/actuator/health || exit 1

# Expose the port that Render assigns
EXPOSE $PORT

# Set JVM options for better performance
ENV JAVA_OPTS="-Xmx512m -Xms256m -Dspring.profiles.active=prod"

# Start the application with dynamic port
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]