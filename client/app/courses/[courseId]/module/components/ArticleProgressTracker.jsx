"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, BookOpen } from "lucide-react";

/**
 * Enhanced ArticleProgressTracker component integrated with the new term-based progress API
 * 
 * @param {Object} props
 * @param {string|number} props.moduleId - The ID of the module
 * @param {number} props.termIndex - The index of the term this article belongs to
 * @param {Object} props.article - The article object containing at minimum id and title
 * @param {boolean} props.isCompleted - Whether the article is already completed
 * @param {Function} props.onComplete - Callback when article is completed
 * @param {Function} props.onProgressUpdate - Callback when progress is updated
 */
export default function ArticleProgressTracker({ 
  moduleId, 
  termIndex,
  article, 
  isCompleted = false,
  onComplete,
  onProgressUpdate,
  resourceProgress = {}
}) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isUpdating, setIsUpdating] = useState(false);
  const [readPercentage, setReadPercentage] = useState(resourceProgress.articleProgress || 0);
  const [scrollDetected, setScrollDetected] = useState(false);
  
  // Track scroll position to determine reading progress
  useEffect(() => {
    // Only track scroll if not already completed
    if (completed) return;
    
    const handleScroll = () => {
      // Mark that scroll was detected (user is actively reading)
      if (!scrollDetected) {
        setScrollDetected(true);
      }
      
      // Calculate approximate read percentage based on scroll position
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Calculate percentage, but don't go above 95% from scroll alone
      // The user needs to click the complete button to reach 100%
      const percentage = Math.min(95, Math.round((scrollTop / (documentHeight - windowHeight)) * 100));
      
      // Only update if percentage changed significantly (to avoid too many API calls)
      if (Math.abs(percentage - readPercentage) >= 5) {
        setReadPercentage(percentage);
        
        // Send progress update to parent component
        if (onProgressUpdate) {
          onProgressUpdate(percentage);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial calculation
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [completed, scrollDetected, readPercentage, onProgressUpdate]);

  // Set initial state from props if provided
  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  const handleMarkAsCompleted = async () => {
    if (completed || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Call API through the parent component
      if (onComplete) {
        await onComplete();
      }
      
      // Update local state
      setCompleted(true);
      setReadPercentage(100);
    } catch (error) {
      console.error("Error marking article as completed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // If already completed, just show the completed status
  if (completed) {
    return (
      <div className="mt-8 flex items-center justify-center">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg py-3 px-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Article completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
          <Clock className="h-4 w-4" />
          Reading Progress
        </span>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={scrollDetected ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            {scrollDetected ? "Reading" : "Not started"}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-none">
            {readPercentage}%
          </Badge>
        </div>
      </div>
      
      <Progress 
        value={readPercentage} 
        className="h-2 bg-gray-200 dark:bg-gray-700 mb-4" 
      />
      
      <div className="flex justify-center">
        <Button
          onClick={handleMarkAsCompleted}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Completed
            </>
          )}
        </Button>
      </div>
    </div>
  );
}