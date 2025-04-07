// src/services/progressService.js

import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Service for handling module progress with automatic completion
 */
class ProgressService {
  /**
   * Get module progress for a specific user and module
   */
  async getModuleProgress(userId, moduleId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/progress/users/${userId}/modules/${moduleId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching module progress:', error);
      throw error;
    }
  }

  /**
   * Get course progress for a specific user and course
   */
  async getCourseProgress(userId, courseId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/progress/users/${userId}/courses/${courseId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching course progress:', error);
      throw error;
    }
  }

  /**
   * Get detailed course progress with all module progress
   */
  async getCourseWithAllProgress(userId, courseId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/progress/users/${userId}/courses/${courseId}/full`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching detailed course progress:', error);
      throw error;
    }
  }

  /**
   * Mark a submodule as completed, may auto-complete the module
   */
  async completeSubmodule(userId, moduleId, submoduleId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/progress/users/${userId}/modules/${moduleId}/submodules/${submoduleId}/complete`
      );
      return response.data;
    } catch (error) {
      console.error('Error completing submodule:', error);
      throw error;
    }
  }

  /**
   * Complete a quiz, may auto-complete the module
   */
  async completeQuiz(userId, moduleId, score) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/progress/users/${userId}/modules/${moduleId}/quiz/complete?score=${score}`
      );
      return response.data;
    } catch (error) {
      console.error('Error completing quiz:', error);
      throw error;
    }
  }

  /**
   * Mark a video as watched, may auto-complete the module
   */
  async completeVideo(userId, moduleId, videoId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/progress/users/${userId}/modules/${moduleId}/videos/${videoId}/complete`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking video as completed:', error);
      throw error;
    }
  }

  /**
   * Check if a module should be auto-completed
   */
  async checkModuleCompletion(userId, moduleId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/progress/users/${userId}/modules/${moduleId}/check-completion`
      );
      return response.data;
    } catch (error) {
      console.error('Error checking module completion:', error);
      throw error;
    }
  }

  /**
   * Get progress summary for dashboard
   */
  async getProgressSummary() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/progress/summary`,
        { credentials: 'include' }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      throw error;
    }
  }

  /**
   * Update the total submodules count for a module
   */
  async updateTotalSubmodules(moduleId) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/progress/modules/${moduleId}/update-total-submodules`
      );
      return response.data;
    } catch (error) {
      console.error('Error updating total submodules:', error);
      throw error;
    }
  }
}

export default new ProgressService();