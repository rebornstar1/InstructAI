"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  ChevronRight,
  Layers,
  Loader2,
  PlayCircle,
  Sparkles,
  Download,
  BookmarkPlus,
  X,
  Calendar,
  CheckCircle,
  Award,
  BookOpen,
  ArrowRight,
  Users,
  ExternalLink,
} from "lucide-react";
import LearningProgressTracker from "./LearningProgressTracker";
import CustomMarkdownRenderer from "./ui/CustomMarkdownRenderer";

export default function CourseContentComponent({ generatedCourse, setMessages }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [learningResource, setLearningResource] = useState(null);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Article Modal State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [activeArticle, setActiveArticle] = useState({ title: "", content: "" });

  // Quiz Modal & related states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [passedQuiz, setPassedQuiz] = useState(false);

  const resourceRef = useRef(null);

  // Set isLoaded to true after component mounts for animation purposes
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Reset scroll position when new resource is loaded
  useEffect(() => {
    if (resourceRef.current && learningResource) {
      resourceRef.current.scrollTop = 0;
    }
  }, [learningResource]);

  // Helper: Convert YouTube watch URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    return url.replace("watch?v=", "embed/");
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setLearningResource(null);
  };

  const handleBackToCourse = () => {
    setSelectedModule(null);
    setLearningResource(null);
  };

  const handleGenerateModuleResources = async () => {
    if (!selectedModule) return;
    setIsLoadingResource(true);
    try {
      const request = {
        moduleTitle: selectedModule.title,
        moduleId: selectedModule.id, 
        format: "markdown",
        contentType: "comprehensive",
        detailLevel: 5,
        specificRequirements: [
          `Create a comprehensive guide for the module: ${selectedModule.title}`,
          "Include detailed explanations, diagrams, and code samples",
          "Structure content with clear sections and summaries",
        ],
      };

      // Set topic if available
      if (generatedCourse?.courseStructure?.courseMetadata?.title) {
        request.topic = generatedCourse.courseStructure.courseMetadata.title;
      } else if (generatedCourse?.courseMetadata?.title) {
        request.topic = generatedCourse.courseMetadata.title;
      }

      // Include learning objectives if provided
      if (selectedModule.learningObjectives && selectedModule.learningObjectives.length > 0) {
        request.specificRequirements.push(
          `Address the following learning objectives: ${selectedModule.learningObjectives.join(", ")}`
        );
      }

      const response = await fetch("http://localhost:8007/api/learning-resources/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
      const data = await response.json();
      setLearningResource(data);
      console.log("LearningResourceData",data);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate comprehensive materials for the entire "${selectedModule.title}" module`,
        },
        {
          role: "ai",
          content: `Detailed learning materials for "${selectedModule.title}" module generated.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating module resources:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate comprehensive materials for the entire "${selectedModule.title}" module`,
        },
        {
          role: "ai",
          content: "There was an error generating the module resources. Please try again later.",
        },
      ]);
    } finally {
      setIsLoadingResource(false);
    }
  };

  const handleOpenArticle = (subModule) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Show me content for "${subModule.subModuleTitle}"` },
      { role: "ai", content: `Displaying content for "${subModule.subModuleTitle}".` },
    ]);
    setActiveArticle({ title: subModule.subModuleTitle, content: subModule.article });
    setShowArticleModal(true);
  };

  const handleOpenQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setShowQuizModal(true);
    setQuizAnswers({});
    setQuizScore(0);
    setQuizSubmitted(false);
    setPassedQuiz(false);
  };

  const handleQuizAnswerChange = (questionIndex, option) => {
    setQuizAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz || !activeQuiz.questions) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      const userAnswer = quizAnswers[idx];
      if (userAnswer && userAnswer === q.correctAnswer) {
        correctCount++;
      }
    });
    const scorePercentage = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setQuizScore(scorePercentage);
    setQuizSubmitted(true);
    const passingScore = activeQuiz.passingScore || 60;
    setPassedQuiz(scorePercentage >= passingScore);
  };

  const handleCloseQuizModal = () => {
    setShowQuizModal(false);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setPassedQuiz(false);
    setQuizScore(0);
  };

  if (!generatedCourse) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 mb-6 rounded-full bg-blue-100 flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">No Course Selected</h2>
        <p className="text-gray-500 max-w-md">
          Please create a new course from the Dashboard or select an existing course to view its content.
        </p>
        <Button className="mt-6 bg-blue-600 hover:bg-blue-700">Create a Course</Button>
      </div>
    );
  }

  return (
    <div ref={resourceRef} className="max-w-5xl mx-auto space-y-6">
      {/* Course and Module View */}
      {!selectedModule ? (
        <>
          {/* Course Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-800">
              {generatedCourse.courseStructure?.courseMetadata?.title ||
                generatedCourse.courseMetadata?.title ||
                "Course Title"}
            </h1>
            <p className="mt-3 text-gray-600 max-w-3xl mx-auto">
              {generatedCourse.courseStructure?.courseMetadata?.description ||
                generatedCourse.courseMetadata?.description ||
                "Course description not available."}
            </p>
            <div className="flex justify-center mt-4 gap-2">
              <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm shadow-sm">
                {generatedCourse.courseStructure?.courseMetadata?.difficultyLevel ||
                  generatedCourse.courseMetadata?.difficultyLevel ||
                  "N/A"}
              </div>
              <div className="px-3 py-1 bg-white shadow-sm text-gray-800 rounded-full text-sm flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {generatedCourse.courseStructure?.modules?.length || generatedCourse.modules?.length || 0} Modules
              </div>
              <div className="px-3 py-1 bg-white shadow-sm text-gray-800 rounded-full text-sm flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {generatedCourse.courseStructure?.courseMetadata?.duration ||
                  generatedCourse.courseMetadata?.duration ||
                  "Self-paced"}
              </div>
            </div>
          </motion.div>

          {/* Course Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Prerequisites</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <ul className="space-y-2">
                {(generatedCourse.courseStructure?.courseMetadata?.prerequisites ||
                  generatedCourse.courseMetadata?.prerequisites ||
                  []).map((prereq, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <div className="h-2 w-2 bg-blue-600 rounded-full mr-2"></div>
                    <span>{prereq}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Course Schedule</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center">
                  <span className="font-medium w-24">Start Date:</span> Flexible
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-24">End Date:</span> Self-paced
                </p>
                <p className="flex items-center">
                  <span className="font-medium w-24">Commitment:</span> 3-5 hours/week
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Learning Outcomes</h3>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">Upon completion, you'll be able to:</p>
                <ul className="space-y-1">
                  {(generatedCourse.courseStructure?.courseMetadata?.learningOutcomes ||
                    generatedCourse.courseMetadata?.learningOutcomes ||
                    ["Apply concepts to real-world scenarios", "Complete projects independently"]).map((outcome, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <div className="h-2 w-2 bg-blue-600 rounded-full mr-2"></div>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Course Progress Tracker */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <LearningProgressTracker courseData={generatedCourse} />
          </motion.div>

          {/* Modules Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-6"
          >
            <h2 className="text-2xl font-bold text-gray-800">Course Modules</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>15 enrolled</span>
              </div>
              <div className="h-4 w-0.5 bg-gray-200"></div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4" />
                <span>Last updated 2 days ago</span>
              </div>
            </div>
          </motion.div>

          {/* Module Cards */}
          <div className="space-y-4">
            {(generatedCourse.courseStructure?.modules || generatedCourse.modules || []).map((module, index) => (
              <motion.div 
                key={module.moduleId}
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="group"
                onClick={() => handleModuleSelect(module)}
              >
                <Card className="border-l-4 border-l-blue-600 hover:shadow-md transition-all duration-300 cursor-pointer bg-white hover:bg-blue-50/50">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                            {module.title}
                          </h3>
                          <div className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Module {module.moduleId}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{module.duration}</span>
                          </div>
                          <div className="h-4 w-0.5 bg-gray-200"></div>
                          <div className="flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            <span>{module.subModules?.length || "Multiple"} lessons</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-3 text-gray-600">{module.description}</p>
                    {module.learningObjectives && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center">
                          <Sparkles className="h-4 w-4 mr-1 text-blue-600" />
                          Learning Objectives:
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {module.learningObjectives.map((obj, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <div className="h-2 w-2 bg-blue-600 rounded-full mr-2 mt-1.5"></div>
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        // Module Details View
        <div>
          {/* Module Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToCourse} 
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                aria-label="Back to Course"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to Course
              </Button>
              <div className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                Module {selectedModule.moduleId}
              </div>
            </div>
            
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">{selectedModule.title}</h2>
                <p className="text-gray-600">{selectedModule.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{selectedModule.duration}</span>
                  </div>
                  <div className="h-4 w-0.5 bg-gray-200"></div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>0% Complete</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden sm:block">
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Start Learning
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Learning Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8"
          >
            <LearningProgressTracker courseData={generatedCourse} />
          </motion.div>

          {/* Generate Learning Materials Panel */}
          {!learningResource && !isLoadingResource && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl mt-8 shadow-sm border border-blue-100"
            >
              <div className="flex items-start gap-6">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                    Generate Learning Materials
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Create comprehensive learning materials for this module, including articles, quizzes, 
                    and interactive resources tailored to your learning objectives.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleGenerateModuleResources} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md flex items-center gap-2"
                      aria-label="Generate Module Resources"
                    >
                      <Brain className="h-4 w-4" />
                      Generate Module Resources
                    </Button>
                    <Button variant="outline" className="border-gray-300 hover:bg-white/50">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoadingResource && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 mt-8 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl"></div>
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
              </div>
              <p className="text-gray-800 font-medium mt-6">Generating learning materials...</p>
              <p className="text-gray-500 text-sm mt-2">This might take a moment as we create personalized content for you</p>
            </motion.div>
          )}

          {/* Generated Learning Materials */}
          {learningResource && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="space-y-8 mt-8"
            >
              {/* Main Module Overview */}
              <Card className="shadow-sm overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
                  <h3 className="text-xl font-bold text-white">Module Overview</h3>
                </div>
                <CardContent className="p-6">
                  <div className="prose max-w-full">
                    <CustomMarkdownRenderer markdown={learningResource.content} />
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Learning Materials (Articles) */}
              {learningResource.subModules && learningResource.subModules.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    Detailed Learning Materials
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {learningResource.subModules.map((subModule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 * idx + 0.2 }}
                      >
                        <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer overflow-hidden border border-gray-100">
                          <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                          <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800 group-hover:text-blue-700 transition-colors">
                              {subModule.subModuleTitle}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{subModule.readingTime}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                              {subModule.tags?.map((tag, tagIdx) => (
                                <span 
                                  key={tagIdx} 
                                  className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <Button 
                              variant="outline" 
                              className="w-full mt-2 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors"
                              onClick={() => handleOpenArticle(subModule)}
                              aria-label={`Read article: ${subModule.subModuleTitle}`}
                            >
                              <BookOpen className="h-4 w-4 mr-2" />
                              Read Article
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Video Section */}
              {learningResource.videoUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="shadow-sm overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-6">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <PlayCircle className="h-6 w-6 mr-2" />
                        Video Lecture
                      </h2>
                    </div>
                    <CardContent className="p-6">
                      <div className="aspect-video mb-4 overflow-hidden rounded-lg shadow-md">
                        <iframe
                          title="Video Lecture"
                          className="w-full h-full"
                          src={convertToEmbedUrl(learningResource.videoUrl)}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">Transcript</h3>
                          <Button variant="outline" size="sm" className="text-xs" aria-label="Download transcript">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                        <div className="max-h-48 overflow-y-auto text-sm text-gray-600 prose-sm">
                          <CustomMarkdownRenderer markdown={learningResource.transcript} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Quizzes Section */}
              {learningResource.quizzes && learningResource.quizzes.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold">Knowledge Checks</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learningResource.quizzes.map((quiz, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 * idx + 0.2 }}
                      >
                        <Card className="hover:shadow-md transition-all duration-300 group border border-gray-100 overflow-hidden">
                          <div className="h-2 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                          <CardContent className="p-6 space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                              {quiz.quizTitle}
                            </h3>
                            <p className="text-sm text-gray-600">{quiz.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3 text-indigo-600" />
                                {quiz.difficulty} Level
                              </span>
                              <div className="h-3 w-0.5 bg-gray-200"></div>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-indigo-600" />
                                {quiz.timeLimit}
                              </span>
                              <div className="h-3 w-0.5 bg-gray-200"></div>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-indigo-600" />
                                Pass: {quiz.passingScore}%
                              </span>
                            </div>
                            <Button 
                              variant="outline" 
                              className="mt-3 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition-colors w-full justify-center"
                              onClick={() => handleOpenQuiz(quiz)}
                              aria-label={`Take quiz: ${quiz.quizTitle}`}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Take Quiz
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Additional Resources */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-4 px-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <Download className="h-5 w-5 mr-2" />
                      Additional Resources
                    </h2>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button variant="outline" className="justify-start p-4 h-auto flex-col items-start hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" aria-label="Download Materials">
                        <div className="p-2 bg-blue-100 rounded-lg mb-2">
                          <Download className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-800">Download Materials</h3>
                          <p className="text-xs text-gray-500 mt-1">Get offline access</p>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="justify-start p-4 h-auto flex-col items-start hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" aria-label="Save to Library">
                        <div className="p-2 bg-blue-100 rounded-lg mb-2">
                          <BookmarkPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-800">Save to Library</h3>
                          <p className="text-xs text-gray-500 mt-1">Bookmark module</p>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="justify-start p-4 h-auto flex-col items-start hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" aria-label="External Resources">
                        <div className="p-2 bg-blue-100 rounded-lg mb-2">
                          <ExternalLink className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium text-gray-800">External Resources</h3>
                          <p className="text-xs text-gray-500 mt-1">Explore additional materials</p>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}

      {/* ARTICLE MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-auto shadow-xl"
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{activeArticle.title}</h2>
              <button 
                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors" 
                onClick={() => setShowArticleModal(false)}
                aria-label="Close article"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="prose max-w-full">
                <CustomMarkdownRenderer markdown={activeArticle.content} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex justify-between">
              <Button variant="outline" onClick={() => setShowArticleModal(false)}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save Article
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {showQuizModal && activeQuiz && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto shadow-xl"
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{activeQuiz.quizTitle}</h2>
                <p className="text-sm text-gray-500">{activeQuiz.description}</p>
              </div>
              <button 
                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors" 
                onClick={handleCloseQuizModal}
                aria-label="Close quiz"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-6 py-5">
              {!quizSubmitted ? (
                <div className="space-y-6">
                  {activeQuiz.questions?.map((q, idx) => (
                    <div key={idx} className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
                      <p className="font-semibold mb-3 text-gray-800">
                        {idx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((option, optionIdx) => {
                          const optionLetter = option.charAt(0);
                          return (
                            <label 
                              key={optionIdx} 
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                                quizAnswers[idx] === optionLetter 
                                  ? "bg-blue-100 border border-blue-200" 
                                  : "bg-white border border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                quizAnswers[idx] === optionLetter 
                                  ? "bg-blue-600 text-white" 
                                  : "border border-gray-300"
                              }`}>
                                {quizAnswers[idx] === optionLetter && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <input
                                type="radio"
                                name={`question-${idx}`}
                                value={optionLetter}
                                checked={quizAnswers[idx] === optionLetter}
                                onChange={() => handleQuizAnswerChange(idx, optionLetter)}
                                className="sr-only"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <Button className="mt-4 w-full" onClick={handleSubmitQuiz}>
                    Submit Quiz
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg shadow-sm ${
                    passedQuiz ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${passedQuiz ? "bg-green-100" : "bg-red-100"}`}>
                        {passedQuiz 
                          ? <CheckCircle className="h-8 w-8 text-green-600" />
                          : <X className="h-8 w-8 text-red-600" />
                        }
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 text-gray-800">
                          {passedQuiz ? "Congratulations!" : "Quiz Results"}
                        </h3>
                        <p className="text-gray-600">
                          Your score: <span className="font-semibold">{quizScore}%</span> (Passing score: {activeQuiz.passingScore || 60}%)
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                      {passedQuiz ? (
                        <p className="text-green-700">You've successfully completed this knowledge check. Well done!</p>
                      ) : (
                        <p className="text-red-700">You didn't reach the passing score. Please review the material and try again.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex justify-between">
              {!quizSubmitted ? (
                <>
                  <Button variant="outline" onClick={handleCloseQuizModal}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSubmitQuiz}
                  >
                    Submit Quiz
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleOpenQuiz(activeQuiz)}
                    className="border-blue-200 text-blue-700"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleCloseQuizModal}
                  >
                    Continue Learning
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
