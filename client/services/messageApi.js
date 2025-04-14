// src/services/messageApi.js

/**
 * API service for handling message-related operations
 */

// Get all messages in a conversation

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export const getMessagesByConversationId = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  };
  
  // Get only top-level messages in a conversation
  export const getTopLevelMessagesByConversationId = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/top-level-messages`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching top-level messages:", error);
      throw error;
    }
  };
  
  // Get threaded messages (top-level with replies)
  export const getThreadedMessagesByConversationId = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/threaded-messages`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching threaded messages:", error);
      throw error;
    }
  };
  
  // Create a new top-level message
  export const createMessage = async (conversationId, messageData) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: messageData.userId,
          content: messageData.content,
          messageType: messageData.messageType,
          conceptTags: messageData.conceptTags || []
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error creating message:", error);
      throw error;
    }
  };
  
  // Create a reply to a message
  export const createReply = async (messageId, messageData) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: messageData.userId,
          content: messageData.content,
          messageType: messageData.messageType,
          conceptTags: messageData.conceptTags || []
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error creating reply:", error);
      throw error;
    }
  };
  
  // Update a message
  export const updateMessage = async (messageId, messageData) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageData.content,
          conceptTags: messageData.conceptTags || []
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error updating message:", error);
      throw error;
    }
  };
  
  // Delete a message
  export const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };
  
  // Search messages
  export const searchMessages = async (searchTerm) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/search?term=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error searching messages:", error);
      throw error;
    }
  };