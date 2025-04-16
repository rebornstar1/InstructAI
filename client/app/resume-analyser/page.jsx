"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Star, BookOpen, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import EnhancedQuiz from "./EnhancedQuiz"; 
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';
import Navbar2 from "@/components/Navbar2";
import ProtectedRoute from "@/components/ProtectedRoute";

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
  const [quizPlaceholders, setQuizPlaceholders] = useState([]); // For topics awaiting quiz generation
  const [currentlyGeneratingIndex, setCurrentlyGeneratingIndex] = useState(-1); // Track which quiz is being generated
  const [isGenerating, setIsGenerating] = useState(false); // Flag for ongoing generation process
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
        fetch(`${API_URL}/api/documents/extract-topics`, {
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

 // Function to create quiz placeholders for all topics
const createQuizPlaceholders = () => {
  const placeholders = topics.map((topic, index) => ({
    id: `placeholder-${index}`,
    quizTitle: topic.name,
    description: index === 0 ? "Generating quiz content..." : "Waiting in queue...",
    isLoading: true,
    status: index === 0 ? "generating" : "queued",
    questions: [],
    topicKey: topic.name
  }));
  return placeholders;
};


// Function to generate a single quiz for a specific topic
const generateSingleQuiz = async (topicName, index) => {
  try {
    console.log(`Generating quiz for topic: ${topicName} at index ${index}`);
    
    // Update the placeholder to show it's being generated
    setQuizPlaceholders(prev => 
      prev.map((quiz, i) => 
        i === index ? { ...quiz, description: "Generating quiz content...", status: "generating" } : quiz
      )
    );
    
    // Make the API call for this specific topic
    const response = await fetch(`${API_URL}/api/learning-resources/generate-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify( topicName ),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate quiz for ${topicName}`);
    }
    
    const quizData = await response.json();
    console.log("Quiz generated successfully:", quizData);
    
    // Add the newly generated quiz to the list of generated quizzes
    // Make sure to include the topicKey to identify it
    setGeneratedQuizzes(prev => [...prev, {...quizData, topicKey: topicName}]);
    
    // Remove this specific placeholder by matching the topicKey
    setQuizPlaceholders(prev => prev.filter(placeholder => placeholder.topicKey !== topicName));
    
    return true;
  } catch (error) {
    console.error(`Error generating quiz for ${topicName}:`, error);
    
    // Mark this quiz as failed by topicKey
    setQuizPlaceholders(prev => 
      prev.map(quiz => 
        quiz.topicKey === topicName ? { 
          ...quiz, 
          description: "Failed to generate quiz. Try again later.", 
          status: "failed"
        } : quiz
      )
    );
    
    return false;
  }
};

// Main function to start the sequential quiz generation process
const handleGenerateQuiz = async () => {
  console.log("handleGenerateQuiz called, isGenerating:", isGenerating); // Add logging
  
  if (isGenerating) {
    console.log("Generation already in progress, skipping");
    return;
  }
  
  try {
    setIsGenerating(true);
    const topicNames = topics.map(t => t.name);
    console.log("Topics to generate quizzes for:", topicNames);
    
    // Initialize placeholders for all topics
    const placeholders = createQuizPlaceholders();
    setQuizPlaceholders(placeholders);
    setGeneratedQuizzes([]); // Clear any previous quizzes
    
    // Set the analysis state to initial but keep progress at 100 to hide the upload form
    setAnalysisState({ stage: "initial", progress: 100 });
    
    // Start generating quizzes one by one
    for (let i = 0; i < topicNames.length; i++) {
      console.log(`Starting generation for topic ${i + 1}/${topicNames.length}: ${topicNames[i]}`);
      setCurrentlyGeneratingIndex(i);
      await generateSingleQuiz(topicNames[i], i);
    }
    
    // Reset file but keep topics for reference
    setFile(null);
    setCurrentlyGeneratingIndex(-1);
    console.log("All quizzes generated successfully");
  } catch (err) {
    setError("Failed to generate quizzes. Please try again.");
    console.error("Error in handleGenerateQuiz:", err);
  } finally {
    setIsGenerating(false);
  }
};

  const handleOpenQuiz = (quiz) => {
    // Don't allow opening quizzes that are still loading
    if (quiz.isLoading) return;
    
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

  // Function to try again for failed quizzes
  
const handleRetryQuiz = (topicKey) => {
  // Find the index of the quiz in the placeholders array
  const index = quizPlaceholders.findIndex(p => p.topicKey === topicKey);
  if (index === -1) return;
  
  // Update status to show it's retrying
  setQuizPlaceholders(prev => 
    prev.map((quiz) => 
      quiz.topicKey === topicKey ? { 
        ...quiz, 
        description: "Retrying quiz generation...", 
        status: "generating" 
      } : quiz
    )
  );
  
  generateSingleQuiz(topicKey, index);
};

  const renderQuizResults = () => {
    // Combine generated quizzes and placeholders for display
    // If there are no quizzes or placeholders to display, return null
    if (generatedQuizzes.length === 0 && quizPlaceholders.length === 0) return null;
  
  // Get unique topic keys from generated quizzes
  const generatedTopicKeys = new Set(generatedQuizzes.map(quiz => quiz.topicKey));
  
  // Filter placeholders to exclude any topics that already have generated quizzes
  const filteredPlaceholders = quizPlaceholders.filter(
    placeholder => !generatedTopicKeys.has(placeholder.topicKey)
  );
  
  // All quizzes to display (completed + still generating)
  const allQuizzes = [...generatedQuizzes, ...filteredPlaceholders];
    
    return (
      <div className="mt-8 bg-white rounded-xl shadow-md p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          Your Personalized Quizzes
        </h3>
        {isGenerating && (
          <div className="mb-4">
            <p className="text-blue-600 flex items-center">
              <Clock className="w-4 h-4 mr-2 animate-pulse" />
              Generating quizzes ({generatedQuizzes.length}/{generatedQuizzes.length + quizPlaceholders.length} complete)
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allQuizzes.map((quiz, index) => {
            const quizId = quiz.quizTitle || String(index);
            const completed = completedQuizResults.find((q) => q.quizTitle === quizId);
            const isLoading = quiz.isLoading;
            const status = quiz.status || "completed";
            
            return (
              <div
                key={quizId}
                className={`p-6 border rounded-xl transition-all ${
                  isLoading 
                    ? status === "failed" 
                      ? "border-red-200 bg-red-50" 
                      : status === "generating" 
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-slate-800">{quiz.quizTitle}</h4>
                  {completed && (
                    <span className="text-sm bg-green-100 text-green-800 px-4 py-1 rounded-full">
                      Score: {completed.score}/100
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 my-4">
                  {isLoading ? (
                    status === "failed" ? (
                      <span className="flex items-center text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        {quiz.description}
                      </span>
                    ) : status === "generating" ? (
                      <span className="flex items-center text-blue-600">
                        <span className="animate-pulse mr-2">⋯</span>
                        {quiz.description}
                      </span>
                    ) : (
                      <span className="flex items-center text-slate-500">
                        <Clock className="w-4 h-4 mr-2" />
                        {quiz.description}
                      </span>
                    )
                  ) : (
                    quiz.description
                  )}
                </p>
                
                <div className="mt-4 flex items-center justify-end">
                  {completed ? (
                    <button
                      disabled
                      className="text-sm px-4 py-2 rounded-md font-medium bg-slate-200 text-slate-500 cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 inline" />
                      Quiz Completed
                    </button>
                  ) : isLoading ? (
                    status === "failed" ? (
                      <button
                      onClick={() => handleRetryQuiz(quiz.topicKey)}
                      className="text-sm px-4 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retry Generation
                    </button>
                    ) : status === "generating" ? (
                      <button
                        disabled
                        className="text-sm px-4 py-2 rounded-md font-medium bg-blue-200 text-blue-700 cursor-not-allowed flex items-center"
                      >
                        <div className="mr-2 w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                        Generating Quiz
                      </button>
                    ) : (
                      <button
                        disabled
                        className="text-sm px-4 py-2 rounded-md font-medium bg-slate-200 text-slate-500 cursor-not-allowed flex items-center"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Waiting in Queue
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleOpenQuiz(quiz)}
                      className="text-sm px-4 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
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
    renderQuizResults();
  }, [completedQuizResults, generatedQuizzes, quizPlaceholders]);

  return (
    <ProtectedRoute>
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
      <Navbar2/>

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
            {analysisState.stage === "initial" && analysisState.progress === 0 && !quizPlaceholders.length && !generatedQuizzes.length && (
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
                    disabled={topics.some(topic => topic.name.trim() === "") || isGenerating}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Generate Quizzes 
                  </motion.button>
                </div>
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
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Topics to Improve</h3>
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
                      <span className="text-black font-semibold">{topic.substring(1,topic.length-6)}</span>
                    </div>
                    <Link 
                      href={`/generate-course?prompt=I want to learn about ${encodeURIComponent(topic.substring(1,topic.length-6))}`}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all"
                    >
                      <div className="flex justify-end my-1">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  Generate Course
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
    </ProtectedRoute>
  );
};

export default ResumeAnalyzerPage;