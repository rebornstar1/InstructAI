'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Brain, Send, PlayCircle, PauseCircle, User, Mic, Volume2, VolumeX, BookOpen, Star } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import Link from "next/link"
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import YouTubePreviewDialog from '@/components/YouTubePreviewDialog'
import YoutubeGenerator from '@/components/YoutubeVideoGenn'


const Learn = ({subject, learningMethod}) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I'm your AI tutor. What would you like to learn today?", highlightedText: '' }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [isPlaying, setIsPlaying] = useState(false);
  const [confusionLevel, setConfusionLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const chatContainerRef = useRef(null);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  var totalXP = 350;
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const newMessages = [
      ...messages,
      { role: 'user', content: inputMessage }
    ];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(async () => {
      setIsTyping(false);
      const aiResponse = generateAIResponse(inputMessage);

      const updatedMessages = [
        ...newMessages,
        { role: 'ai', content: aiResponse, highlightedText: '' }
      ];

      setMessages(updatedMessages);

      // Simulate confusion detection
      const newConfusionLevel = Math.random();
      setConfusionLevel(newConfusionLevel);

      if (newConfusionLevel > 0.7) {
        // If confusion is high, fetch a relevant video
        fetchRelevantVideo(inputMessage);
      }

      speakResponse(aiResponse, updatedMessages.length - 1);
    }, 1500);
  };

  const generateAIResponse = (userMessage) => {
    // This is a simplified AI response generation.
    // In a real application, this would involve calling an AI service.
    const responses = [
      `That's an interesting question about ${subject}. Let's explore it further.`,
      `Great! I'll explain that concept in a way that combines text and visual learning.`,
      `To understand this better, let's break it down into smaller parts and use some video examples.`,
      `Here's an explanation, and I'll find a video that might help illustrate this concept.`,
      `Based on what we've discussed so far, can you try to explain this back to me? If you're unsure, we can watch a related video.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const fetchRelevantVideo = (topic) => {
    // This is a mock function to simulate fetching a relevant video.
    // In a real application, you would integrate with YouTube's API.
    const mockVideos = [
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/jNQXAC9IVRw',
      'https://www.youtube.com/embed/8jfYSdKX-6Y'
    ];
    const randomVideo = mockVideos[Math.floor(Math.random() * mockVideos.length)];
    setVideoUrl(randomVideo);
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakResponse = (text, messageIndex) => {
    if (synthRef.current && !isMuted) {
      synthRef.current.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // setHighlightedText('');
        setHighlightIndex(0);
      };
      utterance.onboundary = (event) => {
        const word = text.substring(event.charIndex, event.charIndex + event.charLength);
        setMessages(prevMessages =>
          prevMessages.map((msg, index) =>
            index === messageIndex ? { ...msg, highlightedText: msg.highlightedText + word + " " } : msg
          )
        );
        setHighlightIndex(prevIndex => prevIndex + 1);
      };
      synthRef.current.speak(utterance);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      synthRef.current.cancel();
    }
  };

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionType, setQuestionType] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  // ... (keep existing useEffect and utility functions)

  const generateQuestion = () => {
    const questions = [
      {
        type: 'mcq',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 'Paris'
      },
      {
        type: 'shortAnswer',
        question: 'Explain the concept of photosynthesis in one sentence.',
        correctAnswer: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.'
      },
      {
        type: 'fillBlank',
        question: 'The chemical symbol for water is ____.',
        correctAnswer: 'H2O'
      }
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setQuestionType(randomQuestion.type);
    setUserAnswer('');
    setIsQuestionModalOpen(true);
  };

  const handleAnswerSubmit = () => {
    if (currentQuestion) {
      let isCorrect = false;
      switch (currentQuestion.type) {
        case 'mcq':
          isCorrect = userAnswer === currentQuestion.correctAnswer;
          break;
        case 'subjective':
          // For subjective questions, you might want to implement a more sophisticated checking mechanism
          isCorrect = userAnswer.toLowerCase().includes(currentQuestion.correctAnswer.toLowerCase());
          break;
        case 'fillBlank':
          isCorrect = userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
          break;
      }

      setFeedback(isCorrect
        ? "Great job! That's correct."
        : `I'm afraid that's not correct. The right answer is: ${currentQuestion.correctAnswer}`
      );

      setTimeout(() => {
        setIsQuestionModalOpen(false);
        setCurrentQuestion(null);
        setUserAnswer('');
        setFeedback('');
      }, 3000); // Close the modal after 3 seconds
    }
  };

  const triggerQuestion = () => {
    generateQuestion();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
     <header
        className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Instruct AI</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <div
            className="flex items-center bg-primary text-white px-3 py-1 rounded-full text-sm">
            <Star className="h-4 w-4 mr-1" />
            <span>{totalXP} XP</span>
          </div>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#">
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#">
            Progress
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#">
            Settings
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-4 px-4">
        <div className="container mx-auto grid gap-2 grid-cols-[20%,80%]">
          <Card className="w-full overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Chatbot RAG</h2>
              <div
                ref={chatContainerRef}
                className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-white dark:bg-gray-900 mb-4"
              >
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`rounded-full p-2 ${message.role === 'user' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          {message.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Brain className="h-4 w-4 text-primary" />}
                        </div>
                        <div className={`rounded-lg p-3 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {message.role === 'ai' ? (
                            isSpeaking && index === messages.length - 1 ? (
                              <>
                                <span className="text-blue-500">{message.highlightedText}</span>
                                <span>{message.content.substring(message.highlightedText.length)}</span>
                              </>
                            ) : (
                              message.content
                            )
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                

              </div>  
                
              <div className="flex items-center space-x-2">
  {/* <Input
    placeholder="Type your message here..."
    value={inputMessage}
    onChange={(e) => setInputMessage(e.target.value)}
    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
    className="flex-1"
  /> */}
  <div className='flex flex-col gap-4 align-middle justify-center'>

 
  <div className='flex gap-2'>
  <Button onClick={handleSendMessage} className="rounded-full w-10 h-10 p-2">
    <Send className="h-4 w-4" />
    <span className="sr-only">Send message</span>
  </Button>
  <Button onClick={toggleListening} className={`rounded-full w-10 h-10 p-2 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}>
    <Mic className="h-4 w-4" />
    <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
  </Button>
  <Button onClick={toggleMute} className="rounded-full w-10 h-10 p-2">
    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
  </Button>

  </div>

  <div className='flex'>
  <Button onClick={triggerQuestion} className="px-4 py-2 w-40 flex items-center justify-center space-x-2">
    <BookOpen className="h-4 w-4" />
    <span>Test Knowledge</span>
  </Button>

  </div>

  </div>
  

</div>

            </CardContent>
          </Card>
          <Card className="w-full overflow-hidden">
                <YoutubeGenerator/>
          </Card>
        
        
        </div>
      </main>

      <YouTubePreviewDialog/>
     
     
     
      <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Question</DialogTitle>
            <DialogDescription>
              Please answer this question to continue your learning session.
            </DialogDescription>
          </DialogHeader>
          {currentQuestion && (
            <div className="space-y-4">
              <p className="font-semibold">{currentQuestion.question}</p>
              {currentQuestion.type === 'mcq' && (
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => setUserAnswer(option)}
                      variant={userAnswer === option ? 'default' : 'outline'}
                      className="w-full justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
              {(currentQuestion.type === 'subjective' || currentQuestion.type === 'fillBlank') && (
                <Input
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                />
              )}
              <Button onClick={handleAnswerSubmit}>Submit Answer</Button>
              {feedback && (
                <p className={`font-semibold ${feedback.includes('correct') ? 'text-green-500' : 'text-red-500'}`}>
                  {feedback}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
   <Footer/>
    </div >
  );
};

export default Learn;