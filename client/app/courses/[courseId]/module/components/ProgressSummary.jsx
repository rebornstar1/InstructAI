"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  BookOpen,
  BookmarkCheck,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Users,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import progressService from "@/services/progressService";

/**
 * Component for displaying a user's progress summary on dashboard
 * with auto module completion integration
 */
export default function ProgressSummary({ userId }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProgressSummary = async () => {
      try {
        setIsLoading(true);
        const data = await progressService.getProgressSummary();
        setSummary(data);
      } catch (error) {
        console.error("Error fetching progress summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressSummary();
  }, [userId]);

  // Navigate to course
  const goToCourse = (courseId, moduleId) => {
    router.push(`/courses/${courseId}/modules/${moduleId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No progress data available</p>
        </CardContent>
      </Card>
    );
  }

  // Find any module that is almost complete (95%+) but not yet marked as completed
  const almostCompleteModule = summary.recentCourses?.find(course => 
    course.state !== "COMPLETED" && 
    course.activeModule && 
    course.activeModule.progressPercentage >= 95 && 
    course.activeModule.state !== "COMPLETED"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Learning Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* XP Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                  <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Experience Points</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep learning to earn more XP and level up
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {summary.totalXP} XP
              </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Total Courses</h4>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {summary.totalCourses}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">In Progress</h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {summary.coursesInProgress}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Completed</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {summary.coursesCompleted}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Stats */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Modules Completed</h3>
                <Badge className="bg-green-100 text-green-800 border-none">
                  <BookmarkCheck className="h-3.5 w-3.5 mr-1" />
                  {summary.totalModulesCompleted}
                </Badge>
              </div>
            </div>

            {/* Almost Complete Module Alert */}
            {almostCompleteModule && (
              <motion.div 
                className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Almost Complete!
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                      You're {almostCompleteModule.activeModule.progressPercentage}% done with "{almostCompleteModule.activeModule.title}"
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                    onClick={() => goToCourse(
                      almostCompleteModule.course.id, 
                      almostCompleteModule.activeModule.id
                    )}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Recent Courses */}
            {summary.recentCourses && summary.recentCourses.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">Recent Courses</h3>
                <div className="space-y-2">
                  {summary.recentCourses.map((course, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors cursor-pointer"
                      onClick={() => goToCourse(
                        course.course.id, 
                        course.activeModule ? course.activeModule.id : course.lastAccessedModule.id
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          course.state === "COMPLETED" 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        }`}>
                          {course.state === "COMPLETED" ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <BookOpen className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            {course.course.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{course.progressPercentage}% Complete</span>
                            <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                            <span>{course.earnedXP} XP</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Progress 
                          value={course.progressPercentage} 
                          className={`h-2 w-20 ${
                            course.progressPercentage >= 95 && course.state !== "COMPLETED" 
                              ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}