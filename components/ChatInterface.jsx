// components/ChatInterface.js
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, User, Mic, Volume2, VolumeX, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatInterface = ({ messages, setMessages, isListening, toggleListening, isMuted, toggleMute, speak }) => {
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef(null);

  // ... (handleSendMessage and other logic)
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

  return (
 
    <CardContent className="p-6">
      <h2 className="text-2xl font-bold mb-4">AI Visual Learning</h2>
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
        <Input
          placeholder="Type your message here..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1"
        />
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
    </CardContent>

  );
};

export default ChatInterface;