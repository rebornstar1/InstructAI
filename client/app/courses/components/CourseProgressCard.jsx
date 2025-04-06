"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  Award, 
  CheckCircle, 
  XCircle,
  PlayCircle,
  Lock,
  ChevronRight
} from "lucide-react";
import { enrollInCourse } from "@/services/progressApi";

const CourseProgressCard = ({ course, progress, onEnroll, isEnrolling = false }) => {
  const [loading, setLoading] = useState(false);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Not started";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Handle enrollment
  const handleEnroll = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const result = await enrollInCourse(course.id);
      if (onEnroll) {
        onEnroll(result);
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Not enrolled state
  if (!progress) {
    return (
      <Card className="overflow-hidden border-none shadow-lg h-full">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Course Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col space-y-4">
          <div className="text-center py-8">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Not Enrolled
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto mb-6">
              Enroll in this course to track your progress, earn XP, and receive personalized recommendations.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEnroll}
              disabled={loading || isEnrolling}
            >
              {loading || isEnrolling ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Enrolling...
                </>
              ) : (
                <>
                  Enroll Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate module completion information
  const totalModules = course?.modules?.length || 0;
  const completedModules = totalModules > 0 ? Math.floor((progress.progressPercentage * totalModules) / 100) : 0;
  
  return (
    <Card className="overflow-hidden border-none shadow-lg h-full">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
        <CardTitle className="text-xl flex items-center gap-2">
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-500">Course Progress</span>
              <span className="font-medium">{progress.progressPercentage}%</span>
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
          </div>
          
          {/* Status badge */}
          <div className="flex items-center gap-2 my-4">
            <Badge 
              className={`px-3 py-1 ${
                progress.state === "COMPLETED" 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                  : progress.state === "IN_PROGRESS" 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {progress.state === "COMPLETED" ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              ) : progress.state === "IN_PROGRESS" ? (
                <PlayCircle className="h-3.5 w-3.5 mr-1" />
              ) : (
                <Lock className="h-3.5 w-3.5 mr-1" />
              )}
              {progress.state.replace("_", " ")}
            </Badge>
            
            {progress.state === "COMPLETED" && progress.completedAt && (
              <span className="text-sm text-gray-500">
                Completed on {formatDate(progress.completedAt)}
              </span>
            )}
          </div>
          
          <div className="pt-2 grid grid-cols-2 gap-4 text-center text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-500 mb-1">Completed</p>
              <p className="text-xl font-bold text-blue-600">{completedModules}/{totalModules}</p>
              <p className="text-gray-500">Modules</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-gray-500 mb-1">XP Earned</p>
              <p className="text-xl font-bold text-blue-600">{progress.earnedXP}</p>
              <p className="text-gray-500">Experience</p>
            </div>
          </div>
          
          {/* Last accessed module */}
          {progress.lastAccessedModuleTitle && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-500 mb-2">Continue where you left off:</p>
              <Button 
                variant="outline" 
                className="w-full justify-between border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="truncate">{progress.lastAccessedModuleTitle}</span>
                </div>
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardContent className="bg-gray-50 dark:bg-gray-800 p-6 border-t">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
          {progress.state === "COMPLETED" ? "Review Course" : "Continue Learning"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseProgressCard;