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
  Users
} from "lucide-react";

/**
 * Component for displaying a user's progress summary on dashboard
 */
export default function ProgressSummary({ userId }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgressSummary = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/progress/summary", {
          credentials: "include" // Include credentials for auth
        });

        if (!response.ok) {
          throw new Error("Failed to fetch progress summary");
        }

        const data = await response.json();
        setSummary(data);
      } catch (error) {
        console.error("Error fetching progress summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressSummary();
  }, [userId]);

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

            {/* Recent Courses */}
            {summary.recentCourses && summary.recentCourses.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">Recent Courses</h3>
                <div className="space-y-2">
                  {summary.recentCourses.map((course, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
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
                          className="h-2 w-20" 
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