"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, BookOpen, Award } from "lucide-react";
import { completeSubmodule } from "@/services/progressApi";
import { toast } from "@/components/ui/use-toast"; // Import just the toast function, not useToast

/**
 * Component for tracking article progress 
 */
export default function ArticleProgressTracker({ 
  moduleId, 
  subModule, 
  isCompleted = false, 
  onProgressUpdate 
}) {
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  // Generate a submodule ID if not provided (using index or other identifier)
  const getSubmoduleId = () => {
    // If the subModule has an id, use it
    if (subModule.id) return subModule.id;
    // If it has a subModuleId, use that
    if (subModule.subModuleId) return subModule.subModuleId;
    // Generate one from the title (not ideal, but works for demo purposes)
    return Math.abs(subModule.subModuleTitle.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0));
  };

  const handleMarkAsRead = async () => {
    if (completed || markingComplete) return;
  
    try {
      setMarkingComplete(true);
      
      // Get numeric ID
      const submoduleId = getSubmoduleId();
      
      // Prepare request data
      const requestData = {
        moduleId: moduleId,
        submoduleId: submoduleId
      };
      
      // Call API to complete the submodule
      const progressData = await completeSubmodule(requestData);
      
      setCompleted(true);
      
      // Show success toast with XP
      toast({
        title: "Article Completed!",
        description: `You earned 10 XP from this article.`,
      });
      
      // Notify parent component of progress update
      if (onProgressUpdate) {
        onProgressUpdate(progressData);
      }
    } catch (error) {
      console.error("Error marking article as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark article as read. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingComplete(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
      <div className="flex items-center gap-3">
        {completed ? (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
          </div>
        ) : (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
            <BookOpen className="h-5 w-5" />
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
              ? "You've marked this article as read" 
              : "Mark this article as read to track your progress and earn XP"}
          </p>
        </div>
      </div>
      
      {!completed && (
        <Button 
          onClick={handleMarkAsRead}
          disabled={markingComplete}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {markingComplete ? "Updating..." : "Mark as Read"}
        </Button>
      )}
    </div>
  );
}