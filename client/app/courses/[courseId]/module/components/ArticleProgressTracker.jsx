import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { completeSubmodule } from "@/services/progressApi";

/**
 * ArticleProgressTracker - Tracks and reports article reading progress
 * 
 * @param {Object} props - Component props
 * @param {string} props.moduleId - ID of the current module
 * @param {Object} props.subModule - The submodule with id and title
 * @param {boolean} props.isCompleted - Whether the article has already been marked as completed
 * @param {Function} props.onProgressUpdate - Callback when progress updates with progress data
 */
const ArticleProgressTracker = ({ 
  moduleId, 
  subModule, 
  isCompleted = false,
  onProgressUpdate 
}) => {
  const [progress, setProgress] = useState(isCompleted ? 100 : 0);
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  
  // Get submodule ID for API calls
  const submoduleId = subModule?.id || 'main-content';
  
  // Track scroll position to estimate reading progress
  useEffect(() => {
    const handleScroll = () => {
      // Get document scroll info
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate scroll percentage
      const scrollPercent = Math.min(100, Math.round((scrollTop / Math.max(1, scrollHeight)) * 100));
      setScrollProgress(scrollPercent);
      
      // Update reading progress based on scroll position
      if (!completed && scrollPercent > progress) {
        setProgress(scrollPercent);
        
        // Auto-complete when user has read most of the content
        if (scrollPercent >= 90 && !completed) {
          // Don't auto-mark as complete, but prompt the user
          setExpanded(true);
        }
      }
    };
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial calculation
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [progress, completed]);
  
  const handleMarkComplete = async () => {
    if (completed || loading) return;
    
    setLoading(true);
    
    try {
      // Call API to mark submodule as complete
      const progressData = await completeSubmodule(moduleId, submoduleId);
      
      // Update local state
      setCompleted(true);
      setProgress(100);
      
      // Notify parent component
      if (onProgressUpdate && progressData) {
        onProgressUpdate(progressData);
      }
    } catch (error) {
      console.error("Error marking article as complete:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // If already completed, show minimal UI
  if (completed && !expanded) {
    return (
      <div className="mt-8 mb-4">
        <div 
          className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 
            p-3 rounded-lg border border-green-200 dark:border-green-800/50 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Article Completed</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-8 mb-4 space-y-4 border-t border-gray-200 dark:border-gray-800 pt-6">
      {completed && expanded && (
        <div 
          className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 
            p-3 rounded-lg border border-green-200 dark:border-green-800/50 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Article Completed</span>
          </div>
          <ChevronUp className="h-4 w-4" />
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h3 className="font-bold text-gray-800 dark:text-gray-200">Your Reading Progress</h3>
        
        <div className="flex items-center text-sm text-gray-500 gap-2">
          <BookOpen className="h-4 w-4" />
          <span>
            {scrollProgress < 25 ? "Just started" : 
             scrollProgress < 50 ? "Getting started" :
             scrollProgress < 75 ? "Making progress" :
             scrollProgress < 90 ? "Almost there" : "Finished reading"}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Article progress</span>
          <span>{progress}%</span>
        </div>
        <Progress 
          value={progress} 
          className={`h-2 ${completed ? "bg-green-100" : "bg-blue-100"}`} 
        />
      </div>
      
      {/* Action button */}
      <div className="pt-2">
        <Button 
          onClick={handleMarkComplete}
          disabled={loading || completed}
          className={`w-full justify-center ${
            completed 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? (
            "Updating Progress..."
          ) : completed ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Completed
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Mark as Complete
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ArticleProgressTracker;