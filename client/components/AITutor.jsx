import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import ChatInterface from './ChatInterface';
import VisualAidSection from './VisualAidSection';
import QuestionModal from './QuestionModal';
import Footer from './Footer';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const AITutor = ({ subject, learningMethod }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your AI tutor. What would you like to learn today?", highlightedText: '' }
  ]);
  const [videoUrl, setVideoUrl] = useState('');
  const [confusionLevel, setConfusionLevel] = useState(0);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const { isListening, toggleListening, transcript } = useSpeechRecognition();
  const { isSpeaking, isMuted, toggleMute, speak } = useSpeechSynthesis();

  // ... (other state and logic)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-1 py-12 px-8">
        <div className="container mx-auto grid gap-6 lg:grid-cols-2">
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            isListening={isListening}
            toggleListening={toggleListening}
            isMuted={isMuted}
            toggleMute={toggleMute}
            speak={speak}
          />
          <VisualAidSection
            videoUrl={videoUrl}
            confusionLevel={confusionLevel}
            triggerQuestion={() => setIsQuestionModalOpen(true)}
          />
        </div>
      </main>
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
      />
      <Footer />
    </div>
  );
};

export default AITutor;