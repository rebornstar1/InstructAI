"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Star } from "lucide-react";
import EnhancedQuiz from "./EnhancedQuiz"; 
import { usePathname } from 'next/navigation';


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

const ResumeAnalyzerPage = () => {
  const pathname = usePathname();
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [file, setFile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [analysisState, setAnalysisState] = useState({
    stage: "initial",
    progress: 0,
  });
  const [error, setError] = useState(null);
  const [generatedQuizzes, setGeneratedQuizzes] = useState([]);
  const [completedQuizResults, setCompletedQuizResults] = useState([]);
  const fileInputRef = useRef(null);

  // Quiz modal state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizProgress, setQuizProgress] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    totalCorrect: 0,
    totalQuestions: 0,
  });
  const [failedQuizTopics, setFailedQuizTopics] = useState([]);
  const [userProfile, setUserProfile] = useState({ username: "User", xp: 0 });

  // File handling functions
  const handleFileChange = (e) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a PDF or Word document");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(droppedFile.type)) {
        setError("Please upload a PDF or Word document");
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB");
        return;
      }
      setFile(droppedFile);
    }
  };

  // Upload and analysis function
  const handleAnalyzeResume = async () => {
    if (!file) return;
    try {
      setAnalysisState({ stage: "uploading", progress: 0 });
      const uploadInterval = setInterval(() => {
        setAnalysisState((prev) => {
          if (prev.progress >= 90) {
            clearInterval(uploadInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 200);
      const formData = new FormData();
      formData.append("file", file);
      setTimeout(() => {
        clearInterval(uploadInterval);
        setAnalysisState({ stage: "analyzing", progress: 0 });
        const analysisInterval = setInterval(() => {
          setAnalysisState((prev) => {
            if (prev.progress >= 90) {
              clearInterval(analysisInterval);
              return prev;
            }
            return { ...prev, progress: prev.progress + 5 };
          });
        }, 100);
        fetch("http://localhost:8007/api/documents/extract-topics", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to analyze resume");
            }
            return response.json();
          })
          .then((data) => {
            clearInterval(analysisInterval);
            const formattedTopics = data.topics.map((topicName, index) => ({
              id: String(index + 1),
              name: topicName,
            }));
            setTopics(formattedTopics);
            setAnalysisState({ stage: "editing", progress: 100 });
          })
          .catch((error) => {
            clearInterval(analysisInterval);
            console.error("Error calling API:", error);
            setError("Failed to analyze resume. Please try again.");
            setAnalysisState({ stage: "initial", progress: 0 });
          });
      }, 1500);
    } catch (err) {
      setError("An error occurred during analysis. Please try again.");
      setAnalysisState({ stage: "initial", progress: 0 });
      console.error(err);
    }
  };

  const handleTopicChange = (id, newName) => {
    setTopics(
      topics.map((topic) =>
        topic.id === id ? { ...topic, name: newName } : topic
      )
    );
  };

  const addTopic = () => {
    if (topics.length < 7) {
      const newId = String(topics.length + 1);
      setTopics([...topics, { id: newId, name: "" }]);
    }
  };

  const removeTopic = (id) => {
    if (topics.length > 0) {
      setTopics(topics.filter((topic) => topic.id !== id));
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      setAnalysisState({ stage: "generating", progress: 0 });
      const topicNames = topics.map((t) => t.name);
      const generateInterval = setInterval(() => {
        setAnalysisState((prev) => {
          if (prev.progress >= 90) {
            clearInterval(generateInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 5 };
        });
      }, 100);
      fetch("http://localhost:8007/api/learning-resources/generate-multiple-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topicNames),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to generate quizzes");
          }
          return response.json();
        })
        .then((quizData) => {
          clearInterval(generateInterval);
          setAnalysisState({ stage: "initial", progress: 100 });
          setGeneratedQuizzes(quizData);
          setQuizProgress({
            totalQuizzes: quizData.length,
            completedQuizzes: 0,
            totalCorrect: 0,
            totalQuestions: quizData.reduce(
              (sum, quiz) => sum + (quiz.questions?.length || 0),
              0
            ),
          });
          setFile(null);
          setTopics([]);
        })
        .catch((error) => {
          clearInterval(generateInterval);
          console.error("Error generating quizzes:", error);
          setError("Failed to generate quizzes. Please try again.");
          setAnalysisState({ stage: "editing", progress: 0 });
        });
    } catch (err) {
      setError("Failed to generate quiz. Please try again.");
      setAnalysisState({ stage: "editing", progress: 0 });
      console.error(err);
    }
  };

  const handleOpenQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setShowQuizModal(true);
  };

  const handleCloseQuizModal = () => {
    setShowQuizModal(false);
    setActiveQuiz(null);
  };

  const handleQuizComplete = (result) => {
    setCompletedQuizResults((prev) => [...prev, result]);
    console.log("Quizes completed:", completedQuizResults);
    setQuizProgress((prev) => ({
      ...prev,
      completedQuizzes: prev.completedQuizzes + 1,
      totalCorrect: prev.totalCorrect + result.score,
    }));
    handleCloseQuizModal();
  };

  const handleQuizFail = (failedTopics) => {
    setFailedQuizTopics((prev) => [...prev, ...failedTopics]);
    console.log("Failed topics:", failedTopics);
  };

  const handleGenerateCourses = () => {
    // This is a dummy handler – replace with your courses generation logic.
    console.log("Generate courses clicked");
  };

  const renderQuizResults = () => {
    console.log("HIOO")
    if (generatedQuizzes.length === 0) return null;
    return (
      <div className="mt-8 bg-white rounded-xl shadow-md p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Your Personalized Quizzes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generatedQuizzes.map((quiz, index) => {
            const quizId = quiz.quizTitle || String(index);
            const completed = completedQuizResults.find((q) => q.quizTitle === quizId);
            return (
              <div
                key={quizId}
                className="p-6 border rounded-xl transition-all border-slate-200 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-slate-800">{quiz.quizTitle}</h4>
                  {completed && (
                    <span className="text-sm bg-green-100 text-green-800 px-4 py-1 rounded-full">
                      Score: {completed.score}/100
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 my-4">{quiz.description}</p>
                <div className="mt-4 flex items-center justify-end">
                  {completed ? (
                    <button
                      disabled
                      className="text-sm px-4 py-2 rounded-md font-medium bg-slate-200 text-slate-500 cursor-not-allowed"
                    >
                      Quiz Completed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenQuiz(quiz)}
                      className="text-sm px-4 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Start Quiz
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [refreshKey, setRefreshKey] = useState(0);

  // Add effect to refresh quiz results when completedQuizResults changes
  useEffect(() => {
    // Increment refreshKey to force re-render of quiz results
    setRefreshKey(prevKey => prevKey + 1);
    console.log('refreshing')
    renderQuizResults();

    
    // Update the profile XP whenever a quiz is completed
    // if (completedQuizResults.length > 0) {
    //   // Calculate total XP gained from all completed quizzes
    //   const totalXP = completedQuizResults.reduce((sum, result) => sum + result.score, 0) * 10;
      
    //   // Update the user profile with new XP
    //   setUserProfile(prev => ({
    //     ...prev,
    //     xp: totalXP
    //   }));
    // }
  }, [completedQuizResults]);

  // useEffect(() => {

  // } , [completedQuizResults]);
  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
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
        <div className="inline-block mb-3">
          <div className="flex items-center">
            <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
            <span className="text-blue-600 font-medium">Resume Analyzer</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
          Analyze Your Resume
        </h1>
        
        <p className="text-lg text-slate-600 mb-8 max-w-2xl">
          Upload your resume to generate personalized quizzes based on your skills and experience.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-8"
        >
          <AnimatePresence mode="wait">
            {analysisState.stage === "initial" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                <motion.div
                  className={`border-2 border-dashed ${error ? "border-red-300" : "border-blue-200"} rounded-xl p-8 text-center transition-colors ${file ? "" : "cursor-pointer hover:border-blue-500"}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!file) {
                      fileInputRef.current && fileInputRef.current.click();
                    }
                  }}
                  whileHover={{ scale: file ? 1 : 1.01 }}
                  whileTap={{ scale: file ? 1 : 0.99 }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />

                  {!file ? (
                    <div>
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <svg
                          className="w-16 h-16 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          ></path>
                        </svg>
                      </motion.div>
                      <h3 className="text-lg font-medium text-slate-800 mb-1">
                        Drag and drop your resume here
                      </h3>
                      <p className="text-sm text-slate-500">
                        or click to select a file (PDF, DOC, DOCX)
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="w-16 h-16 mx-auto text-green-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <h3 className="text-lg font-medium text-slate-800 mb-1">
                        {file.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.split("/")[1] || "Unknown"}
                      </p>
                    </div>
                  )}
                </motion.div>

                {error && (
                  <motion.p
                    className="text-red-500 text-sm mt-2 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}

                {file && (
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.button
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
                      onClick={handleAnalyzeResume}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        ></path>
                      </svg>
                      Analyze Resume
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {(analysisState.stage === "uploading" || analysisState.stage === "analyzing") && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10"
              >
                <div className="text-center mb-8">
                  <motion.div
                    className="w-24 h-24 mx-auto mb-4 relative"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <svg
                      className="w-full h-full text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 4.75V6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M17.1266 6.87347L16.0659 7.93413" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M19.25 12L17.75 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M17.1266 17.1265L16.0659 16.0659" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M12 17.75V19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M7.9342 16.0659L6.87354 17.1265" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M6.25 12L4.75 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M7.9342 7.93413L6.87354 6.87347" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {analysisState.stage === "uploading" ? "Uploading Resume..." : "Analyzing Your Resume..."}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {analysisState.stage === "uploading" ? "Securely uploading your document" : "Identifying your skills and experience"}
                  </p>
                  
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 max-w-md mx-auto">
                    <motion.div 
                      className="bg-blue-600 h-2.5 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${analysisState.progress}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                  <p className="text-sm text-slate-500">{analysisState.progress}%</p>
                </div>
              </motion.div>
            )}

            {analysisState.stage === "editing" && (
              <motion.div
                key="topics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-4"
              >
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Identified Topics</h3>
                <p className="text-slate-600 mb-4">
                  These topics were identified from your resume. Feel free to edit, add, or remove topics.
                </p>
                <div className="space-y-3 mb-6">
                  {topics.map((topic) => (
                    <motion.div
                      key={topic.id}
                      className="flex items-center p-4 bg-slate-50 rounded-lg group relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      whileHover={{ scale: 1.01, backgroundColor: "#EFF6FF" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium shrink-0">
                        {topic.id}
                      </div>
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => handleTopicChange(topic.id, e.target.value)}
                        placeholder="Enter topic name"
                        className="ml-3 flex-1 bg-transparent border-b border-blue-200 focus:border-blue-500 px-2 py-1 outline-none"
                      />
                      {topics.length > 0 && (
                        <button 
                          onClick={() => removeTopic(topic.id)}
                          className="ml-2 p-1 text-slate-400 hover:text-red-500 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove topic"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
                {topics.length < 7 && (
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <button
                      onClick={addTopic}
                      className="flex items-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Add Topic
                    </button>
                  </motion.div>
                )}
                <div className="text-center">
                  <motion.button
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto shadow-md"
                    onClick={handleGenerateQuiz}
                    disabled={topics.some(topic => topic.name.trim() === "")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Generate Quiz
                  </motion.button>
                </div>
              </motion.div>
            )}
            {analysisState.stage === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center"
              >
                <motion.div 
                  className="w-24 h-24 mx-auto mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <svg className="w-full h-full text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6.75H7.75C6.64543 6.75 5.75 7.64543 5.75 8.75V17.25C5.75 18.3546 6.64543 19.25 7.75 19.25H16.25C17.3546 19.25 18.25 18.3546 18.25 17.25V8.75C18.25 7.64543 17.3546 6.75 16.25 6.75H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M14 8.25H10C9.44772 8.25 9 7.80228 9 7.25V5.75C9 5.19772 9.44772 4.75 10 4.75H14C14.5523 4.75 15 5.19772 15 5.75V7.25C15 7.80228 14.5523 8.25 14 8.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.75 13.75L16.25 13.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M7.75 16.75L16.25 16.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </motion.div>
                
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Generating Your Personalized Quiz
                </h3>
                <p className="text-slate-600 mb-6">
                  Creating quiz questions based on the selected topics
                </p>
                
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 max-w-md mx-auto">
                  <motion.div 
                    className="bg-blue-600 h-2.5 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${analysisState.progress}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
                <p className="text-sm text-slate-500">
                  {analysisState.progress}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {renderQuizResults()}
        </motion.div>

        {/* Weak Topics Area */}
        {failedQuizTopics.length > 0 && (
  <motion.div 
    className="mt-8 bg-white rounded-xl shadow-md border-l-4 border-amber-500 overflow-hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4">Topics to Improve</h3>
      <p className="text-slate-600 mb-4">
        Based on your quiz results, these are areas where you could benefit from additional learning.
      </p>

      <div className="space-y-4">
        {failedQuizTopics.map((topic, index) => (
          <div key={index} className="bg-amber-50 rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span className="text-amber-800">{topic}</span>
            </div>
            <Link 
              href={`/generate-course?prompt=${encodeURIComponent(topic)}`}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all"
            >
              <div className="flex justify-end my-1">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          Generate Courses
          </div>
            </Link>
          </div>
        ))}
      </div>

    </div>
  </motion.div>
)}
      </div>
      
      {/* Quiz Modal */}
      {showQuizModal && activeQuiz && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button
              onClick={handleCloseQuizModal}
              className="absolute top-3 right-3 z-10 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              aria-label="Close Quiz"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <EnhancedQuiz
              moduleId="resume-module"
              quiz={activeQuiz}
              onClose={handleCloseQuizModal}
              onProgressUpdate={(data) => console.log("Progress updated:", data)}
              onQuizFail={handleQuizFail}
              onQuizComplete={(resultData) => {
                handleQuizComplete(resultData);
                console.log("Quiz completed:", resultData);

              }}
              
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzerPage;