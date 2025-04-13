"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { updateArticleProgress, completeArticle } from "@/services/progressApi";

/**
 * Component to track and update article completion progress with the new step-based progress API
 * 
 * @param {Object} props
 * @param {string|number} props.moduleId - The ID of the module
 * @param {Object} props.subModule - The submodule object containing at minimum id and title
 * @param {boolean} props.isCompleted - Whether the article is already completed
 * @param {Function} props.onProgressUpdate - Callback when progress is updated
 */
export default function ArticleProgressTracker({ 
  moduleId, 
  subModule, 
  isCompleted = false,
  onProgressUpdate 
}) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isUpdating, setIsUpdating] = useState(false);
  const [readPercentage, setReadPercentage] = useState(0);
  const [scrollDetected, setScrollDetected] = useState(false);

  console.log("ArticleProgressTracker", { moduleId, subModule, completed });
  
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
        // Update the progress on the server
        updateArticleProgress(moduleId, parseInt(subModule.id), percentage)
          .catch(error => console.error("Error updating read progress:", error));
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Initial calculation
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [completed, scrollDetected, moduleId, subModule.id, readPercentage]);

  const handleMarkAsCompleted = async () => {
    if (completed || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Call API to mark article as completed
      const progressData = await completeArticle(moduleId, parseInt(subModule.id));
      
      // Update local state
      setCompleted(true);
      setReadPercentage(100);
      
      // Notify parent component
      if (onProgressUpdate) {
        onProgressUpdate(progressData);
      }
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
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Reading Progress
        </span>
        <span>{readPercentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
          style={{ width: `${readPercentage}%` }}
        />
      </div>
      
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