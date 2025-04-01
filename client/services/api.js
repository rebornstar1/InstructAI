// services/api.js - Centralized API service

const API_BASE_URL = 'http://localhost:8007/api';

/**
 * Fetch all available courses
 */
export const fetchCourses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/simplified`);
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
    const response = await fetch(`${API_BASE_URL}/courses/simplified/${courseId}`);
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
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`);
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
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}`);
    if (response.ok) {
    //   const data = await response.json();
    //   console.log(data,"data");
      return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/learning-resources/generate`, {
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
    const response = await fetch(`${API_BASE_URL}/courses/simplified/generate`, {
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
    const response = await fetch(`${API_BASE_URL}/courses/simplified/interactive/start`, {
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
    const response = await fetch(`${API_BASE_URL}/courses/simplified/interactive/continue?sessionId=${sessionId}`, {
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
    const response = await fetch(`${API_BASE_URL}/courses/simplified/interactive/finalize?sessionId=${sessionId}`, {
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