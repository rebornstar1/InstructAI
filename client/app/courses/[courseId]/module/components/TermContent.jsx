"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  PlayCircle,
  HelpCircle,
  BookOpen,
  Settings,
  Loader2,
  CheckCircle,
  BookmarkCheck,
  LucideLoader,
  Brain
} from "lucide-react";

import CustomMarkdownRenderer from "@/components/ui/CustomMarkdownRenderer";
import UpdatedArticleProgressTracker from "./ArticleProgressTracker";
import UpdatedVideoProgressTracker from "./VideoProgressTracker";
import UpdatedEnhancedQuiz from "./EnhancedQuiz";

/**
 * Component to display term content with progress tracking
 * 
 * @param {Object} props
 * @param {number} props.moduleId - The ID of the module
 * @param {Object} props.termContent - The term content data
 * @param {Function} props.onResourceComplete - Callback when a resource is completed
 * @param {boolean} props.isGenerating - Whether content is being generated
 * @param {Function} props.onGenerateContent - Callback to generate term content
 */
export default function TermContent({
  moduleId,
  termContent,
  onResourceComplete,
  isGenerating,
  onGenerateContent
}) {
  const [activeTab, setActiveTab] = useState("article");
  const [quizCompleted, setQuizCompleted] = useState(
    termContent?.resourceProgress?.quizCompleted || false
  );
  const [articleCompleted, setArticleCompleted] = useState(
    termContent?.resourceProgress?.articleCompleted || false
  );
  const [videoCompleted, setVideoCompleted] = useState(
    termContent?.resourceProgress?.videoCompleted || false
  );

  console.log("Term Content:", termContent);

  // Update completion states when termContent changes
  useEffect(() => {
    if (termContent && termContent.resourceProgress) {
      setQuizCompleted(termContent.resourceProgress.quizCompleted || false);
      setArticleCompleted(termContent.resourceProgress.articleCompleted || false);
      setVideoCompleted(termContent.resourceProgress.videoCompleted || false);
    }
  }, [termContent]);

  // If no term content and not generating, show generate button
  if (!termContent && !isGenerating) {
    return (
      <Card className="border-none shadow-lg overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/path/to/pattern.svg')] opacity-10"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-6">
              <Brain className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Generate Learning Content</h2>
            <p className="max-w-xl text-white/80 mb-8">
              Generate comprehensive learning materials for this key term, including an interactive article, 
              quiz, and supporting video content.
            </p>
            <Button 
              onClick={onGenerateContent} 
              className="bg-white text-blue-700 hover:bg-white/90 hover:text-blue-800 shadow-lg px-8 py-6"
            >
              <Settings className="h-5 w-5 mr-2" />
              Generate Content
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Loading state while generating
  if (isGenerating) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-20 text-center space-y-4"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-2xl opacity-70"></div>
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          </div>
        </div>
        <div className="max-w-md">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Generating learning materials
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            We're creating comprehensive content for this key term. This may take a moment as we personalize 
            materials for your learning.
          </p>
        </div>
        <div className="w-full max-w-md mt-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ width: "10%" }}
              animate={{ 
                width: ["10%", "30%", "50%", "70%", "90%"],
              }}
              transition={{ 
                duration: 3, 
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Helper to convert YouTube watch URL to embed URL
  const convertToEmbedUrl = (url) => {
    if (!url) return "";
    
    // If it's already an embed URL, return it
    if (url.includes('embed')) {
      return url;
    }
    
    // Convert regular watch URL to embed URL
    return url.replace("watch?v=", "embed/");
  };

  // When all resources are completed
  const allCompleted = articleCompleted && 
    (videoCompleted || !termContent.videoUrl) && 
    (quizCompleted || !termContent.quiz);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4 grid grid-cols-3 h-auto p-1">
        <TabsTrigger 
          value="article" 
          className="relative py-2 px-3 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400"
        >
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Article</span>
          </div>
          {articleCompleted && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-green-500 text-white rounded-full">
              <CheckCircle className="h-3 w-3" />
            </Badge>
          )}
        </TabsTrigger>
        
        {termContent.videoUrl && (
          <TabsTrigger 
            value="video" 
            className="relative py-2 px-3 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-400"
          >
            <div className="flex items-center gap-1">
              <PlayCircle className="h-4 w-4" />
              <span>Video</span>
            </div>
            {videoCompleted && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-green-500 text-white rounded-full">
                <CheckCircle className="h-3 w-3" />
              </Badge>
            )}
          </TabsTrigger>
        )}
        
        {termContent.quiz && (
          <TabsTrigger 
            value="quiz" 
            className="relative py-2 px-3 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400"
          >
            <div className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              <span>Quiz</span>
            </div>
            {quizCompleted && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-green-500 text-white rounded-full">
                <CheckCircle className="h-3 w-3" />
              </Badge>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      {/* Article Content */}
      <TabsContent value="article" className="m-0 mt-2">
        {termContent.article && (
          <Card className="shadow-lg overflow-hidden border-none">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/20 p-6 border-b border-blue-200 dark:border-blue-800/50">
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                {termContent.article.subModuleTitle || termContent.term}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose max-w-none dark:prose-invert">
                <CustomMarkdownRenderer markdown={termContent.article.article || ""} />
              </div>
              
              {/* Article Progress Tracker */}
              <UpdatedArticleProgressTracker
                moduleId={moduleId}
                termIndex={termContent.termIndex}
                article={termContent.article}
                isCompleted={articleCompleted}
                resourceProgress={termContent.resourceProgress}
                onComplete={() => {
                  onResourceComplete(moduleId, termContent.termIndex, "article");
                  setArticleCompleted(true);
                }}
                onProgressUpdate={(percentage) => {
                  // Handle progress updates if needed
                }}
              />
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      {/* Video Content */}
      <TabsContent value="video" className="m-0 mt-2">
        {termContent.videoUrl ? (
          <Card className="shadow-lg overflow-hidden border-none">
            <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-50 dark:from-indigo-900/20 dark:to-purple-800/20 p-6 border-b border-indigo-200 dark:border-indigo-800/50">
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-indigo-600" />
                Video: {termContent.term}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="aspect-video overflow-hidden rounded-lg shadow-md">
                  <iframe
                    title={`Video: ${termContent.term}`}
                    className="w-full h-full"
                    src={convertToEmbedUrl(termContent.videoUrl)}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                    {termContent.term} - Video Explanation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This video provides a comprehensive explanation of {termContent.term}, 
                    demonstrating key concepts and practical applications.
                  </p>
                </div>
                
                {/* Video Progress Tracker */}
                <UpdatedVideoProgressTracker
                  moduleId={moduleId}
                  termIndex={termContent.termIndex}
                  videoUrl={termContent.videoUrl}
                  isCompleted={videoCompleted}
                  resourceProgress={termContent.resourceProgress}
                  onComplete={() => {
                    onResourceComplete(moduleId, termContent.termIndex, "video");
                    setVideoCompleted(true);
                  }}
                  onProgressUpdate={(percentage) => {
                    // Handle progress updates if needed
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500">No video content available for this term.</p>
          </div>
        )}
      </TabsContent>
      
      {/* Quiz Content */}
      {/* Quiz Content */}
      <TabsContent value="quiz" className="m-0 mt-2">
        {termContent.quiz ? (
          <Card className="shadow-lg overflow-hidden border-none">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-800/20 p-6 border-b border-purple-200 dark:border-purple-800/50">
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-purple-600" />
                {termContent.quiz.quizTitle || `${termContent.term} Quiz`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <UpdatedEnhancedQuiz
                moduleId={moduleId}
                termIndex={termContent.termIndex}
                quiz={termContent.quiz}
                isCompleted={quizCompleted}
                resourceProgress={termContent.resourceProgress}
                onComplete={(score) => {
                  onResourceComplete(moduleId, termContent.termIndex, "quiz", score);
                  setQuizCompleted(true);
                }}
                onClose={() => {
                  // Handle quiz close if needed
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-500">No quiz available for this term.</p>
          </div>
        )}
      </TabsContent>
      
      {/* Term completion status banner */}
      {allCompleted && (
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-800/50 p-2 rounded-full text-green-600 dark:text-green-400">
            <BookmarkCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-green-700 dark:text-green-400">Term Completed!</h3>
            <p className="text-green-600 dark:text-green-500 text-sm">
              You've successfully completed all learning materials for this term.
            </p>
          </div>
        </div>
      )}
    </Tabs>
  );
}