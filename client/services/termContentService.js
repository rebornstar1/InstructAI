// services/termContentService.js
import { api } from './api';

export const getTermContent = async (moduleId, termIndex) => {
  try {
    const response = await api.get(`/modules/${moduleId}/terms/${termIndex}/content`);
    return response.data;
  } catch (error) {
    // If no existing content is found, return null
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Error fetching term content:', error);
    throw error;
  }
};

export const createTermContent = async (request) => {
  try {
    const response = await api.post('/modules/terms/content', request);
    return response.data;
  } catch (error) {
    console.error('Error creating term content:', error);
    throw error;
  }
};