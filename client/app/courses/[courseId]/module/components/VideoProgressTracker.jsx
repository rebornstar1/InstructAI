"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Video } from "lucide-react";

/**
 * Simplified VideoProgressTracker component with minimal UI
 * 
 * @param {Object} props
 * @param {string|number} props.moduleId - The ID of the module
 * @param {number} props.termIndex - The index of the term this video belongs to
 * @param {string} props.videoUrl - The URL of the video
 * @param {boolean} props.isCompleted - Whether the video is already completed
 * @param {Function} props.onComplete - Callback when video is completed
 */
export default function VideoProgressTracker({ 
  moduleId, 
  termIndex,
  videoUrl,
  isCompleted = false,
  onComplete
}) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Set initial state from props if provided
  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  // Handle marking video as completed
  const handleMarkAsWatched = async () => {
    if (completed || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Call API through the parent component
      if (onComplete) {
        await onComplete();
      }
      
      // Update local state
      setCompleted(true);
    } catch (error) {
      console.error("Error marking video as watched:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // If already completed, just show the completed status
  if (completed) {
    return (
      <div className="mt-6 mb-4 flex items-center justify-center">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg py-3 px-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Video completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-center mb-4">
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-none py-1 px-3">
          <Video className="h-3.5 w-3.5 mr-2" />
          Video Resource
        </Badge>
      </div>
      
      <Button
        onClick={handleMarkAsWatched}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs"
        size="lg"
        disabled={isUpdating}
      >
        {isUpdating ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Updating...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Mark as Watched
          </>
        )}
      </Button>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center max-w-md">
        Click the button above after watching the video to track your progress.
      </p>
    </div>
  );
}