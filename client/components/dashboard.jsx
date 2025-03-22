"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LearningProgressTracker from "./LearningProgressTracker"; // or wherever your tracker is
import "katex/dist/katex.min.css";
import {
  Brain,
  Book,
  FileText,
  Clock,
  Star,
  Loader2,
  ChevronRight,
  Layers,
  Award,
  BookOpen,
  Calendar,
  ArrowRight,
  Play,
  PlayCircle,
  Sparkles,
  Download,
  BookmarkPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import CustomMarkdownRenderer from "./ui/CustomMarkdownRenderer";

// Raw course suggestions for Maths and Science
const rawCourses = [
  {
    title: "Mathematics: Algebra Basics",
    description: "Learn the fundamentals of algebra, including solving equations and working with variables.",
  },
  {
    title: "Mathematics: Geometry Essentials",
    description: "Discover the basics of geometry, shapes, theorems, and proofs.",
  },
  {
    title: "Science: Physics Fundamentals",
    description: "Explore the fundamental principles of physics, including mechanics and energy.",
  },
  {
    title: "Science: Chemistry Essentials",
    description: "Understand the basics of chemistry, including elements, compounds, and reactions.",
  },
];

export function DashboardComponent() {
  const [coursePrompt, setCoursePrompt] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingResource, setIsLoadingResource] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [learningResource, setLearningResource] = useState(null);

  // Article modal state
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [activeArticle, setActiveArticle] = useState({ title: "", content: "" });

  // Quiz modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [passedQuiz, setPassedQuiz] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI tutor. Enter a prompt to generate a course on any topic you'd like to learn about.",
    },
  ]);
  const chatContainerRef = useRef(null);
  const resourceRef = useRef(null);

  // Helper: Convert YouTube watch URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    return url.replace("watch?v=", "embed/");
  };

  useEffect(() => {
    setIsFormValid(coursePrompt.trim() !== "");
  }, [coursePrompt]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (resourceRef.current && learningResource) {
      resourceRef.current.scrollTop = 0;
    }
  }, [learningResource]);

  // NEW: When a suggested course is clicked, set prompt and trigger course generation
  const handleSelectRawCourse = async (rawCourse) => {
    setCoursePrompt(rawCourse.title);
    // Optionally, auto-generate the course. Here, we simulate an event.
    await handleGenerateCourse({ preventDefault: () => {} });
  };

  const handleGenerateCourse = async (event) => {
    event.preventDefault();

    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }

    setIsLoading(true);

    try {
      // API call to generate course
      const response = await fetch("http://localhost:8007/api/courses/simplified/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: coursePrompt,
          difficultyLevel: "Intermediate",
          moduleCount: 4,
        }),
      });

      const data = await response.json();
      console.log("Generated Course Structure:", data);

      setGeneratedCourse(data);
      setActiveTab("course");

      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: `I've generated a course structure for "${coursePrompt}". I've opened the course tab where you can explore the modules and start learning.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating course:", error);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content:
            "I'm sorry, there was an error generating your course. Please try again with a different topic.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setLearningResource(null);
    console.log(`Selected module: ${module.title}`);
  };

  const handleBackToCourse = () => {
    setSelectedModule(null);
    setLearningResource(null);
  };

  const handleGenerateLearningResource = async (concept) => {
    if (!selectedModule) return;

    setIsLoadingResource(true);

    try {
      const request = {
        moduleTitle: selectedModule.title,
        conceptTitle: concept,
        format: "markdown",
        contentType: "technical",
        detailLevel: 4,
        specificRequirements: [
          "Include detailed explanations with examples",
          "Add tables for comparing related concepts",
          "Include mathematical notation where appropriate",
          "Format code examples with syntax highlighting",
        ],
      };

      if (generatedCourse?.courseStructure?.courseMetadata?.title) {
        request.topic = generatedCourse.courseStructure.courseMetadata.title;
      } else if (generatedCourse?.courseMetadata?.title) {
        request.topic = generatedCourse.courseMetadata.title;
      }

      console.log("Generating learning resource with request:", request);

      const response = await fetch("http://localhost:8007/api/learning-resources/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Generated Learning Resource:", data);
      setLearningResource(data);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate detailed resources for "${
            typeof concept === "string" ? concept : concept.conceptTitle
          }"`,
        },
        {
          role: "ai",
          content: `I've created comprehensive learning materials for "${
            typeof concept === "string" ? concept : concept.conceptTitle
          }". You can view them in the course tab.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating learning resource:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate detailed resources for "${
            typeof concept === "string" ? concept : concept.conceptTitle
          }"`,
        },
        {
          role: "ai",
          content:
            "I'm sorry, there was an error generating the detailed learning resources. Please try again later.",
        },
      ]);
    } finally {
      setIsLoadingResource(false);
    }
  };

  const handleGenerateModuleResources = async () => {
    if (!selectedModule) return;

    setIsLoadingResource(true);

    try {
      const request = {
        moduleTitle: selectedModule.title,
        format: "markdown",
        contentType: "comprehensive",
        detailLevel: 5,
      };

      if (generatedCourse?.courseStructure?.courseMetadata?.title) {
        request.topic = generatedCourse.courseStructure.courseMetadata.title;
      } else if (generatedCourse?.courseMetadata?.title) {
        request.topic = generatedCourse.courseMetadata.title;
      }

      request.specificRequirements = [
        `Create a comprehensive guide for the module: ${selectedModule.title}`,
        "Include detailed explanations with examples, diagrams, and code samples where appropriate",
        "Structure content with clear sections, learning objectives, and summaries",
        "Provide practical exercises and applications",
      ];

      if (selectedModule.learningObjectives && selectedModule.learningObjectives.length > 0) {
        request.specificRequirements.push(
          `Address the following learning objectives: ${selectedModule.learningObjectives.join(", ")}`
        );
      }

      console.log("Generating module resources with request:", request);

      const response = await fetch("http://localhost:8007/api/learning-resources/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Generated Module Resources:", data);
      setLearningResource(data);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Generate comprehensive materials for the entire "${selectedModule.title}" module`,
        },
        {
          role: "ai",
          content: `I've created detailed learning materials for the entire "${selectedModule.title}" module. You can view them in the course tab.`,
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
          content:
            "I'm sorry, there was an error generating the module resources. Please try again later.",
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
      { role: "ai", content: `Here's the content for "${subModule.subModuleTitle}". I've displayed it below.` },
    ]);

    setActiveArticle({ title: subModule.subModuleTitle, content: subModule.article });
    setShowArticleModal(true);
  };

  // QUIZ LOGIC
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
    const totalQuestions = activeQuiz.questions.length;

    activeQuiz.questions.forEach((q, idx) => {
      const userAnswer = quizAnswers[idx];
      if (userAnswer && userAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
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

  useEffect(() => {
    if (!localStorage.getItem("readArticles")) {
      localStorage.setItem("readArticles", JSON.stringify([]));
    }
  }, []);

  // Mock data for previous classes, notes, and learning graph
  const previousClasses = [
    { id: 1, name: "Introduction to Algebra", date: "2024-03-01" },
    { id: 2, name: "Basic Geometry", date: "2024-03-05" },
    { id: 3, name: "Trigonometry Fundamentals", date: "2024-03-10" },
  ];

  const notes = [
    { id: 1, title: "Algebra Formulas", content: "a^2 + b^2 = c^2", date: "2024-03-02" },
    { id: 2, title: "Geometry Shapes", content: "Circle, Square, Triangle", date: "2024-03-06" },
    { id: 3, title: "Trig Functions", content: "sin, cos, tan", date: "2024-03-11" },
  ];

  const learningData = [
    { date: "2024-03-01", minutes: 30 },
    { date: "2024-03-02", minutes: 45 },
    { date: "2024-03-03", minutes: 60 },
    { date: "2024-03-04", minutes: 40 },
    { date: "2024-03-05", minutes: 55 },
    { date: "2024-03-06", minutes: 50 },
    { date: "2024-03-07", minutes: 70 },
  ];

  const totalXP = learningData.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* HEADER */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">AI Tutor</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <div className="flex items-center bg-primary text-white px-3 py-1 rounded-full text-sm">
            <Star className="h-4 w-4 mr-1" />
            <span>{totalXP} XP</span>
          </div>
          <button
            className={`text-sm font-medium transition-colors ${activeTab === "dashboard" ? "text-primary" : "hover:text-primary"}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`text-sm font-medium transition-colors ${activeTab === "course" ? "text-primary" : "hover:text-primary"}`}
            onClick={() => generatedCourse && setActiveTab("course")}
          >
            Course
          </button>
          <button
            className={`text-sm font-medium transition-colors ${activeTab === "chat" ? "text-primary" : "hover:text-primary"}`}
            onClick={() => setActiveTab("chat")}
          >
            Chat
          </button>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 py-8 md:py-12">
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="course" disabled={!generatedCourse}>
                Course Content
              </TabsTrigger>
              <TabsTrigger value="chat">AI Tutor Chat</TabsTrigger>
            </TabsList>

            {/* DASHBOARD TAB */}
            <TabsContent value="dashboard" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto space-y-8 max-w-6xl"
              >
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Welcome ! Sanjay Paul 
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mx-auto">
                    Track your progress, review past classes, and continue your learning journey.
                  </p>
                </div>

                {/* Suggested Courses Section */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-center">Suggested Courses</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {rawCourses.map((course, idx) => (
                      <Card key={idx} className="cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleSelectRawCourse(course)}>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold">{course.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">{course.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Existing Generate New Course Section */}
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="coursePrompt" className="text-xl font-semibold flex items-center gap-2 mb-4">
                          <Brain className="h-6 w-6 text-primary" />
                          Generate a New Course
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                          Enter any topic you'd like to learn, and I'll create a personalized course structure for you.
                        </p>
                        <Input
                          id="coursePrompt"
                          placeholder="e.g., Machine Learning with Python, Web Development, Blockchain Technology"
                          value={coursePrompt}
                          onChange={(e) => setCoursePrompt(e.target.value)}
                          className={`w-full text-lg py-6 ${showValidationError && !coursePrompt.trim() ? "border-red-500" : ""}`}
                        />
                        {showValidationError && !coursePrompt.trim() && (
                          <p className="text-sm text-red-500 mt-2">Please enter a topic for your course</p>
                        )}
                      </div>
                      <Button
                        size="lg"
                        className={`w-full mt-4 py-6 rounded-lg transition-all duration-300 ${isFormValid ? "bg-primary hover:bg-primary-dark" : "bg-gray-300 dark:bg-gray-700"}`}
                        onClick={handleGenerateCourse}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating Your Personalized Course...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-5 w-5" />
                            Generate Course Structure
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* COURSE CONTENT TAB */}
            <TabsContent value="course" className="space-y-6">
              {generatedCourse && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-5xl mx-auto"
                >
                  {!selectedModule ? (
                    <>
                      {/* Course Header */}
                      <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                          {generatedCourse.courseStructure?.courseMetadata?.title ||
                            generatedCourse.courseMetadata?.title ||
                            "Course Title Not Available"}
                        </h1>
                        <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-[700px] mx-auto">
                          {generatedCourse.courseStructure?.courseMetadata?.description ||
                            generatedCourse.courseMetadata?.description ||
                            "Course description not available."}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            {generatedCourse.courseStructure?.courseMetadata?.difficultyLevel ||
                              generatedCourse.courseMetadata?.difficultyLevel ||
                              "N/A"}
                          </div>
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                            <Layers className="h-4 w-4 mr-1" />
                            {(
                              generatedCourse.courseStructure?.modules?.length ||
                              generatedCourse.modules?.length ||
                              0
                            )} Modules
                          </div>
                        </div>
                      </div>

                      {/* Prerequisites */}
                      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 mb-8">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b">
                          <h2 className="text-xl font-semibold">Prerequisites</h2>
                        </div>
                        <div className="p-5">
                          <ul className="space-y-2">
                            {(
                              generatedCourse.courseStructure?.courseMetadata?.prerequisites ||
                              generatedCourse.courseMetadata?.prerequisites ||
                              []
                            ).map((prereq, index) => (
                              <li key={index} className="flex items-center">
                                <ChevronRight className="h-5 w-5 mr-2 text-primary shrink-0" />
                                <span>{prereq}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Modules */}
                      <h2 className="text-2xl font-bold mt-8 mb-4">Course Modules</h2>
                      <div className="space-y-4">
                        {(
                          generatedCourse.courseStructure?.modules || generatedCourse.modules || []
                        ).map((module) => (
                          <Card
                            key={module.moduleId}
                            className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary cursor-pointer"
                            onClick={() => handleModuleSelect(module)}
                          >
                            <CardContent className="p-0">
                              <div className="p-5">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h3 className="text-xl font-semibold">{module.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{module.duration}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      Module {module.moduleId}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-3">{module.description}</p>
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-500 mb-2">Learning Objectives:</h4>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4">
                                    {module.learningObjectives?.map((objective, idx) => (
                                      <li key={idx} className="flex items-start text-sm">
                                        <ChevronRight className="h-5 w-5 mr-2 text-primary shrink-0" />
                                        <span>{objective}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    // SELECTED MODULE VIEW
                    <div ref={resourceRef} className="space-y-6">
                      <div className="flex items-center space-x-2 mb-6">
                        <Button variant="outline" size="sm" onClick={handleBackToCourse} className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          Back to Course
                        </Button>
                        <div className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Module {selectedModule.moduleId}
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold mt-8 mb-4">Learning Progress</h2>
                      <LearningProgressTracker courseData={generatedCourse} />

                      <div className="border-b pb-6 mb-6">
                        <h1 className="text-3xl font-bold tracking-tighter">{selectedModule.title}</h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">{selectedModule.description}</p>
                        <div className="flex items-center mt-4 text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{selectedModule.duration}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2 flex items-center">
                          <Award className="h-5 w-5 mr-2 text-primary" />
                          Learning Objectives
                        </h2>
                        <ul className="space-y-2 pl-8">
                          {selectedModule.learningObjectives?.map((objective, idx) => (
                            <li key={idx} className="list-disc text-gray-700 dark:text-gray-300">{objective}</li>
                          ))}
                        </ul>
                      </div>

                      {!learningResource && !isLoadingResource && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mt-6">
                          <h2 className="text-lg font-semibold mb-2 flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                            Generate Learning Materials
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Generate comprehensive materials for this entire module to start learning.
                          </p>
                          <Button onClick={handleGenerateModuleResources} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Brain className="h-4 w-4" />
                            Generate Module Resources
                          </Button>
                        </div>
                      )}

                      {isLoadingResource && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">Generating comprehensive learning materials...</p>
                        </div>
                      )}

                      {learningResource && (
                        <div className="space-y-8">
                          <Card className="overflow-hidden">
                            <CardContent className="p-6">
                              <div className="prose dark:prose-invert max-w-full">
                                <CustomMarkdownRenderer markdown={learningResource.content} />
                              </div>
                            </CardContent>
                          </Card>

                          {learningResource.subModules && learningResource.subModules.length > 0 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold">Detailed Learning Materials</h2>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {learningResource.subModules.map((subModule, index) => (
                                  <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                      <h3 className="text-lg font-semibold mb-2">{subModule.subModuleTitle}</h3>
                                      <div className="flex items-center text-sm text-gray-500 mb-3">
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span>{subModule.readingTime}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mb-4">
                                        {subModule.tags?.map((tag, idx) => (
                                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{tag}</span>
                                        ))}
                                      </div>
                                      <Button variant="outline" className="w-full mt-2" onClick={() => handleOpenArticle(subModule)}>
                                        Read Article
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {learningResource.videoUrl && (
                            <Card className="overflow-hidden">
                              <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-4 flex items-center">
                                  <PlayCircle className="h-6 w-6 mr-2 text-primary" />
                                  Video Lecture
                                </h2>
                                <div className="aspect-video mb-4">
                                  <iframe
                                    className="w-full h-full rounded-lg"
                                    src={convertToEmbedUrl(learningResource.videoUrl)}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                  <h3 className="font-semibold mb-2">Transcript</h3>
                                  <div className="max-h-48 overflow-y-auto text-sm">
                                    <CustomMarkdownRenderer markdown={learningResource.transcript} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {learningResource.quizzes && learningResource.quizzes.length > 0 && (
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold">Quizzes</h2>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {learningResource.quizzes.map((quiz, index) => (
                                  <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6 space-y-3">
                                      <h3 className="text-lg font-semibold">{quiz.quizTitle}</h3>
                                      <p className="text-sm text-gray-500">{quiz.description}</p>
                                      <div className="text-xs text-gray-400 flex gap-4">
                                        <span>Difficulty: {quiz.difficulty}</span>
                                        <span>Time Limit: {quiz.timeLimit}</span>
                                        <span>Passing Score: {quiz.passingScore}%</span>
                                      </div>
                                      <Button variant="outline" className="mt-3" onClick={() => handleOpenQuiz(quiz)}>
                                        Take Quiz
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          <Card>
                            <CardContent className="p-6">
                              <h2 className="text-xl font-bold mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-primary" />
                                Additional Resources
                              </h2>
                              <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Full Materials
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                  <BookmarkPlus className="h-4 w-4 mr-2" />
                                  Save to My Library
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {!generatedCourse && (
                <div className="text-center py-20">
                  <Book className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-400 dark:text-gray-500 mb-2">No Course Generated Yet</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    Generate a course from the dashboard to see its content here.
                  </p>
                  <Button onClick={() => setActiveTab("dashboard")}>Go to Dashboard</Button>
                </div>
              )}
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">AI Tutor Chat</h1>
                  <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                    Ask questions, get explanations, and deepen your understanding of the course material.
                  </p>
                </div>

                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div ref={chatContainerRef} className="h-96 overflow-y-auto border rounded-md p-4 space-y-4">
                        {messages.map((message, index) => (
                          <div key={index} className={`p-4 rounded-lg ${message.role === "ai" ? "bg-primary/10 text-primary-foreground mr-12" : "bg-muted ml-12"}`}>
                            <div className="flex items-start gap-3">
                              {message.role === "ai" ? (
                                <Brain className="h-6 w-6 text-primary mt-1" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">U</div>
                              )}
                              <div>
                                <p className="font-bold mb-1">{message.role === "ai" ? "AI Tutor" : "You"}</p>
                                <p>{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 items-end">
                        <Input
                          placeholder="Ask a question about your course..."
                          className="flex-1"
                          value={coursePrompt}
                          onChange={(e) => setCoursePrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && coursePrompt.trim()) {
                              setMessages((prev) => [
                                ...prev,
                                { role: "user", content: coursePrompt },
                                {
                                  role: "ai",
                                  content: `I'd be happy to help with "${coursePrompt}". To provide more specific guidance, try exploring the course content in the Course tab.`,
                                },
                              ]);
                              setCoursePrompt("");
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            if (coursePrompt.trim()) {
                              setMessages((prev) => [
                                ...prev,
                                { role: "user", content: coursePrompt },
                                {
                                  role: "ai",
                                  content: `I'd be happy to help with "${coursePrompt}". To provide more specific guidance, try exploring the course content in the Course tab.`,
                                },
                              ]);
                              setCoursePrompt("");
                            }
                          }}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 AI Tutor. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">Terms of Service</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">Privacy Policy</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">Cookie Policy</Link>
        </nav>
      </footer>

      {/* ARTICLE MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-auto p-6 relative">
            <button className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2" onClick={() => setShowArticleModal(false)}>
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-bold mb-4">{activeArticle.title}</h2>
            <div className="prose dark:prose-invert max-w-full">
              <CustomMarkdownRenderer markdown={activeArticle.content} />
            </div>
          </div>
        </div>
      )}

      {/* QUIZ MODAL */}
      {showQuizModal && activeQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[85vh] overflow-auto p-6 relative">
            <button className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2" onClick={handleCloseQuizModal}>
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-bold mb-4">{activeQuiz.quizTitle}</h2>
            <p className="text-sm text-gray-500 mb-4">{activeQuiz.description}</p>
            {!quizSubmitted ? (
              <div className="space-y-6">
                {activeQuiz.questions?.map((q, idx) => (
                  <div key={idx} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                    <p className="font-semibold mb-2">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option, optionIdx) => {
                        const optionLetter = option.charAt(0);
                        return (
                          <label key={optionIdx} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name={`question-${idx}`}
                              value={optionLetter}
                              checked={quizAnswers[idx] === optionLetter}
                              onChange={() => handleQuizAnswerChange(idx, optionLetter)}
                            />
                            <span>{option}</span>
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
                <div className={`p-4 rounded-md ${passedQuiz ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}>
                  <h3 className="text-xl font-bold mb-2">{passedQuiz ? "Congratulations!" : "Quiz Results"}</h3>
                  <p>Your score: <strong>{quizScore}%</strong></p>
                  <p>Passing score: <strong>{activeQuiz.passingScore || 60}%</strong></p>
                  {passedQuiz ? (
                    <p className="mt-2 text-green-700 dark:text-green-300">
                      You passed! Great job. You can proceed to more advanced modules or revisit the submodules if you’d like a refresher.
                    </p>
                  ) : (
                    <p className="mt-2 text-red-700 dark:text-red-300">
                      You didn't reach the passing score. Review the submodules and try again, or check out the advanced explanation to clarify any misunderstandings.
                    </p>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p className="mb-2">
                    **Next Steps:**  
                    - If you scored below the passing threshold, consider re-reading the submodules or reviewing the advanced article.  
                    - If you passed, congratulations! You can explore other quizzes or move on to the next module.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleOpenQuiz(activeQuiz)}>Retake Quiz</Button>
                  <Button onClick={handleCloseQuizModal}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
