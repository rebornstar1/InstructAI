"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Star, Book, MessageCircle, Home, ChevronRight } from "lucide-react";

import CourseCreationComponent from "./CourseCreationComponent";
import CourseContentComponent from "./CourseContentComponent";
import AITutorChatComponent from "./AITutorChatComponent";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI tutor. Enter a prompt to generate a course on any topic you'd like to learn about.",
    },
  ]);

  // Example XP and raw course suggestions
  const totalXP = 1000;
  const rawCourses = [
    {
      title: "Mathematics: Algebra Basics",
      description: "Learn the fundamentals of algebra, including solving equations and working with variables.",
      icon: "📐"
    },
    {
      title: "Mathematics: Geometry Essentials",
      description: "Discover the basics of geometry, shapes, theorems, and proofs.",
      icon: "📏"
    },
    {
      title: "Science: Physics Fundamentals",
      description: "Explore the fundamental principles of physics, including mechanics and energy.",
      icon: "🔭"
    },
    {
      title: "Science: Chemistry Essentials",
      description: "Understand the basics of chemistry, including elements, compounds, and reactions.",
      icon: "🧪"
    },
  ];

  // Set isLoaded to true after component mounts (for animations)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Suggested courses component
  const SuggestedCourses = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={isLoaded ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mt-12"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Recommended Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rawCourses.map((course, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 * index + 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition duration-300 border border-gray-100 dark:border-gray-700"
            onClick={() => {
              setGeneratedCourse({
                title: course.title,
                description: course.description,
                modules: [{
                  title: "Introduction",
                  lessons: [{ title: "Getting Started" }]
                }]
              });
              setActiveTab("course");
            }}
          >
            <div className="text-4xl mb-4">{course.icon}</div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{course.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{course.description}</p>
            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
              Start Course
              <ChevronRight className="ml-1 h-4 w-4" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Stats cards component
  const StatsCards = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={isLoaded ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100">Total XP</p>
            <h3 className="text-3xl font-bold mt-1">{totalXP}</h3>
          </div>
          <div className="p-2 bg-white/20 rounded-lg">
            <Star className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6 bg-white/20 h-2 rounded-full overflow-hidden">
          <div className="bg-white h-full rounded-full" style={{ width: "65%" }}></div>
        </div>
        <p className="text-sm mt-2 text-blue-100">65% to next level</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Courses Started</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-800 dark:text-white">5</h3>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Book className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm mt-6 text-blue-600 dark:text-blue-400 font-medium">View all courses</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 dark:text-gray-400">AI Tutor Chats</p>
            <h3 className="text-3xl font-bold mt-1 text-gray-800 dark:text-white">12</h3>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <MessageCircle className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm mt-6 text-blue-600 dark:text-blue-400 font-medium cursor-pointer" onClick={() => setActiveTab("chat")}>
          Continue conversation
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* HEADER */}
      <nav className="flex justify-between items-center py-6 px-8 md:px-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md fixed w-full z-50 shadow-sm">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Brain className="text-white h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-gray-800 dark:text-white">InstructAI</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden md:flex gap-8 items-center"
        >
          <button 
            className={`transition ${activeTab === "dashboard" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button 
            className={`transition ${activeTab === "course" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"}`}
            onClick={() => generatedCourse && setActiveTab("course")}
            disabled={!generatedCourse}
          >
            Course
          </button>
          <button 
            className={`transition ${activeTab === "chat" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"}`}
            onClick={() => setActiveTab("chat")}
          >
            AI Tutor
          </button>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm shadow-md">
            <Star className="h-4 w-4 mr-1" />
            <span>{totalXP} XP</span>
          </div>
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="font-medium text-gray-600 dark:text-gray-300">US</span>
          </div>
        </motion.div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-28 pb-16 px-8 md:px-16 mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center mb-2">
            <Home className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="mx-2 text-gray-500 dark:text-gray-400">/</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {activeTab === "dashboard" ? "Dashboard" : 
               activeTab === "course" ? "Course Content" : "AI Tutor Chat"}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
            {activeTab === "dashboard" ? "Your Learning Dashboard" : 
             activeTab === "course" ? generatedCourse?.title || "Course Content" : "AI Tutor Chat"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {activeTab === "dashboard" ? "Continue your learning journey, explore new courses, or chat with your AI tutor." : 
             activeTab === "course" ? generatedCourse?.description || "Explore your course materials and track your progress." : 
             "Ask questions, get explanations, and deepen your understanding with your personal AI tutor."}
          </p>

          {activeTab === "dashboard" && (
            <>
              <StatsCards />
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 mb-10"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Generate New Course</h2>
                <CourseCreationComponent
                  rawCourses={rawCourses}
                  setGeneratedCourse={setGeneratedCourse}
                  setActiveTab={setActiveTab}
                  messages={messages}
                  setMessages={setMessages}
                />
              </motion.div>
              
              <SuggestedCourses />
            </>
          )}

          {activeTab === "course" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 mt-6"
            >
              <CourseContentComponent
                generatedCourse={generatedCourse}
                setMessages={setMessages}
              />
            </motion.div>
          )}

          {activeTab === "chat" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700 mt-6"
            >
              <AITutorChatComponent messages={messages} setMessages={setMessages} />
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-gray-800 py-8 px-8 md:px-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Brain className="text-white h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-gray-800 dark:text-white">InstructAI</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Create personalized learning experiences with the power of AI.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-lg text-gray-800 dark:text-white">Learning</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">All Courses</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Learning Paths</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Study Groups</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-lg text-gray-800 dark:text-white">Account</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Profile</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Settings</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Billing</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Help Center</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-lg text-gray-800 dark:text-white">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">About Us</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Blog</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 InstructAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}