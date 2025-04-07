// src/services/progressApi.js
const API_BASE_URL = 'http://localhost:8007';

export const enrollInCourse = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/progress/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, courseId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to enroll in course: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  };

/**
 * Get progress for a specific course
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} - Course progress data
 */
export const getCourseProgress = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return null;
      
      const response = await fetch(`${API_BASE_URL}/api/progress/course/${courseId}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch course progress: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return null;
    }
  };

/**
 * Get detailed course progress with module progress map
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} - Detailed course progress data
 */
export const getCourseWithProgress = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { course: null, courseProgress: null };
      
      // Fetch course data
      const courseResponse = await fetch(`${API_BASE_URL}/api/courses/simplified/${courseId}`);
      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }
      const course = await courseResponse.json();
      
      // Fetch progress data with module map
      const progressResponse = await fetch(
        `${API_BASE_URL}/api/progress/course/${courseId}/detailed?userId=${userId}`
        , {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
      
      if (!progressResponse.ok) {
        return { course, courseProgress: null, moduleProgressMap: {} };
      }
      
      const progressData = await progressResponse.json();
      
      return {
        course,
        courseProgress: progressData.courseProgress,
        moduleProgressMap: progressData.moduleProgressMap || {}
      };
    } catch (error) {
      console.error('Error fetching course with progress:', error);
      return { course: null, courseProgress: null, moduleProgressMap: {} };
    }
  };
  

/**
 * Get progress for a specific module
 * @param {string} moduleId - Module ID
 * @returns {Promise<Object>} - Module progress data
 */
export const getModuleProgress = async (moduleId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return null;
      
      const response = await fetch(`${API_BASE_URL}/api/progress/module/${moduleId}?userId=${userId}`,{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch module progress: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching module progress:', error);
      return null;
    }
  };

/**
 * Get all courses with progress information
 * @returns {Promise} - List of course progress data
 */
export const getAllCoursesWithProgress = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/courses/simplified/with-progress`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get courses with progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting all courses with progress:', error);
    return [];
  }
};

/**
 * Get user progress summary
 * @returns {Promise} - User progress summary data
 */
export const getUserProgressSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/summary`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user progress summary');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user progress summary:', error);
    return null;
  }
};

/**
 * Start a module
 * @param {string} moduleId - Module ID
 * @returns {Promise<Object>} - Updated module progress
 */
export const startModule = async (moduleId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/progress/module/${moduleId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start module: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error starting module:', error);
      throw error;
    }
  };

/**
 * Complete a submodule (article)
 * @param {string} moduleId - Module ID
 * @param {string} submoduleId - Submodule ID
 * @returns {Promise<Object>} - Updated module progress
 */
export const completeSubmodule = async (moduleId, submoduleId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/progress/module/${moduleId}/submodule/${submoduleId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to complete submodule: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing submodule:', error);
      throw error;
    }
  };

  export const completeVideo = async (moduleId, videoId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/progress/module/${moduleId}/video/${videoId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to complete video: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing video:', error);
      throw error;
    }
  };

  export const completeQuiz = async (moduleId, quizId, score) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_BASE_URL}/api/progress/module/${moduleId}/quiz/${quizId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, score })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to complete quiz: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing quiz:', error);
      throw error;
    }
  };

  const getCurrentUserId = () => {
    // In a real app, you would get this from your auth service
    // For this demo, we'll use a placeholder or localStorage
    return localStorage.getItem('userId') || '1'; // Default to user ID 1 for demo
  };

/**
 * Check if user can access a module
 * @param {number} moduleId - Module ID to check
 * @returns {Promise<boolean>} - Whether user can access the module
 */
export const canAccessModule = async (moduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/modules/${moduleId}/access`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data === true;
  } catch (error) {
    console.error('Error checking module access:', error);
    return false;
  }
};