"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
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
  BookmarkPlus
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CustomMarkdownRenderer from "./ui/CustomMarkdownRenderer";

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
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI tutor. Enter a prompt to generate a course on any topic you'd like to learn about.",
    },
  ]);
  const chatContainerRef = useRef(null);
  const resourceRef = useRef(null);

  useEffect(() => {
    setIsFormValid(coursePrompt.trim() !== "");
  }, [coursePrompt]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (resourceRef.current && learningResource) {
      resourceRef.current.scrollTop = 0;
    }
  }, [learningResource]);

  const handleGenerateCourse = async (event) => {
    event.preventDefault();
    
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // API call to generate course
      const response = await fetch('http://localhost:8007/api/courses/simplified/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: coursePrompt,
          difficultyLevel: "Intermediate",
          moduleCount: 4
        }),
      });
      
      const data = await response.json();
      
      // Log the generated course to console
      console.log("Generated Course Structure:", data);
      
      setGeneratedCourse(data);
      setActiveTab("course"); // Switch to course tab after generation
      
      // Add a message showing success
      setMessages([
        ...messages,
        {
          role: "user",
          content: `Generate a course about: ${coursePrompt}`,
        },
        {
          role: "ai",
          content: `I've generated a course structure for "${coursePrompt}". I've opened the course tab where you can explore the modules and start learning.`,
        },
      ]);
      
    } catch (error) {
      console.error("Error generating course:", error);
      
      setMessages([
        ...messages,
        {
          role: "user",
          content: `Generate a course about: ${coursePrompt}`,
        },
        {
          role: "ai",
          content: "I'm sorry, there was an error generating your course. Please try again with a different topic.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a module
  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setLearningResource(null);
  };

  // Clear selected module
  const handleBackToCourse = () => {
    setSelectedModule(null);
    setLearningResource(null);
  };

  // Generate detailed learning resources for a concept
  const handleGenerateLearningResource = async (concept) => {
    if (!selectedModule) return;
    
    setIsLoadingResource(true);
    
    try {
      // Prepare the request
      const request = {
        topic: generatedCourse.courseStructure.courseMetadata.title,
        moduleTitle: selectedModule.title,
        conceptTitle: concept.conceptTitle,
        format: "markdown",
        contentType: "technical", // You can make this dynamic based on the concept
        detailLevel: 4,
        specificRequirements: [
          "Include detailed explanations with examples",
          "Add tables for comparing related concepts",
          "Include mathematical notation where appropriate",
          "Format code examples with syntax highlighting"
        ]
      };
      
      // Make API call to generate learning resource
      const response = await fetch('http://localhost:8007/api/learning-resources/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      console.log("Generated Learning Resource:", data);
      
      // Update state with the generated resource
      setLearningResource(data);
      
      // Add message to chat
      setMessages([
        ...messages,
        {
          role: "user",
          content: `Generate detailed resources for "${concept.conceptTitle}"`,
        },
        {
          role: "ai",
          content: `I've created comprehensive learning materials for "${concept.conceptTitle}". You can view them in the course tab.`,
        },
      ]);
      
    } catch (error) {
      console.error("Error generating learning resource:", error);
      
      setMessages([
        ...messages,
        {
          role: "user",
          content: `Generate detailed resources for "${concept.conceptTitle}"`,
        },
        {
          role: "ai",
          content: "I'm sorry, there was an error generating the detailed learning resources. Please try again later.",
        },
      ]);
    } finally {
      setIsLoadingResource(false);
    }
  };

  // Generate comprehensive module resources
  const handleGenerateModuleResources = async () => {
    if (!selectedModule) return;
    
    setIsLoadingResource(true);
    
    try {
      // Make API call to generate all resources for this module
      const response = await fetch('http://localhost:8007/api/learning-resources/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: generatedCourse.courseStructure.courseMetadata.title,
          moduleTitle: selectedModule.title,
          format: "markdown",
          contentType: "comprehensive",
          detailLevel: 5,
          specificRequirements: [
            "Create a comprehensive guide covering all concepts in the module",
            "Include tables, diagrams, and examples",
            "Add practical exercises and applications",
            "Include reference materials and further reading"
          ]
        }),
      });
      
      const data = await response.json();
      console.log("Generated Module Resources:", data);
      
      // Update state with the generated resource
      setLearningResource(data);
      
      // Add message to chat
      setMessages([
        ...messages,
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
      
      setMessages([
        ...messages,
        {
          role: "user",
          content: `Generate comprehensive materials for the entire "${selectedModule.title}" module`,
        },
        {
          role: "ai",
          content: "I'm sorry, there was an error generating the module resources. Please try again later.",
        },
      ]);
    } finally {
      setIsLoadingResource(false);
    }
  };

  // Mock data for previous classes
  const previousClasses = [
    { id: 1, name: "Introduction to Algebra", date: "2024-03-01" },
    { id: 2, name: "Basic Geometry", date: "2024-03-05" },
    { id: 3, name: "Trigonometry Fundamentals", date: "2024-03-10" },
  ];

  // Mock data for notes
  const notes = [
    { id: 1, title: "Algebra Formulas", content: "a^2 + b^2 = c^2", date: "2024-03-02" },
    { id: 2, title: "Geometry Shapes", content: "Circle, Square, Triangle", date: "2024-03-06" },
    { id: 3, title: "Trig Functions", content: "sin, cos, tan", date: "2024-03-11" },
  ];

  // Mock data for learning graph
  const learningData = [
    { date: '2024-03-01', minutes: 30 },
    { date: '2024-03-02', minutes: 45 },
    { date: '2024-03-03', minutes: 60 },
    { date: '2024-03-04', minutes: 40 },
    { date: '2024-03-05', minutes: 55 },
    { date: '2024-03-06', minutes: 50 },
    { date: '2024-03-07', minutes: 70 },
  ];

  // Calculate total XP (1 minute = 1 XP)
  const totalXP = learningData.reduce((sum, day) => sum + day.minutes, 0);


  return (
    (<div
      className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header
        className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">AI Tutor</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <div
            className="flex items-center bg-primary text-white px-3 py-1 rounded-full text-sm">
            <Star className="h-4 w-4 mr-1" />
            <span>{totalXP} XP</span>
          </div>
          <button
            className={`text-sm font-medium transition-colors ${activeTab === "dashboard" ? "text-primary" : "hover:text-primary"}`}
            onClick={() => setActiveTab("dashboard")}>
            Dashboard
          </button>
          <button
            className={`text-sm font-medium transition-colors ${activeTab === "course" ? "text-primary" : "hover:text-primary"}`}
            onClick={() => generatedCourse && setActiveTab("course")}>
            Course
          </button>
          <button
            className={`text-sm font-medium transition-colors ${activeTab === "chat" ? "text-primary" : "hover:text-primary"}`}
            onClick={() => setActiveTab("chat")}>
            Chat
          </button>
        </nav>
      </header>
      <main className="flex-1 py-8 md:py-12">
        <div className="">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="course" disabled={!generatedCourse}>Course Content</TabsTrigger>
              <TabsTrigger value="chat">AI Tutor Chat</TabsTrigger>
            </TabsList>
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className=" mx-auto space-y-8">
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Your Learning Dashboard
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mx-auto">
                    Track your progress, review past classes, and continue your learning journey.
                  </p>
                </div>
                
                {generatedCourse && (
                  <Card className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Book className="h-6 w-6" />
                          <h2 className="text-xl font-semibold">
                            Your Generated Course is Ready!
                          </h2>
                        </div>
                        <p>
                          Your course on "<span className="font-semibold">{coursePrompt}</span>" has been generated successfully.
                        </p>
                        <div className="text-sm opacity-90">
                          <p className="font-medium">Course Title: {generatedCourse.courseStructure?.courseMetadata?.title || "N/A"}</p>
                          <p>Difficulty: {generatedCourse.courseStructure?.courseMetadata?.difficultyLevel || "N/A"}</p>
                          <p>Modules: {generatedCourse.courseStructure?.modules?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-indigo-600/50 p-4">
                      <Button 
                        variant="secondary" 
                        className="ml-auto flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setActiveTab("course")}>
                        View Course <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="w-full">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-6 w-6 text-primary" />
                          <h2 className="text-xl font-semibold">Previous Classes</h2>
                        </div>
                        <ul className="space-y-2">
                          {previousClasses.map((cls) => (
                            <li key={cls.id} className="flex justify-between items-center p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-5 w-5 text-primary/70" />
                                <span>{cls.name}</span>
                              </div>
                              <span className="text-sm text-gray-500">{cls.date}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="w-full">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-6 w-6 text-primary" />
                          <h2 className="text-xl font-semibold">Notes Taken</h2>
                        </div>
                        <ul className="space-y-2">
                          {notes.map((note) => (
                            <li key={note.id} className="space-y-1 p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{note.title}</span>
                                <span className="text-sm text-gray-500">{note.date}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{note.content}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-semibold">Learning Time</h2>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={learningData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="minutes" stroke="#8884d8" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="coursePrompt"
                          className="text-xl font-semibold flex items-center gap-2 mb-4">
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
                          className={`w-full text-lg py-6 ${
                            showValidationError && !coursePrompt.trim()
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {showValidationError && !coursePrompt.trim() && (
                          <p className="text-sm text-red-500 mt-2">
                            Please enter a topic for your course
                          </p>
                        )}
                      </div>
                      <Button
                        size="lg"
                        className={`w-full mt-4 py-6 rounded-lg transition-all duration-300 ${
                          isFormValid
                            ? "bg-primary hover:bg-primary-dark"
                            : "bg-gray-300 dark:bg-gray-700"
                        }`}
                        onClick={handleGenerateCourse}
                        disabled={isLoading}>
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
            
            {/* Course Content Tab */}
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
                        {generatedCourse.courseMetadata?.title || "Course Title Not Available"}
                      </h1>
                      <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-[700px] mx-auto">
                        {generatedCourse.courseMetadata?.description || "Course description not available."}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {generatedCourse.courseMetadata?.difficultyLevel || "N/A"}
                        </div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                          <Layers className="h-4 w-4 mr-1" />
                          {generatedCourse.modules?.length} Modules
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
                          {generatedCourse.courseMetadata?.prerequisites?.map((prereq, index) => (
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
                      {generatedCourse.modules?.map((module, idx) => (
                        <Card key={module.moduleId} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary">
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
                  // Selected Module view goes here
                  <div>
                    {/* Your selected module content and resource rendering */}
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
                  <Button onClick={() => setActiveTab("dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                    AI Tutor Chat
                  </h1>
                  <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                    Ask questions, get explanations, and deepen your understanding of the course material.
                  </p>
                </div>
                
                <Card className="w-full">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div
                        ref={chatContainerRef}
                        className="h-96 overflow-y-auto border rounded-md p-4 space-y-4"
                      >
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg ${
                              message.role === "ai"
                                ? "bg-primary/10 text-primary-foreground mr-12"
                                : "bg-muted ml-12"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {message.role === "ai" ? (
                                <Brain className="h-6 w-6 text-primary mt-1" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                  U
                                </div>
                              )}
                              <div>
                                <p className="font-bold mb-1">
                                  {message.role === "ai" ? "AI Tutor" : "You"}
                                </p>
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
                            if (e.key === 'Enter' && coursePrompt.trim()) {
                              setMessages([
                                ...messages,
                                {
                                  role: "user",
                                  content: coursePrompt,
                                },
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
                              setMessages([
                                ...messages,
                                {
                                  role: "user",
                                  content: coursePrompt,
                                },
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
      <footer
        className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 AI Tutor. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Cookie Policy
          </Link>
        </nav>
      </footer>
    </div>)
  );
}