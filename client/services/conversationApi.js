const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';


export const getConversationsByThreadId = async (threadId) => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${threadId}/conversations`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  };
  
  export const getConversationById = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching conversation:", error);
      throw error;
    }
  };
  
  // Create a new conversation in a thread
  export const createConversation = async (threadId, conversationData) => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${threadId}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: conversationData.title,
          participantIds: conversationData.participantIds || [],
          conceptTags: conversationData.conceptTags || []
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };
  
  // Update a conversation
  export const updateConversation = async (conversationId, conversationData) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: conversationData.title,
          conceptTags: conversationData.conceptTags || []
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }
  };
  
  // Delete a conversation
  export const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  };
  
  // Add a participant to a conversation
  export const addParticipantToConversation = async (conversationId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/participants/${userId}`, {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error adding participant:", error);
      throw error;
    }
  };
  
  // Remove a participant from a conversation
  export const removeParticipantFromConversation = async (conversationId, userId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/participants/${userId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error removing participant:", error);
      throw error;
    }
  };
  
  // Get conversations by participant
  export const getConversationsByParticipantId = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/conversations`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      throw error;
    }
  };