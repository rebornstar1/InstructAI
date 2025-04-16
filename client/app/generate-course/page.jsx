"use client"

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import { usePathname } from 'next/navigation';

import CourseCreationComponent from "../../components/CourseCreationComponent";
import Navbar2 from "@/components/Navbar2";
import ProtectedRoute from "@/components/ProtectedRoute";

// Add this dynamic configuration to opt out of static generation
export const dynamic = 'force-dynamic';

// This client component will handle the search params
function CourseCreationWithSearchParams({ rawCourses, setGeneratedCourse, messages, setMessages }) {
  const { useSearchParams } = require('next/navigation');
  const searchParams = useSearchParams();
  const promptParam = searchParams.get('prompt') || '';
  
  return (
    <CourseCreationComponent
      initialPrompt={promptParam}
      rawCourses={rawCourses}
      setGeneratedCourse={setGeneratedCourse}
      messages={messages}
      setMessages={setMessages}
    />
  );
}

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

export default function CourseCreation() {
  const pathname = usePathname();
  
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [rawCourses, setRawCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI course creator. Tell me what you'd like to learn about, and I'll generate a personalized course for you.",
    },
  ]);

  // Fetch user profile when component mounts
  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        try {
          const profileData = await fetchWithAuth('/api/profile');
          setUserProfile(profileData);
          
          // Fetch previous courses if needed
          const coursesData = await fetchWithAuth('/api/courses');
          if (coursesData && Array.isArray(coursesData)) {
            setRawCourses(coursesData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load user data");
        } finally {
          setLoading(false);
        }
      }
    };

    getUserProfile();
  }, [user]);

  return(
    <ProtectedRoute>
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
        <Navbar2/>

        {/* Main content with proper padding to avoid navbar overlap */}
        <div className="pt-28 px-6 md:px-8 max-w-screen-xl mx-auto pb-16">
          <motion.div 
            key="course-creation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-3">
              <div className="flex items-center">
                <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                <span className="text-blue-600 font-medium">Course Creation</span>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
              Create Your Custom Course
            </h1>
            
            <p className="text-lg text-slate-600 mb-8">
              Describe what you want to learn, and our AI will generate a personalized course tailored to your interests and learning style.
            </p>
            
            <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
              <Suspense fallback={<div>Loading course creation...</div>}>
                <CourseCreationWithSearchParams 
                  rawCourses={rawCourses}
                  setGeneratedCourse={setGeneratedCourse}
                  messages={messages}
                  setMessages={setMessages}
                />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </div>
    </Suspense>
    </ProtectedRoute>
  );
}