"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import { usePathname } from 'next/navigation';




import AITutorChatComponent from "../../components/AITutorChatComponent";
import Navbar2 from "@/components/Navbar2";


export default function AITutor(){
    const pathname = usePathname();

  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI tutor. How can I help you with your learning journey today?",
    },
  ]);

  // Fetch user profile when component mounts
  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        try {
          const profileData = await fetchWithAuth('/api/profile');
          setUserProfile(profileData);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError("Failed to load user profile");
        } finally {
          setLoading(false);
        }
      }
    };

    getUserProfile();
  }, [user]);

  return(
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      <Navbar2/>

      {/* Main content with proper padding to avoid navbar overlap */}
      <div className="pt-28 px-6 md:px-8 max-w-screen-xl mx-auto pb-16">
        <motion.div 
          key="ai-tutor"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block mb-3">
            <div className="flex items-center">
              <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
              <span className="text-blue-600 font-medium">AI Tutor</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
            Chat with your AI Tutor
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Ask questions, get explanations, or discuss any topic you're learning about. Your AI tutor is here to help.
          </p>
          
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <AITutorChatComponent
              messages={messages}
              setMessages={setMessages}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}