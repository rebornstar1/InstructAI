// socketIOService.js
import io from 'socket.io-client';
const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:9092';

const SocketIOService = {
    socket: null,
    connected: false,
    callbacks: {},
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    
    connect: function(userId, username) {
      if (this.socket && this.connected) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        try {
          // Connect to Socket.IO server with proper options
          this.socket = io(`${API_URL}`, {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket', 'polling'],  // Try WebSocket first, fall back to polling
            query: {
              userId: userId,
              username: username
            }
          });
          
          this.socket.on('connect', () => {
            console.log('Socket.IO connected with ID:', this.socket.id);
            this.connected = true;
            this.reconnectAttempts = 0;
            resolve();
          });
          
          this.socket.on('disconnect', (reason) => {
            console.log('Socket.IO disconnected. Reason:', reason);
            this.connected = false;
            
            // Handle different disconnect reasons
            if (reason === 'io server disconnect') {
              // The server has forcefully disconnected the socket
              console.log('Server disconnected the client, will not attempt to reconnect');
            } else {
              // Attempt to reconnect after 5 seconds
              console.log('Attempting to reconnect in 5 seconds...');
              setTimeout(() => {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                  this.reconnectAttempts++;
                  this.connect(userId, username).catch(console.error);
                } else {
                  console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
                }
              }, 5000);
            }
          });
          
          this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error.message);
            // Try alternative transport if available
            if (this.socket.io.opts.transports.length > 1) {
              console.log('Trying alternative transport method...');
            }
            reject(error);
          });
          
          // Handle different event types
          ['JOIN', 'LEAVE', 'CHAT', 'TYPING'].forEach(eventType => {
            this.socket.on(eventType, (message) => {
              try {
                console.log(`Received ${eventType} event:`, message);
                const conversationId = message.conversationId;
                
                // Validate message structure
                if (!conversationId) {
                  console.error(`Invalid ${eventType} message: missing conversationId`, message);
                  return;
                }
                
                // Call all registered callbacks for this conversation
                if (this.callbacks[conversationId]) {
                  this.callbacks[conversationId].forEach(callback => {
                    try {
                      callback(message);
                    } catch (callbackError) {
                      console.error(`Error in ${eventType} event callback:`, callbackError);
                    }
                  });
                }
              } catch (error) {
                console.error(`Error handling ${eventType} message:`, error);
              }
            });
          });
          
          // Handle ping/pong to detect connection health
          this.socket.io.on("ping", () => {
            console.debug("Socket.IO ping received");
          });
          
          // Listen for server error messages
          this.socket.on('error', (error) => {
            console.error('Socket.IO server error:', error);
          });
          
        } catch (error) {
          console.error('Error initializing Socket.IO connection:', error);
          reject(error);
        }
      });
    },
    
    disconnect: function() {
      if (this.socket) {
        // Clear all callbacks first
        this.callbacks = {};
        
        // Then disconnect the socket
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
        console.log('Socket.IO client disconnected');
      }
    },
    
    joinConversation: function(conversationId, userId, username, callback) {
      if (!this.connected || !this.socket) {
        console.error('Cannot join conversation: Socket.IO not connected');
        return false;
      }
      
      console.log(`Joining conversation: ${conversationId}`);
      
      // Register callback for this conversation
      if (!this.callbacks[conversationId]) {
        this.callbacks[conversationId] = [];
      }
      
      // Prevent duplicate callbacks
      if (!this.callbacks[conversationId].includes(callback)) {
        this.callbacks[conversationId].push(callback);
      }
      
      // Send join message
      const message = {
        type: 'JOIN',
        conversationId: conversationId,
        userId: userId,
        username: username,
        timestamp: new Date().toISOString()
      };
      
      // Use acknowledgment callback to confirm receipt
      this.socket.emit('JOIN', message, (response) => {
        if (response && response.status === 'ok') {
          console.log(`Successfully joined conversation: ${conversationId}`);
        } else {
          console.warn(`Join acknowledgment for conversation ${conversationId} returned:`, response);
        }
      });
      
      return true;
    },
    
    leaveConversation: function(conversationId, userId, username) {
      if (!this.connected || !this.socket) {
        console.error('Cannot leave conversation: Socket.IO not connected');
        return false;
      }
      
      console.log(`Leaving conversation: ${conversationId}`);
      
      // Send leave message
      const message = {
        type: 'LEAVE',
        conversationId: conversationId,
        userId: userId,
        username: username,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('LEAVE', message);
      
      // Remove callbacks for this conversation
      delete this.callbacks[conversationId];
      
      return true;
    },
    
    sendMessage: function(conversationId, userId, username, content, messageType, replyToMessageId) {
      if (!this.connected || !this.socket) {
        console.error('Cannot send message: Socket.IO not connected');
        return false;
      }
      
      // Create a unique message ID for tracking
      const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send chat message
      const message = {
        type: 'CHAT',
        messageId: clientMessageId,
        conversationId: conversationId,
        userId: userId,
        username: username,
        content: content,
        messageType: messageType || 'text',
        replyToMessageId: replyToMessageId,
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending message via Socket.IO:', message);
      
      // Track message delivery with acknowledgment
      this.socket.emit('CHAT', message, (response) => {
        if (response && response.status === 'ok') {
          console.log(`Message ${clientMessageId} delivered successfully`);
        } else {
          console.warn(`Message ${clientMessageId} delivery status:`, response);
        }
      });
      
      return true;
    },
    
    sendTypingIndicator: function(conversationId, userId, username) {
      if (!this.connected || !this.socket) {
        return false;
      }
      
      // Send typing indicator
      const message = {
        type: 'TYPING',
        conversationId: conversationId,
        userId: userId,
        username: username,
        timestamp: new Date().toISOString()
      };
      
      // No need for acknowledgment on typing indicators
      this.socket.emit('TYPING', message);
      return true;
    },
    
    // Helper method to check server connection status
    checkConnection: function() {
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          return reject(new Error('Socket not initialized'));
        }
        
        // Send a ping and wait for pong
        this.socket.emit('ping', null, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
          reject(new Error('Connection check timed out'));
        }, 3000);
      });
    }
};
  
export default SocketIOService;