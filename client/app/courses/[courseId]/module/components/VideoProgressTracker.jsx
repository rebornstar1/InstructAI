"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, PlayCircle, Award } from "lucide-react";
import { completeSubmodule } from "@/services/progressApi";
import { toast } from "@/components/ui/use-toast"; // Fixed import

/**
 * Component for tracking video progress 
 */
export default function VideoProgressTracker({ 
  moduleId, 
  videoIndex,
  videoUrl,
  isCompleted = false, 
  onProgressUpdate 
}) {
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  // Generate a video ID based on index or URL
  const getVideoId = () => {
    // Use index as the video ID (not ideal, but works for demo purposes)
    // In a real app, you'd want to extract this from the actual video metadata
    return 9000 + videoIndex; // Using 9000+ range to avoid collision with other submodule IDs
  };

  // Update this section in VideoProgressTracker.jsx

const handleMarkAsWatched = async () => {
    if (completed || markingComplete) return;
  
    try {
      setMarkingComplete(true);
      
      // Get numeric video ID
      const videoId = getVideoId();
      
      // Parse moduleId to ensure it's a number if it's a string
      const moduleIdNumber = typeof moduleId === 'string' ? parseInt(moduleId, 10) : moduleId;
      
      // Prepare request data
      const requestData = {
        moduleId: moduleIdNumber,
        submoduleId: videoId
      };
      
      // Call API to complete the submodule
      const progressData = await completeSubmodule(requestData);
      
      setCompleted(true);
      
      // Show success toast with XP
      toast({
        title: "Video Completed!",
        description: `You earned 10 XP from this video.`,
      });
      
      // Notify parent component of progress update
      if (onProgressUpdate) {
        onProgressUpdate(progressData);
      }
    } catch (error) {
      console.error("Error marking video as watched:", error);
      toast({
        title: "Error",
        description: "Failed to mark video as watched. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingComplete(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30">
      <div className="flex items-center gap-3">
        {completed ? (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
          </div>
        ) : (
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
            <PlayCircle className="h-5 w-5" />
          </div>
        )}
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {completed ? "Completed" : "Track Your Progress"}
            </span>
            
            {completed && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none">
                <Award className="h-3.5 w-3.5 mr-1" />
                +10 XP
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completed 
              ? "You've marked this video as watched" 
              : "Mark this video as watched to track your progress and earn XP"}
          </p>
        </div>
      </div>
      
      {!completed && (
        <Button 
          onClick={handleMarkAsWatched}
          disabled={markingComplete}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {markingComplete ? "Updating..." : "Mark as Watched"}
        </Button>
      )}
    </div>
  );
}