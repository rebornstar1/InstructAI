// services/threadApi.js

/**
 * Fetches a thread by ID
 * @param {string|number} threadId The ID of the thread to fetch
 * @returns {Promise<Object>} The thread data
 */
export async function getThreadById(threadId) {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Important for auth cookies
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch thread with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getThreadById:", error);
      throw error;
    }
  }
  
  /**
   * Fetches conversations for a thread
   * @param {string|number} threadId The ID of the thread
   * @returns {Promise<Array>} The conversations in this thread
   */
  export async function getThreadConversations(threadId) {
    try {
      const response = await fetch(`/api/threads/${threadId}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getThreadConversations:", error);
      throw error;
    }
  }
  
  /**
   * Fetches members of a thread
   * @param {string|number} threadId The ID of the thread
   * @returns {Promise<Array>} The members in this thread
   */
  export async function getThreadMembers(threadId) {
    try {
      const response = await fetch(`/api/threads/${threadId}/members`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch members with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getThreadMembers:", error);
      throw error;
    }
  }
  
  /**
   * Creates a new conversation in a thread
   * @param {string|number} threadId The ID of the thread
   * @param {Object} conversationData The data for the new conversation
   * @returns {Promise<Object>} The created conversation
   */
  export async function createConversation(threadId, conversationData) {
    try {
      const response = await fetch(`/api/threads/${threadId}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(conversationData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create conversation with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in createConversation:", error);
      throw error;
    }
  }
  
  /**
   * Fetches messages for a conversation
   * @param {string|number} conversationId The ID of the conversation
   * @returns {Promise<Array>} The messages in this conversation
   */
  export async function getConversationMessages(conversationId) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getConversationMessages:", error);
      throw error;
    }
  }
  
  /**
   * Sends a message in a conversation
   * @param {string|number} conversationId The ID of the conversation
   * @param {Object} messageData The message data to send
   * @returns {Promise<Object>} The created message
   */
  export async function sendMessage(conversationId, messageData) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    }
  }
  
  /**
   * Joins a thread (adds current user to the thread)
   * @param {string|number} threadId The ID of the thread to join
   * @returns {Promise<Object>} The updated thread membership
   */
  export async function joinThread(threadId) {
    try {
      const response = await fetch(`/api/threads/${threadId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to join thread with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in joinThread:", error);
      throw error;
    }
  }
  
  /**
   * Leaves a thread (removes current user from the thread)
   * @param {string|number} threadId The ID of the thread to leave
   * @returns {Promise<void>}
   */
  export async function leaveThread(threadId) {
    try {
      const response = await fetch(`/api/threads/${threadId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to leave thread with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in leaveThread:", error);
      throw error;
    }
  }
  
  /**
   * Get all threads the current user is a member of
   * @returns {Promise<Array>} List of threads the user is a member of
   */
  export async function getUserThreads() {
    try {
      const response = await fetch('/api/user/threads', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user threads with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in getUserThreads:", error);
      throw error;
    }
  }