// services/api.js - Centralized API service

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

/**
 * Fetch all available courses
 */
export const fetchCourses = async () => {
  try {
    const response = await fetch(`${API_URL}/api/courses/simplified`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

/**
 * Fetch a specific course by ID
 */
export const fetchCourse = async (courseId) => {
  try {
    const response = await fetch(`${API_URL}/api/courses/simplified/${courseId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch course with ID: ${courseId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
};

/**
 * Fetch a specific module by ID
 */
export const fetchModule = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch module with ID: ${moduleId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Check if learning resources exist for a module
 * @returns {Promise<Object|null>} The resources if they exist, null otherwise
 */
export const checkLearningResources = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}`);
    if (response.ok) {
      const data = await response.json();
      console.log(data,"data");
      return await data;
    }
    return null;
  } catch (error) {
    console.error(`Error checking learning resources for module ${moduleId}:`, error);
    return null;
  }
};

/**
 * Generate learning resources for a module
 */
export const generateLearningResources = async (request) => {
  try {
    const response = await fetch(`${API_URL}/api/learning-resources/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating learning resources:', error);
    throw error;
  }
};

/**
 * Create a new course
 */
export const createCourse = async (courseData) => {
  try {
    const response = await fetch(`${API_URL}/api/courses/simplified/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create course: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Start interactive course creation
 */
export const startInteractiveCourseCreation = async (topic) => {
  try {
    const response = await fetch(`${API_URL}/api/courses/simplified/interactive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start interactive course creation: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error starting interactive course creation:', error);
    throw error;
  }
};

/**
 * Continue interactive course creation
 */
export const continueInteractiveCourseCreation = async (sessionId, answers) => {
  try {
    const response = await fetch(`${API_URL}/api/courses/simplified/interactive/continue?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to continue interactive course creation: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error continuing interactive course creation:', error);
    throw error;
  }
};

/**
 * Finalize interactive course creation
 */
export const finalizeInteractiveCourse = async (sessionId) => {
  try {
    const response = await fetch(`${API_URL}/api/courses/simplified/interactive/finalize?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to finalize interactive course: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error finalizing interactive course:', error);
    throw error;
  }
};


// src/services/api.js

/**
 * Generate content for a term
 * @param {Object} request - Term content request
 * @returns {Promise<Object>} - Generated content with submodule ID included
 */
export const generateTermContent = async (request) => {
  try {
    const response = await fetch(`${API_URL}/api/modules/term/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate term content: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the IDs for debugging purposes
    if (data.subModuleId) {
      console.log('Generated submodule ID:', data.subModuleId);
    }
    
    if (data.quizId) {
      console.log('Generated quiz ID:', data.quizId);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating term content:', error);
    throw error;
  }
};


export const getModuleTerms = async (moduleId) => {
  try {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}/terms`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch module terms: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching module terms:', error);
    throw error;
  }
};

export const getTermContent = async (moduleId, termId) => {
  try {
    const response = await fetch(`${API_URL}/api/modules/${moduleId}/terms/${termId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch term content: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching term content:', error);
    throw error;
  }
};

export const completeModuleTerm = async (moduleId, termId) => {
  try {
    const response = await fetch(`${API_URL}/api/progress/modules/${moduleId}/terms/${termId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark term as completed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing term:', error);
    throw error;
  }
};