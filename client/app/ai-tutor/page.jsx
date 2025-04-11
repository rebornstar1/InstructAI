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

// Helper component for navigation links
const NavLink = ({ href, active, disabled, children }) => (
    <Link 
      href={disabled ? "#" : href}
      className={`px-3 py-2 rounded-md transition-colors relative group ${
        disabled ? 'text-slate-400 cursor-not-allowed' :
        active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'
      }`}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {children}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left transition-transform ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}></span>
    </Link>
  );

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
      <nav className="fixed w-full z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight text-slate-800">
                  Instruct<span className="text-blue-600">AI</span>
                </span>
              </div>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-1">
  <Link 
    href="/generate-course"
    className="mr-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center group"
  >
    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white bg-opacity-20 mr-2 group-hover:scale-110 transition-transform">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </span>
    <span className="text-sm font-medium">New Course</span>
  </Link>

  <NavLink href="/home" active={pathname === "/home"}>Dashboard</NavLink>
<NavLink href="/course-content" active={pathname === "/course-content"} disabled={!generatedCourse}>Courses</NavLink>
<NavLink href="/ai-tutor" active={pathname === "/ai-tutor"}>AI Tutor</NavLink>
<NavLink href="/resume-analyser" active={pathname === "/resume-analyser"}>Analyze Resume</NavLink>
  
  <div className="ml-8 flex items-center space-x-4">
    <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm">
      <Star className="h-4 w-4 mr-1" />
      <span>{userProfile?.xp || 0} XP</span>
    </div>
    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
      <span className="font-medium text-slate-600">{userProfile?.username ? userProfile.username.slice(0, 2).toUpperCase() : "U"}</span>
    </div>
  </div>
</div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-slate-700 hover:text-blue-600 focus:outline-none">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

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