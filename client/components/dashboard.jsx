"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Star, 
  Book, 
  MessageCircle, 
  Home, 
  ChevronRight, 
  Sparkles,
  GraduationCap,
  LayoutDashboard,
  FileText,
  Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Changed from Clerk to our custom auth
import { fetchWithAuth } from "@/lib/api";

import { usePathname } from 'next/navigation';




export default function Dashboard() {
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState("dashboard");
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
        "Hello! I'm your AI tutor. Enter a prompt to generate a course on any topic you'd like to learn about.",
    },
  ]);

  // Example raw course suggestions - will still be hardcoded for the UI
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

  // Fetch user profile data from the backend
  useEffect(() => {
    console.log("HIII")
    console.log("USSS" ,user)
    async function fetchUserProfile() {
      
      try {
        
        if (!user) return;
        console.log("doing")
        
        setLoading(true);
        const response = await fetchWithAuth('/users/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        console.log("REsponse" , response.json)
        const data = await response.json();
        
        setUserProfile(data);
      } catch (err) {
        
        console.error('Error fetching user profile:', err);
        setError('Could not load user profile data');
      } finally {
        
        setLoading(false);
        setIsLoaded(true);
      }
    }

    fetchUserProfile();
    
  }, [user]);
  
  useEffect(() => {
    console.log("USerprofile" , userProfile)
  }, [userProfile])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const cardHoverVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  };

  // Suggested courses component
  const SuggestedCourses = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-12"
    >
      <motion.div variants={itemVariants} className="text-center space-y-4 mb-8">
        <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span>Recommended Courses</span>
          <Sparkles className="h-5 w-5 text-blue-500" />
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          These courses are tailored to your learning history and goals
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rawCourses.map((course, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
          >
            <div 
              className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1"
              variants={cardHoverVariants}
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
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {course.icon ? (
                    <span className="text-2xl">{course.icon}</span>
                  ) : (
                    <Book className="h-5 w-5 text-blue-500" />
                  )}
                  {course.title}
                </h3>
                <p className="text-slate-600 mt-3">{course.description}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Start Course
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Stats cards component
  const StatsCards = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100">Total XP</p>
            <h3 className="text-3xl font-bold mt-1">{userProfile?.xp || 0}</h3>
          </div>
          <div className="p-2 bg-white/20 rounded-lg">
            <Star className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6 bg-white/20 h-2 rounded-full overflow-hidden">
          <div className="bg-white h-full rounded-full" style={{ width: "65%" }}></div>
        </div>
        <p className="text-sm mt-2 text-blue-100">65% to next level</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500">Courses Started</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-800">
              {userProfile?.completedCourses?.length || 10}
            </h3>
          </div>
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Book className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm mt-6 text-blue-600 font-medium">View all courses</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500">AI Tutor Chats</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-800">12</h3>
          </div>
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <MessageCircle className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm mt-6 text-blue-600 font-medium cursor-pointer" onClick={() => setActiveTab("chat")}>
          Continue conversation
        </p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER */}
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

      {/* MAIN CONTENT */}
      <main className="pt-32 md:pt-32 pb-16 px-6 md:px-8 max-w-screen-xl mx-auto">
        <AnimatePresence mode="wait">

        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div className="inline-block mb-3">
                <div className="flex items-center">
                  <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">Your Learning Dashboard</span>
                </div>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                  Welcome back, <span className="relative">
                    <span className="relative z-10">{userProfile?.username}</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 z-0"></span>
                  </span>
                </h1>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.2
                  }}
                >
                  <a 
                    href="/generate-course"
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md shadow-sm relative overflow-hidden"
                    style={{
                      background: "linear-gradient(45deg, #3b82f6, #2563eb)"
                    }}
                  >
                    <motion.div 
                      className="absolute inset-0 w-full h-full"
                      animate={{
                        background: [
                          "linear-gradient(45deg, #3b82f6, #2563eb)", 
                          "linear-gradient(45deg, #2563eb, #4f46e5)",
                          "linear-gradient(45deg, #4f46e5, #2563eb)",
                          "linear-gradient(45deg, #2563eb, #3b82f6)"
                        ]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="relative z-10">Generate New Course</span>
                  </a>
                </motion.div>
              </div>
                    
              <p className="text-lg text-slate-600 mb-8 max-w-2xl">
                Continue your learning journey, explore new courses, or chat with your AI tutor to enhance your skills.
              </p>
            </motion.div>
          </div>
                    
          {/* Stats Cards Section */}
          <StatsCards />
                    
          {/* Recent Activity Section - Moved here */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  {
                    title: "Completed lesson",
                    description: "Introduction to Python Variables",
                    time: "2 hours ago",
                    icon: <CheckIcon />
                  },
                  {
                    title: "Started new course",
                    description: "Web Development Fundamentals",
                    time: "Yesterday",
                    icon: <PlayIcon />
                  },
                  {
                    title: "Earned achievement",
                    description: "Coding Streak: 7 Days",
                    time: "3 days ago",
                    icon: <TrophyIcon />
                  }
                ].map((activity, i) => (
                  <div key={i} className="p-4 flex items-start hover:bg-slate-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{activity.title}</h4>
                      <p className="text-sm text-slate-600">{activity.description}</p>
                    </div>
                    <div className="text-xs text-slate-500">{activity.time}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 text-center">
                <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
                  View all activity
                </button>
              </div>
            </div>
          </motion.div>
              
              
        </motion.div>

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          {/* Main footer content */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight">
                  Instruct<span className="text-blue-500">AI</span>
                </span>
              </div>
              <p className="text-slate-400 mb-6">
                Revolutionizing personalized education through AI-powered learning experiences.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'linkedin', 'instagram'].map(social => (
                  <a key={social} href="#" className="text-slate-500 hover:text-blue-400 transition">
                    <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center">
                      <span className="sr-only">{social}</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Use Cases', 'Roadmap', 'Integrations'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                {['Documentation', 'Blog', 'Community', 'Support', 'Learning Center'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom footer */}
          <div className="py-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} InstructAI, Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Terms</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Cookies</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
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

// Simple icon components for activity feed
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.795.077 1.584.24 2.287.491a.75.75 0 11-.574 1.385c-.708-.25-1.466-.4-2.212-.465V6.75a2.75 2.75 0 01-2.75 2.75h-2.5A2.75 2.75 0 016 6.75v-3zm7.5 3V3.75A1.25 1.25 0 0012.25 2.5h-2.5A1.25 1.25 0 008.5 3.75v3a1.25 1.25 0 001.25 1.25h2.5A1.25 1.25 0 0013.5 6.75z" clipRule="evenodd" />
    <path d="M12.78 15.81l-3.214-4.018a.75.75 0 00-1.173 0L5.18 15.81a.75.75 0 001.173.938l2.147-2.683v3.684a.75.75 0 001.5 0v-3.684l2.147 2.683a.75.75 0 001.173-.938z" />
  </svg>
);