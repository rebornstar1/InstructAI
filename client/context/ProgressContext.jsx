import React, { useState, useEffect, createContext, useContext } from 'react';
import progressService from '../services/progressService';
import * as progressApi from '../services/progressApi';
import { toast } from "your-toast-component"; // Replace with your actual toast import

// Create a context for progress data
const ProgressContext = createContext(null);

/**
 * Progress Provider component
 * Wraps your app or specific pages to provide progress tracking functionality
 */
export function ProgressProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  
  // Load user progress summary on initial render
  useEffect(() => {
    const loadProgressSummary = async () => {
      try {
        const summary = await progressService.getProgressSummary();
        setUserProgress(summary);
      } catch (error) {
        console.error('Error loading user progress summary:', error);
      } finally {
        setIsReady(true);
      }
    };
    
    loadProgressSummary();
  }, []);
  
  // Update progress summary
  const refreshProgressSummary = async () => {
    try {
      const summary = await progressService.getProgressSummary();
      setUserProgress(summary);
      return summary;
    } catch (error) {
      console.error('Error refreshing progress summary:', error);
      return null;
    }
  };
  
  // Complete a content item (unified method)
  const completeContentItem = async (contentType, moduleId, contentId, additionalData = {}) => {
    try {
      const result = await progressService.completeContentItem(
        contentType, moduleId, contentId, additionalData
      );
      
      // Show toast message based on result
      if (result) {
        // Basic completion toast
        toast({
          title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} completed`,
          description: "Your progress has been saved",
        });
        
        // Module completion toast if applicable
        if (result.isModuleCompleted) {
          toast({
            title: "Module completed!",
            description: "You've completed this module and earned XP!",
            variant: "success",
          });
          
          // Refresh progress summary to update XP, etc.
          refreshProgressSummary();
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error completing ${contentType}:`, error);
      
      toast({
        title: "Error updating progress",
        description: "Please try again later",
        variant: "destructive",
      });
      
      return null;
    }
  };
  
  // Context value with all our progress functions
  const contextValue = {
    isReady,
    userProgress,
    refreshProgressSummary,
    completeContentItem,
    
    // Module functions
    getModuleProgress: progressApi.getModuleProgress,
    startModule: progressApi.startModule,
    completeSubmodule: async (moduleId, submoduleId) => {
      return completeContentItem('article', moduleId, submoduleId);
    },
    completeVideo: async (moduleId, videoId) => {
      return completeContentItem('video', moduleId, videoId);
    },
    completeQuiz: async (moduleId, quizId, score) => {
      return completeContentItem('quiz', moduleId, quizId, { score });
    },
    getDetailedModuleProgress: progressApi.getDetailedModuleProgress,
    getContentCompletionStatus: progressService.getContentCompletionStatus,
    
    // Course functions
    enrollInCourse: progressApi.enrollInCourse,
    getCourseProgress: progressApi.getCourseProgress,
    getCourseWithProgress: progressApi.getCourseWithProgress,
    getAllCoursesWithProgress: progressApi.getAllCoursesWithProgress,
    
    // Access control
    canAccessModule: progressApi.canAccessModule,
    
    // Achievements
    getUserAchievements: progressApi.getUserAchievements,
  };
  
  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * Custom hook to use progress tracking functionality
 * @returns {Object} Progress context value
 */
export function useProgress() {
  const context = useContext(ProgressContext);
  
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  
  return context;
}

/**
 * Higher-order component to wrap any component with progress tracking
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with progress props
 */
export function withProgress(Component) {
  return function WrappedComponent(props) {
    const progressContext = useProgress();
    
    // Pass all progress functions as props
    return <Component {...props} progress={progressContext} />;
  };
}

/**
 * ModuleProgress component - Handles progress tracking for a module
 * Use this component to wrap your module content
 */
export function ModuleProgress({ 
  moduleId, 
  moduleData, 
  onProgressUpdate,
  onModuleCompleted,
  children 
}) {
  const progress = useProgress();
  const [moduleProgress, setModuleProgress] = useState(null);
  const [contentStatus, setContentStatus] = useState({
    completedArticles: {},
    completedVideos: {},
    completedQuizzes: {},
    isModuleCompleted: false
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Load initial module progress
  useEffect(() => {
    const loadModuleProgress = async () => {
      if (!moduleId) return;
      
      setIsLoading(true);
      
      try {
        // Get basic module progress
        const basicProgress = await progress.getModuleProgress(moduleId);
        setModuleProgress(basicProgress);
        
        // If module is not started yet, start it automatically
        if (basicProgress?.state === "UNLOCKED") {
          const startedModule = await progress.startModule(moduleId);
          if (startedModule) {
            setModuleProgress(startedModule);
          }
        }
        
        // Get detailed content status
        const contentStatusData = await progress.getContentCompletionStatus(moduleId);
        if (contentStatusData) {
          setContentStatus(contentStatusData);
        }
      } catch (error) {
        console.error('Error loading module progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadModuleProgress();
  }, [moduleId, progress]);
  
  // Handle content completion
  const handleContentCompleted = async (contentType, contentId, progressData) => {
    let updatedProgress = null;
    
    // Call the appropriate completion method based on content type
    if (contentType === 'article') {
      updatedProgress = await progress.completeSubmodule(moduleId, contentId);
    } else if (contentType === 'video') {
      updatedProgress = await progress.completeVideo(moduleId, contentId);
    } else if (contentType === 'quiz') {
      updatedProgress = await progress.completeQuiz(moduleId, contentId, progressData?.score || 0);
    }
    
    // Update local state
    if (updatedProgress) {
      // Update module progress
      setModuleProgress(updatedProgress);
      
      // Update content status based on content type
      if (contentType === 'article') {
        setContentStatus(prev => ({
          ...prev,
          completedArticles: {
            ...prev.completedArticles,
            [contentId]: true
          }
        }));
      } else if (contentType === 'video') {
        setContentStatus(prev => ({
          ...prev,
          completedVideos: {
            ...prev.completedVideos,
            [contentId]: true
          }
        }));
      } else if (contentType === 'quiz') {
        setContentStatus(prev => ({
          ...prev,
          completedQuizzes: {
            ...prev.completedQuizzes,
            [contentId]: true,
            [`${contentId}_score`]: progressData?.score || 0
          }
        }));
      }
      
      // Check if module was completed
      const isModuleCompleted = updatedProgress.isModuleCompleted || 
                                updatedProgress.state === 'COMPLETED' ||
                                updatedProgress.moduleAutoCompleted;
      
      // Update module completion status
      if (isModuleCompleted) {
        setContentStatus(prev => ({ ...prev, isModuleCompleted: true }));
        
        // Call onModuleCompleted callback if provided
        if (onModuleCompleted) {
          onModuleCompleted(updatedProgress);
        }
      }
      
      // Call onProgressUpdate callback if provided
      if (onProgressUpdate) {
        onProgressUpdate(updatedProgress);
      }
    }
    
    return updatedProgress;
  };
  
  // Check if a specific content item is completed
  const isContentCompleted = (contentType, contentId) => {
    if (contentType === 'article') {
      return !!contentStatus.completedArticles[contentId];
    } else if (contentType === 'video') {
      return !!contentStatus.completedVideos[contentId];
    } else if (contentType === 'quiz') {
      return !!contentStatus.completedQuizzes[contentId];
    }
    return false;
  };
  
  // Get quiz score if available
  const getQuizScore = (quizId) => {
    return contentStatus.completedQuizzes[`${quizId}_score`] || 0;
  };
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    // Use API-reported progress if available
    if (moduleProgress?.progressPercentage !== undefined) {
      return moduleProgress.progressPercentage;
    }
    
    // Fall back to locally calculated progress
    if (!moduleData) return 0;
    
    let totalItems = 0;
    let completedItems = 0;
    
    // Count submodules/articles
    if (moduleData.subModules) {
      totalItems += moduleData.subModules.length;
      completedItems += Object.keys(contentStatus.completedArticles).length;
    }
    
    // Count videos
    if (moduleData.videoUrls) {
      totalItems += moduleData.videoUrls.length;
      completedItems += Object.keys(contentStatus.completedVideos).length;
    }
    
    // Count quizzes
    if (moduleData.quizzes) {
      totalItems += moduleData.quizzes.length;
      completedItems += Object.keys(contentStatus.completedQuizzes).filter(
        id => !id.includes('_score')
      ).length;
    }
    
    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
  };
  
  // Pass these progress-related props to children
  const progressProps = {
    moduleProgress,
    isContentCompleted,
    getQuizScore,
    getProgressPercentage,
    isModuleCompleted: contentStatus.isModuleCompleted,
    handleContentCompleted,
    isLoading
  };
  
  // Render children with progress props
  return (
    <>
      {React.Children.map(children, child => {
        // Only clone if it's a valid React element
        if (React.isValidElement(child)) {
          return React.cloneElement(child, progressProps);
        }
        return child;
      })}
    </>
  );
}

export default {
  ProgressProvider,
  useProgress,
  withProgress,
  ModuleProgress
};