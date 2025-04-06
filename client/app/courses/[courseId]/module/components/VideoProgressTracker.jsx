import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Play, Clock } from "lucide-react";
import { completeVideo } from "@/services/progressApi";

/**
 * VideoProgressTracker - Tracks and reports video completion progress
 * 
 * @param {Object} props - Component props
 * @param {string} props.moduleId - ID of the current module
 * @param {number} props.videoIndex - Index of the video in the module
 * @param {string} props.videoUrl - URL of the video
 * @param {boolean} props.isCompleted - Whether the video has already been marked as completed
 * @param {Function} props.onProgressUpdate - Callback when progress updates with progress data
 */
const VideoProgressTracker = ({ 
  moduleId, 
  videoIndex, 
  videoUrl, 
  isCompleted = false,
  onProgressUpdate 
}) => {
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  
  // Generate a stable video ID for tracking
  const videoId = `video-${moduleId}-${videoIndex}`;
  
  // Progress simulation for demo purposes
  // In a real app, this would track actual video playback progress
  useEffect(() => {
    let interval;
    
    if (watching && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 5, 100);
          
          // Automatically mark as complete when reaching 100%
          if (newProgress === 100 && !completed) {
            handleMarkComplete();
          }
          
          return newProgress;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [watching, progress, completed]);
  
  const handleStartWatching = () => {
    setWatching(true);
  };
  
  const handleStopWatching = () => {
    setWatching(false);
  };
  
  const handleMarkComplete = async () => {
    if (completed || loading) return;
    
    setLoading(true);
    
    try {
      // Call API to mark video as complete
      const progressData = await completeVideo(moduleId, videoId);
      
      // Update local state
      setCompleted(true);
      setProgress(100);
      
      // Notify parent component
      if (onProgressUpdate && progressData) {
        onProgressUpdate(progressData);
      }
    } catch (error) {
      console.error("Error marking video as complete:", error);
    } finally {
      setLoading(false);
      setWatching(false);
    }
  };
  
  return (
    <div className="mt-4 space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            {watching ? (
              <Clock className="w-4 h-4 mr-1 text-blue-500 animate-pulse" />
            ) : completed ? (
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            <span>
              {completed ? "Completed" : watching ? "Watching..." : "Video Progress"}
            </span>
          </div>
          <span>{progress}%</span>
        </div>
        
        <Progress 
          value={progress} 
          className={`h-2 ${completed ? "bg-green-100" : "bg-gray-100"}`} 
        />
      </div>
      
      {/* Control buttons */}
      <div className="flex gap-3">
        {!completed ? (
          <>
            {watching ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleStopWatching}
              >
                Pause Tracking
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleStartWatching}
              >
                <Play className="w-4 h-4" />
                Resume Watching
              </Button>
            )}
            
            <Button 
              className="gap-2"
              size="sm"
              onClick={handleMarkComplete}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Updating..." : "Mark as Complete"}
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            disabled
          >
            <CheckCircle className="w-4 h-4" />
            Video Completed
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoProgressTracker;