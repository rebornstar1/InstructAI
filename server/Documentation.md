## 1. Course Generation API

### Endpoint

**POST** `/api/courses/simplified/generate`

### Description

Generates a course structure based on the user-specified topic, difficulty level, and module count. The response includes course metadata (title, description, difficulty level, prerequisites) and a list of modules with dummy data.

### Request Body

- **topic**: *String* — The subject or topic for which the course is to be generated.
- **difficultyLevel**: *String* — The intended difficulty level (e.g., "Beginner", "Intermediate", "Advanced").
- **moduleCount**: *int* — The number of modules to generate.

**Example:**

```json
{
  "topic": "Machine Learning",
  "difficultyLevel": "Intermediate",
  "moduleCount": 4
}
```

### Response

Returns a JSON object of type `CourseResponseDto`:

- **courseMetadata**:
    - **title**: *String* — The course title.
    - **description**: *String* — A short description of the course.
    - **difficultyLevel**: *String* — The difficulty level.
    - **prerequisites**: *List&lt;String&gt;* — A list of prerequisites.
- **modules**: A list of `ModuleDto` objects where each module contains:
    - **moduleId**: *String* — Identifier for the module.
    - **title**: *String* — Title of the module.
    - **description**: *String* — A description of the module.
    - **duration**: *String* — Estimated duration (e.g., "45 minutes").
    - **learningObjectives**: *List&lt;String&gt;* — Key learning objectives for the module.

**Example:**

```json
{
  "courseMetadata": {
    "title": "Learn Machine Learning",
    "description": "A comprehensive course on Machine Learning.",
    "difficultyLevel": "Intermediate",
    "prerequisites": [
      "Basic understanding of Machine Learning"
    ]
  },
  "modules": [
    {
      "moduleId": "1",
      "title": "Module 1 on Machine Learning",
      "description": "Detailed content for module 1.",
      "duration": "45 minutes",
      "learningObjectives": [
        "Understand key concepts",
        "Apply techniques"
      ]
    },
    {
      "moduleId": "2",
      "title": "Module 2 on Machine Learning",
      "description": "Detailed content for module 2.",
      "duration": "45 minutes",
      "learningObjectives": [
        "Understand key concepts",
        "Apply techniques"
      ]
    }
    // ... additional modules
  ]
}
```

### HTTP Status

- **200 OK** — Course generated successfully.

---

## 2. Learning Resource Generation API

### Endpoint

**POST** `/api/learning-resources/generate`

### Description

Generates detailed learning resources for a given module or concept. The response contains detailed content (e.g. markdown), an optional transcript, and a video URL for the generated resource.

### Request Body

- **moduleTitle**: *String* — Title of the module for which resources are being generated.
- **conceptTitle**: *String* (optional) — Title of the specific concept (if generating resource for a particular concept).
- **format**: *String* — Output format (e.g., "markdown").
- **contentType**: *String* — Type of content, e.g., "technical" or "comprehensive".
- **detailLevel**: *int* — Level of detail required.
- **specificRequirements**: *List&lt;String&gt;* — A list of specific requirements (e.g., include tables, code examples, mathematical notation).

**Example:**

```json
{
  "moduleTitle": "Module 1 on Machine Learning",
  "conceptTitle": "Neural Networks",
  "format": "markdown",
  "contentType": "technical",
  "detailLevel": 4,
  "specificRequirements": [
    "Include detailed explanations with examples",
    "Add tables for comparing related concepts",
    "Include mathematical notation where appropriate",
    "Format code examples with syntax highlighting"
  ]
}
```

### Response

Returns a JSON object of type `LearningResourceDto`:

- **conceptTitle**: *String* — The title of the concept or module.
- **moduleTitle**: *String* — The module title.
- **content**: *String* — Generated learning content (in markdown).
- **transcript**: *String* — Transcript for video content.
- **videoUrl**: *String* — URL for the generated video resource.

**Example:**

```json
{
  "conceptTitle": "Neural Networks",
  "moduleTitle": "Module 1 on Machine Learning",
  "content": "## Detailed Learning Resource\n\nThis is the generated content for Neural Networks",
  "transcript": "This is the transcript for the video explaining Neural Networks",
  "videoUrl": "http://example.com/videos/Neural-Networks"
}
```

### HTTP Status

- **200 OK** — Learning resource generated successfully.

---

## 3. Service Layer Documentation

### CourseService

- **Method:** `CourseResponseDto generateCourse(CourseRequestDto request)`

  **Description:**  
  Generates a course structure based on the user prompt. Dummy data is currently used for demonstration. In production, this method could call GeminiClient for dynamic content generation.

  **Input:**
    - `CourseRequestDto` with `topic`, `difficultyLevel`, and `moduleCount`.

  **Output:**
    - `CourseResponseDto` containing a `CourseMetadataDto` and a list of `ModuleDto` objects.

### LearningResourceService

- **Method:** `LearningResourceDto generateLearningResource(LearningResourceRequestDto request)`

  **Description:**  
  Generates detailed learning resources (content, transcript, video URL) for a specific module or concept. Currently returns dummy content.

  **Input:**
    - `LearningResourceRequestDto` with fields such as `moduleTitle`, `conceptTitle`, `format`, `contentType`, `detailLevel`, and `specificRequirements`.

  **Output:**
    - `LearningResourceDto` with generated content details.

---

## 4. Gemini Client Integration

A **GeminiClient** (configured via Spring’s WebClient) is used to integrate with an external generative language API. The client is configured in the application using properties defined in `application.properties`:

- **Properties:**
    - `gemini.api.base-url`: Base URL of the Gemini API.
    - `gemini.api.key`: API key for authenticating requests.

The **WebClient** is configured in `WebClientConfig` so that every request includes the required headers.

---

## 5. Example Usage

### Course Generation Request

```bash
curl -X POST "http://<server>:<port>/api/courses/simplified/generate" \
     -H "Content-Type: application/json" \
     -d '{
           "topic": "Machine Learning",
           "difficultyLevel": "Intermediate",
           "moduleCount": 4
         }'
```

### Learning Resource Generation Request

```bash
curl -X POST "http://<server>:<port>/api/learning-resources/generate" \
     -H "Content-Type: application/json" \
     -d '{
           "moduleTitle": "Module 1 on Machine Learning",
           "conceptTitle": "Neural Networks",
           "format": "markdown",
           "contentType": "technical",
           "detailLevel": 4,
           "specificRequirements": [
             "Include detailed explanations with examples",
             "Add tables for comparing related concepts",
             "Include mathematical notation where appropriate",
             "Format code examples with syntax highlighting"
           ]
         }'
```