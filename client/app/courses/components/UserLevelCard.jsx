"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, Zap, TrendingUp, Star } from "lucide-react";

const UserLevelCard = ({ user, progressSummary }) => {
  if (!user) return null;
  
  // Calculate level information based on XP
  const totalXP = user.totalXP || user.xp || 0;
  const level = user.currentLevel || Math.floor(totalXP / 100) + 1;
  
  // Calculate progress to next level
  const prevLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const levelProgress = ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
  
  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative">
            {/* Avatar or icon */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white h-8 w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 font-bold text-sm">
              {level}
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {user.username || "Learner"}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                <Award className="h-3.5 w-3.5 mr-1" />
                Level {level}
              </Badge>
              
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                <Zap className="h-3.5 w-3.5 mr-1" />
                {totalXP} XP
              </Badge>
              
              {progressSummary?.totalCoursesCompleted > 0 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  {progressSummary.totalCoursesCompleted} Courses
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* XP Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Next Level</span>
            <span className="font-medium text-gray-700">
              {totalXP}/{nextLevelXP} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-2" />
        </div>
        
        {/* Learning Stats */}
        {progressSummary && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
              <Star className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {progressSummary.totalXP || totalXP}
              </p>
              <p className="text-xs text-gray-500">Total XP</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
              <Award className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {progressSummary.coursesCompleted || 0}
              </p>
              <p className="text-xs text-gray-500">Courses Completed</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {progressSummary.coursesInProgress || 0}
              </p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {progressSummary.totalModulesCompleted || 0}
              </p>
              <p className="text-xs text-gray-500">Modules Completed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserLevelCard;