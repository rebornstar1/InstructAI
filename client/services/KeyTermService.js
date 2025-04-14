// services/keyTermService.js

/**
 * Service for handling key term extraction and processing
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export async function extractKeyTerms(moduleId, moduleTitle, conceptTitle) {
    try {
      const response = await fetch(`${API_URL}/api/v1/keyterms/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          moduleTitle: moduleTitle || '',
          conceptTitle: conceptTitle || '',
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error extracting key terms: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to extract key terms:', error);
      throw error;
    }
  }
  
  /**
   * Save extracted key terms to a module
   */
  export async function saveKeyTermsToModule(moduleId, keyTermsData) {
    try {
      // Extract terms and definitions from the response
      const terms = keyTermsData.keyTerms.map(item => item.term);
      const definitions = keyTermsData.keyTerms.map(item => item.definition);
  
      // Make API call to update the module with key terms
      const response = await fetch(`${API_URL}/api/modules/${moduleId}/key-terms`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyTerms: terms,
          definitions: definitions
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error saving key terms: ${response.statusText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Failed to save key terms to module:', error);
      throw error;
    }
  }