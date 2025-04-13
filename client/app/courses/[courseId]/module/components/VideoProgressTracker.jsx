"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Play, Pause } from "lucide-react";
import { updateVideoProgress, completeVideo } from "@/services/progressApi";

/**
 * Component to track and update video viewing progress with the new step-based progress API
 * 
 * @param {Object} props
 * @param {string|number} props.moduleId - The ID of the module
 * @param {number} props.videoIndex - The index of the video
 * @param {string} props.videoUrl - The URL of the video
 * @param {boolean} props.isCompleted - Whether the video is already completed
 * @param {Function} props.onProgressUpdate - Callback when progress is updated
 */
export default function VideoProgressTracker({ 
  moduleId, 
  videoIndex, 
  videoUrl,
  isCompleted = false,
  onProgressUpdate 
}) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isUpdating, setIsUpdating] = useState(false);
  const [videoId] = useState(`${videoIndex}`);
  const [watchTime, setWatchTime] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  
  // In a real implementation, you would track actual video watch time
  // This is a simplified version that simulates watching progress
  useEffect(() => {
    // Only track if not already completed
    if (completed) return;
    
    // Check if we have a stored watch time from before
    const storedWatchTime = localStorage.getItem(`video-${videoId}-watchtime`);
    if (storedWatchTime) {
      const timeValue = parseInt(storedWatchTime, 10);
      setWatchTime(timeValue);
      
      // Calculate watch percentage (assuming 60 seconds is 100%)
      const percentage = Math.min(100, Math.round((timeValue / 60) * 100));
      setWatchPercentage(percentage);
      
      // If they've already watched enough, mark as watched
      if (percentage >= 90) {
        setVideoWatched(true);
      }
    }
    
    // Simulate watching time (in a real app, this would be based on video player events)
    const watchTimer = setInterval(() => {
      setWatchTime(prevTime => {
        const newTime = prevTime + 1;
        localStorage.setItem(`video-${videoId}-watchtime`, newTime.toString());
        
        // Calculate percentage
        const percentage = Math.min(100, Math.round((newTime / 60) * 100));
        
        // Only update the server if percentage changed significantly
        if (Math.abs(percentage - watchPercentage) >= 5) {
          setWatchPercentage(percentage);
          updateVideoProgress(moduleId, videoId, percentage)
            .catch(error => console.error("Error updating watch progress:", error));
        }
        
        // After 90% of watching time, consider the video watched enough to complete
        if (percentage >= 90 && !videoWatched) {
          setVideoWatched(true);
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      clearInterval(watchTimer);
    };
  }, [completed, videoId, videoWatched, moduleId, watchPercentage]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMarkAsCompleted = async () => {
    if (completed || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Call API to mark video as completed
      const progressData = await completeVideo(moduleId, videoId);
      
      // Update local state
      setCompleted(true);
      setWatchPercentage(100);
      
      // Notify parent component
      if (onProgressUpdate) {
        onProgressUpdate(progressData);
      }
    } catch (error) {
      console.error("Error marking video as completed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // If already completed, just show the completed status
  if (completed) {
    return (
      <div className="mt-4 mb-2 flex items-center justify-center">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg py-3 px-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Video completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <Play className="h-4 w-4" />
          Watch Time
        </span>
        <span>{formatTime(watchTime)}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full"
          style={{ width: `${watchPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={handleMarkAsCompleted}
          className={`${
            videoWatched 
              ? "bg-indigo-600 hover:bg-indigo-700" 
              : "bg-gray-400 hover:bg-gray-500"
          } text-white`}
          disabled={!videoWatched || isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Video as Watched
            </>
          )}
        </Button>
      </div>
      
      {!videoWatched && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Continue watching to unlock completion
        </p>
      )}
    </div>
  );
}