# AI Tutor

**AI Tutor** is an interactive educational platform that combines an AI-driven chat interface with multimedia visual aids, real-time speech recognition, and interactive quizzes. It is designed to provide a comprehensive learning experience by dynamically adjusting content based on user feedback and confusion levels.

---

## Video Preview

[![Instruct AI]](https://drive.google.com/file/d/1pIp4iR7n02-KN9YoGW53ZsLEmNVUHs7b/view)


## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
  - [AITutor Component](#aitutor-component)
  - [Learn Component](#learn-component)
  - [Chat Interface](#chat-interface)
  - [Interactive Question Modals](#interactive-question-modals)
  - [YouTube Integration](#youtube-integration)
  - [Speech Recognition & Synthesis](#speech-recognition--synthesis)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Overview

The **AI Tutor** project is built with React and Next.js, and it integrates several key functionalities:
- **AI Chat Interface:** Users interact with an AI tutor that can respond both in text and via audio.
- **Visual Aids:** Dynamic video content (using YouTube embeds) supplements the learning process.
- **Interactive Quizzes:** Users are periodically presented with questions (MCQ, fill-in-the-blank, or subjective) to test their knowledge.
- **Voice Control:** The project leverages custom hooks for speech recognition and speech synthesis to allow voice-based interaction.
- **Modern UI & Animations:** Built using UI components (cards, buttons, dialogs) with smooth animations powered by Framer Motion.

---

## Features

- **AI-Powered Chatbot:** Provides personalized responses and explanations.
- **Dynamic Visual Content:** Fetches and displays relevant video content based on user interaction and confusion levels.
- **Interactive Quizzes:** Engages users with questions to assess and reinforce learning.
- **Voice Interactions:** Supports both voice-to-text and text-to-speech for an immersive experience.
- **YouTube Integration:** Offers a dedicated interface for video playback, timed questions, and video previews.
- **Responsive Design:** Fully responsive and dark mode ready.

---

## Project Structure

```
ai-tutor/
├── components/
│   ├── AITutor.js               # Main component integrating header, chat interface, visual aid, and question modal.
│   ├── ChatInterface.js         # Chat UI component handling user-AI conversation.
│   ├── QuestionDialog.js        # Modal component for interactive quizzes.
│   ├── Learn.js                 # Learning interface with integrated video, chat, and interactive questions.
│   ├── YoutubeGenerator.js      # Component for YouTube video playback with timed quizzes.
│   ├── YouTubePreviewDialog.js  # Component to fetch and display YouTube video previews.
│   ├── Header.js                # Header component.
│   ├── Footer.js                # Footer component.
│   └── VisualAidSection.js      # Displays video content and confusion level.
│
├── hooks/
│   ├── useSpeechRecognition.js  # Custom hook for managing speech recognition.
│   └── useSpeechSynthesis.js      # Custom hook for managing text-to-speech.
│
├── pages/
│   ├── index.js                 # Application entry point.
│   └── learn.js                 # Route for the Learn interface.
│
├── public/
│   └── assets/                  # Static assets (images, icons, etc.).
│
├── package.json                 # Project metadata and dependencies.
└── README.md                    # This documentation.
```

---

## Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/ai-tutor.git
   cd ai-tutor
   ```

2. **Install Dependencies:**

   Using npm:

   ```bash
   npm install
   ```

   Or with yarn:

   ```bash
   yarn install
   ```

3. **Run the Development Server:**

   ```bash
   npm run dev
   ```
   or
   ```bash
   yarn dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to view the project.

---

## Usage

### AITutor Component

- **Description:**  
  The `AITutor` component is the heart of the application. It integrates:
  - A header and footer for consistent navigation.
  - A **Chat Interface** where the user can send messages and receive responses from the AI.
  - A **Visual Aid Section** that displays videos related to the subject matter and adjusts content based on a computed confusion level.
  - A **Question Modal** that pops up for interactive quizzes.

- **Key Functionalities:**
  - **State Management:** Utilizes React’s `useState` to manage messages, video URLs, confusion levels, and modal states.
  - **Speech Hooks:** Integrates custom hooks (`useSpeechRecognition` and `useSpeechSynthesis`) to support voice commands and audio responses.
  - **Dynamic Video Loading:** When the system detects a high confusion level (simulated with a random threshold), it fetches a relevant video to aid learning.

### Learn Component

- **Description:**  
  The `Learn` component is an enhanced learning interface that combines:
  - A dynamic chat interface with voice recognition.
  - A video player with play/pause controls and real-time progress tracking.
  - An integrated question generator that presents interactive quizzes to test knowledge.

- **Key Functionalities:**
  - **Voice Controls:** Buttons to toggle listening (for speech recognition) and mute/unmute audio responses.
  - **Video Controls:** Embedded video player (YouTube) with overlaid control buttons.
  - **Quiz Integration:** Randomized questions are generated to test user understanding and provide instant feedback.

### Chat Interface

- **Description:**  
  The `ChatInterface` component handles the conversation between the user and the AI. It features:
  - Smooth animations for new messages using Framer Motion.
  - User-friendly input fields for both text and voice.
  - Icons to distinguish between user messages and AI responses.

- **Highlights:**
  - **Message Animation:** Each new message animates into view.
  - **Speech Synthesis:** Highlights key parts of AI messages during audio playback.

### Interactive Question Modals

- **Description:**  
  The project includes components like `QuestionDialog` (or `QuestionModal`) that display quiz questions in a modal dialog.
  
- **Question Types:**
  - **Multiple Choice (MCQ):** Presents several options for the user to choose from.
  - **Subjective / Fill-in-the-Blank:** Requires the user to type an answer.
  
- **Feedback:**  
  After submission, the modal provides instant feedback, indicating whether the answer was correct. The modal automatically closes after a brief delay.

### YouTube Integration

#### YoutubeGenerator

- **Description:**  
  This component embeds a YouTube video and integrates a time-based quiz system. As the video plays, the system:
  - Monitors the current playback time.
  - Pauses the video and triggers a quiz when a predefined timestamp is reached.
  - Resumes playback after the user answers correctly.

- **Key Features:**
  - **Timed Questions:** Questions are linked to specific timestamps.
  - **Progress Indicator:** A progress bar shows the current playback status.
  - **Responsive Controls:** Includes play/pause buttons with real-time feedback.

#### YouTubePreviewDialog

- **Description:**  
  This component fetches video previews from a backend API and displays them in a dialog.
  
- **Key Features:**
  - **API Integration:** Uses Axios to fetch video data from a specified backend endpoint.
  - **Animated Previews:** Video thumbnails are presented with hover animations.
  - **Error & Loading States:** Gracefully handles loading and error scenarios.

### Speech Recognition & Synthesis

- **useSpeechRecognition:**  
  A custom hook that:
  - Listens continuously for voice input.
  - Transcribes speech to text and updates the input field accordingly.

- **useSpeechSynthesis:**  
  A custom hook that:
  - Converts text responses into audio.
  - Provides options to toggle mute/unmute, and highlights text during playback.

---

## Dependencies

- **React & Next.js:** For building the user interface and routing.
- **axios:** For making HTTP requests to fetch YouTube previews and other data.
- **Framer Motion:** For smooth animations and transitions.
- **react-youtube:** For embedding and controlling YouTube videos.
- **lucide-react:** Icon library for modern, scalable icons.
- **Custom UI Components:** (Button, Input, Card, Dialog, etc.)—these may be sourced from a UI library like ShadCN/UI or a similar system.

---

## Contributing

Contributions are very welcome! If you’d like to improve the project, please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Commit Your Changes:**
   ```bash
   git commit -am "Add some feature"
   ```
4. **Push to Your Branch:**
   ```bash
   git push origin feature/my-feature
   ```
5. **Open a Pull Request**

---

## Acknowledgements

- **Open Source Tools:** Special thanks to the communities behind [React](https://reactjs.org/), [Next.js](https://nextjs.org/), [Framer Motion](https://www.framer.com/motion/), [react-youtube](https://github.com/troybetz/react-youtube), and [lucide-react](https://github.com/lucide-icons/lucide).
- **Contributors:** A big thank you to all contributors who helped build and improve this project.

---

## Contact

For questions, suggestions, or collaboration, please contact:  
**Email:** [paulsanjaym@gmail.com]  
**GitHub:** [https://github.com/rebornstar1](https://github.com/rebornstar1)

---

*This documentation is intended to help developers understand the architecture and functionalities of the AI Tutor project. Feel free to reach out with any suggestions or improvements!*