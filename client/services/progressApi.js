// src/services/progressApi.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export const enrollInCourse = async (courseId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_URL}/api/progress/enroll`, {
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
      
      const data = await response.json();
    
    try {
      await fetchThreadsForCourse(courseId);
    } catch (threadError) {
      console.error("Error fetching threads after enrollment:", threadError);
    }
    
    return data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  };

  export const fetchThreadsForCourse = async(courseId) => {
    try {
      const response = await fetch(`/api/threads/course/${courseId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch threads for course");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching threads for course:", error);
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
      
      const response = await fetch(`${API_URL}/api/progress/course/${courseId}?userId=${userId}`);
      
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
      const courseResponse = await fetch(`${API_URL}/api/courses/simplified/${courseId}`);
      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }
      const course = await courseResponse.json();
      
      // Fetch progress data with module map
      const progressResponse = await fetch(
        `${API_URL}/api/progress/course/${courseId}/detailed?userId=${userId}`
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
      
      const response = await fetch(`${API_URL}/api/progress/module/${moduleId}?userId=${userId}`,{
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
    const response = await fetch(`${API_URL}/api/courses/simplified/with-progress`, {
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
    const response = await fetch(`${API_URL}/api/progress/summary`, {
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
      
      const response = await fetch(`${API_URL}/api/progress/module/${moduleId}/start`, {
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
      const userId = parseInt(getCurrentUserId());
      if (!userId) throw new Error('User not authenticated');
      
      const response = await fetch(`${API_URL}/api/progress/module/${moduleId}/submodule/${submoduleId}/complete`, {
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

/**
 * Check if user can access a module
 * @param {number} moduleId - Module ID to check
 * @returns {Promise<boolean>} - Whether user can access the module
 */
export const canAccessModule = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/api/progress/modules/${moduleId}/access`, {
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

export const completeKeyTerm = async (moduleId, termIndex) => {
try {
  const response = await fetch(`${API_URL}/progress/modules/${moduleId}/terms/${termIndex}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to mark key term as completed: ${response.statusText}`);
  }
  
  return await response.json();
} catch (error) {
  console.error('Error completing key term:', error);
  throw error;
}
}

export const getTermProgress = async (moduleId, termIndex) => {
  try {
    const response = await fetch(`${API_URL}/progress/modules/${moduleId}/terms/${termIndex}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch term progress: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching term progress:', error);
    throw error;
  }
};


export const completeModule = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/progress/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete module: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing module:', error);
    throw error;
  }
};

/**
 * Initialize step progress tracking for a module
 * @param {string} moduleId - Module ID
 * @returns {Promise<Object>} - Response data
 */
export const initializeStepProgress = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/api/progress/steps/modules/${moduleId}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initialize step progress: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initializing step progress:', error);
    throw error;
  }
};


/**
 * Get all steps for a module
 * @param {string} moduleId - Module ID
 * @returns {Promise<Array>} - List of step progress data
 */
export const getStepsForModule = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/api/progress/steps/modules/${moduleId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch steps: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching steps:', error);
    return [];
  }
};

/**
 * Get all steps for a key term
 * @param {string} moduleId - Module ID
 * @param {number} termIndex - Term index
 * @returns {Promise<Array>} - List of step progress data for the term
 */
export const getStepsForKeyTerm = async (moduleId, termIndex) => {
  try {
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/terms/${termIndex}`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch term steps: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching term steps:', error);
    return [];
  }
};

/**
 * Complete an article
 * @param {string} moduleId - Module ID
 * @param {string} submoduleId - Submodule ID
 * @returns {Promise<Object>} - Updated progress data
 */
export const completeArticle = async (moduleId, submoduleId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/articles/${submoduleId}/complete`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to complete article: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing article:', error);
    throw error;
  }
};

/**
 * Update article reading progress
 * @param {string} moduleId - Module ID
 * @param {string} submoduleId - Submodule ID
 * @param {number} percentage - Reading progress percentage (0-100)
 * @returns {Promise<Object>} - Updated progress data
 */
export const updateArticleProgress = async (moduleId, submoduleId, percentage) => {
  try {
    console.log("Updating article progress", { moduleId, submoduleId, percentage });
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/articles/${submoduleId}/progress`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ percentage })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update article progress: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating article progress:', error);
    throw error;
  }
};

/**
 * Complete a video
 * @param {string} moduleId - Module ID
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} - Updated progress data
 */
export const completeVideo = async (moduleId, videoId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/videos/${videoId}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to complete video: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing video:', error);
    throw error;
  }
};

/**
 * Update video watching progress
 * @param {string} moduleId - Module ID
 * @param {string} videoId - Video ID
 * @param {number} percentage - Watching progress percentage (0-100)
 * @returns {Promise<Object>} - Updated progress data
 */
export const updateVideoProgress = async (moduleId, videoId, percentage) => {
  try {
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/videos/${videoId}/progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ percentage })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update video progress: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating video progress:', error);
    throw error;
  }
};

/**
 * Complete a quiz with a score
 * @param {string} moduleId - Module ID
 * @param {string} quizId - Quiz ID
 * @param {number} score - Quiz score (0-100)
 * @returns {Promise<Object>} - Updated progress data
 */
export const completeQuiz = async (moduleId, quizId, score) => {
  try {
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/quizzes/${quizId}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ score })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to complete quiz: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing quiz:', error);
    throw error;
  }
};

/**
 * Check if a key term is completed based on its steps
 * @param {string} moduleId - Module ID
 * @param {number} termIndex - Term index
 * @returns {Promise<Object>} - Completion status
 */
export const checkKeyTermCompletion = async (moduleId, termIndex) => {
  try {
    const response = await fetch(
      `${API_URL}/api/progress/steps/modules/${moduleId}/terms/${termIndex}/check-completion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to check term completion: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking term completion:', error);
    return { success: false, termCompleted: false };
  }
};

/**
 * Helper function to get the current user ID
 * @returns {string} User ID from localStorage or default
 */
const getCurrentUserId = () => {
  return localStorage.getItem('userId') || '1'; // Default to user ID 1 for demo
};