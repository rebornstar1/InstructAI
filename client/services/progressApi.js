// src/services/progressApi.js
const API_BASE_URL = 'http://localhost:8007';

/**
 * Enroll the current user in a course
 * @param {number} courseId - Course ID to enroll in
 * @returns {Promise} - Course progress data
 */
export const enrollInCourse = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to enroll in course');
    }

    return await response.json();
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

/**
 * Get course progress for the current user
 * @param {number} courseId - Course ID to get progress for
 * @returns {Promise} - Course progress data
 */
export const getCourseProgress = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/courses/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      // If 404, course might not be enrolled yet
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get course progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting course progress:', error);
    return null;
  }
};

/**
 * Get enhanced course data with progress information
 * @param {number} courseId - Course ID to get
 * @returns {Promise} - Enhanced course data with progress
 */
export const getCourseWithProgress = async (courseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/courses/simplified/${courseId}/with-progress`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get course with progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting course with progress:', error);
    throw error;
  }
};

export const getModuleProgress = async (moduleId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/progress/modules/${moduleId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch module progress");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error fetching module progress:", error);
      throw error;
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
 * Start a module (mark as in progress)
 * @param {number} moduleId - Module ID to start
 * @returns {Promise} - Module progress data
 */
export const startModule = async (moduleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress/modules/${moduleId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to start module');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting module:', error);
    throw error;
  }
};

/**
 * Complete a submodule
 * @param {number} moduleId - Module ID
 * @param {number} submoduleId - Submodule ID to mark as completed
 * @returns {Promise} - Module progress data
 */
/**
 * Complete a submodule (article or video)
 * @param {number} moduleId - The module ID
 * @param {number|string} submoduleId - The submodule ID (must be convertible to a Long)
 * @returns {Promise} - The updated module progress
 */
/**
 * Complete a submodule (article or video)
 * @param {Object} requestData - Object containing moduleId and submoduleId
 * @returns {Promise} - The updated module progress
 */
export const completeSubmodule = async (requestData) => {
    try {
      console.log('Completing submodule:', requestData);
      
      // Extract values from requestData
      const { moduleId, submoduleId } = requestData;

      console.log('Extracted moduleId:', moduleId, 'submoduleId:', submoduleId);
      
      // Ensure moduleId and submoduleId are numbers
      const numericModuleId = parseInt(moduleId, 10);
      const numericSubmoduleId = parseInt(submoduleId, 10);
      
      // Check if conversion resulted in valid numbers
      if (isNaN(numericModuleId)) {
        throw new Error("Invalid moduleId: must be convertible to a number");
      }
      
      if (isNaN(numericSubmoduleId)) {
        throw new Error("Invalid submoduleId: must be convertible to a number");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/progress/submodules/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? 
            {'Authorization': `Bearer ${localStorage.getItem('token')}`} : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          moduleId,
          submoduleId
        })
      });
  
      if (!response.ok) {
        throw new Error(`Failed to complete submodule: ${response.status} ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error completing submodule:', error);
      throw error;
    }
  };

/**
 * Send the quiz completion data to the API
 * @param {number} moduleId - The ID of the module
 * @param {number} score - The score percentage
 * @returns {Promise<Object>} - Progress data
 */
export const completeQuiz = async (moduleId, score) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/progress/quiz/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          moduleId: moduleId,
          score: score
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete quiz');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing quiz:', error);
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