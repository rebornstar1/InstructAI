"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Send, 
  Clock, 
  Tag, 
  ArrowLeft, 
  MoreHorizontal, 
  Reply, 
  Heart, 
  Bookmark, 
  Share2, 
  Sparkles,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import SocketIOService from '../../../services/socketIOService.js';

// Import API services
import { getThreadById, getUsersByThreadId } from "@/services/threadApi";
import { getConversationsByThreadId } from "@/services/conversationApi.js";
import { getMessagesByConversationId, createMessage, createReply } from "@/services/messageApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';



// User Profile Service
async function fetchUserProfile() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

export default function ThreadDetailPage({ params }) {
  const { threadId } = params;
  const [thread, setThread] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false);
  const [relatedCourses, setRelatedCourses] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentUser, setCurrentUser] = useState({id: null, username: ""});
  const [isUserLoading, setIsUserLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const typingTimeoutRef = useRef(null);


  useEffect(() => {
    const loadUserProfile = async () => {
      setIsUserLoading(true);
      try {
        const userProfile = await fetchUserProfile();
        setCurrentUser({
          id: userProfile.id,
          username: userProfile.username || userProfile.name || userProfile.email.split('@')[0]
        });
      } catch (error) {
        console.error("Error loading user profile:", error);
        toast({
          title: "Authentication Error",
          description: "Unable to load your profile. Please log in again.",
          variant: "destructive"
        });
        
        // Redirect to login page if authentication fails
        router.push('/login');
      } finally {
        setIsUserLoading(false);
      }
    };

    loadUserProfile();
  }, [router]);


  useEffect(() => {
    if (currentUser?.id) {
      console.log("Attempting to connect to Socket.IO with user:", currentUser);
      SocketIOService.connect(currentUser.id, currentUser.username)
        .then(() => {
          console.log("Socket.IO Connection successful");
          setIsConnected(true);
        })
        .catch(error => {
          console.error('Failed to connect to Socket.IO:', error);
          toast({
            title: "Connection Error",
            description: "Could not connect to chat server. Some features may be unavailable.",
            variant: "destructive"
          });
        });
    }
    
    return () => {
      // Disconnect on component unmount
      console.log("Disconnecting Socket.IO");
      SocketIOService.disconnect();
    };
  }, [currentUser]);




  // Fetch thread data
  useEffect(() => {
    const fetchThreadData = async () => {
      setIsLoading(true);
      try {
        // Fetch thread details
        const threadData = await getThreadById(threadId);
        setThread(threadData);

        // Fetch conversations in this thread
        const conversationsData = await getConversationsByThreadId(threadId);
        setConversations(conversationsData);

        // Set first conversation as active if available
        if (conversationsData.length > 0) {
          setCurrentConversation(conversationsData[0]);
          
          // Fetch messages for this conversation
          const messagesData = await getMessagesByConversationId(conversationsData[0].id);
          setMessages(messagesData);
        }

        // Fetch thread members
        const membersData = await getUsersByThreadId(threadId);
        setMembers(membersData);

        // Fetch related courses
        if (threadData.relatedCourseIds && threadData.relatedCourseIds.length > 0) {
          try {
            const coursesResponse = await fetch(`${API_URL}/api/courses/simplified?ids=${threadData.relatedCourseIds.join(',')}`);
            if (coursesResponse.ok) {
              const coursesData = await coursesResponse.json();
              setRelatedCourses(coursesData);
            }
          } catch (error) {
            console.error("Error fetching related courses:", error);
          }
        }

      } catch (error) {
        console.error("Error fetching thread data:", error);
        toast({
          title: "Error loading thread",
          description: "Could not load the thread data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (threadId) {
      fetchThreadData();
    }
  }, [threadId]);


  useEffect(() => {
    if (currentUser?.id) {
      SocketIOService.connect(currentUser.id, currentUser.username)
        .then(() => {
          setIsConnected(true);
        })
        .catch(error => {
          console.error('Failed to connect to WebSocket:', error);
        });
    }
    
    return () => {
      // Disconnect on component unmount
      SocketIOService.disconnect();
    };
  }, [currentUser]);
  
  // Add this effect to join conversation when it changes
  useEffect(() => {
    if (isConnected && currentUser?.id && currentConversation?.id) {
      SocketIOService.joinConversation(
        currentConversation.id,
        currentUser.id,
        currentUser.username,
        handleWebSocketMessage
      );
      
      // Leave conversation when it changes or component unmounts
      return () => {
        if (currentConversation?.id) {
          SocketIOService.leaveConversation(
            currentConversation.id,
            currentUser.id,
            currentUser.username
          );
        }
      };
    }
  }, [isConnected, currentConversation, currentUser]);

  const typingTimeoutsRef = useRef({});
  
  // Add this function to handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    console.log('Received Socket.IO message:', message);
    
    switch (message.type) {
      case 'CHAT':
        // If the message is not from the current user (to avoid duplicates)
        if (message.userId !== currentUser.id) {
          const newMessage = {
            id: message.messageId || `ws-${Date.now()}`,
            userId: message.userId,
            content: message.content,
            messageType: message.messageType || 'text',
            timestamp: message.timestamp,
            replyToMessageId: message.replyToMessageId,
            isTopLevelMessage: !message.replyToMessageId
          };
          
          // Use functional update to ensure we're working with the latest state
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
        break;
        
      case 'TYPING':
        // Handle typing indicator
        if (message.userId !== currentUser.id) {
          setTypingUsers(prev => {
            // Create a new Map to ensure state update triggers
            const newMap = new Map(prev);
            newMap.set(message.userId, message.username);
            return newMap;
          });
          
          // Clear after 3 seconds with a unique timeout for each user
          const userId = message.userId;
          if (typingTimeoutsRef.current[userId]) {
            clearTimeout(typingTimeoutsRef.current[userId]);
          }
          
          typingTimeoutsRef.current[userId] = setTimeout(() => {
            setTypingUsers(prev => {
              // Only remove if still present
              if (prev.has(userId)) {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
              }
              return prev;
            });
            delete typingTimeoutsRef.current[userId];
          }, 3000);
        }
        break;
        
      case 'JOIN':
      case 'LEAVE':
        // Handle join/leave notifications
        if (message.userId !== currentUser.id) {
          const action = message.type === 'JOIN' ? 'joined' : 'left';
          toast({
            title: `${message.username} ${action} the conversation`,
            duration: 2000,
          });
          
          // Update participants list if available
          if (currentConversation) {
            // This would typically come from an API, but we're simulating it here
            const updatedConversation = {...currentConversation};
            if (message.type === 'JOIN' && !updatedConversation.participantIds.includes(message.userId)) {
              updatedConversation.participantIds = [...updatedConversation.participantIds, message.userId];
            } else if (message.type === 'LEAVE') {
              updatedConversation.participantIds = updatedConversation.participantIds.filter(id => id !== message.userId);
            }
            setCurrentConversation(updatedConversation);
          }
        }
        break;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;
  
    const messageContent = replyingTo 
      ? `${newMessage} (Re: ${messages.find(m => m.id === replyingTo)?.content?.text?.substring(0, 50)}...)`
      : newMessage;
  
    // Temporary message to show immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      userId: currentUser.id,
      content: messageContent,
      messageType: "text",
      timestamp: new Date().toISOString(),
      isTemporary: true,
      isTopLevelMessage: !replyingTo,
      replyToMessageId: replyingTo || null
    };
  
    // Update UI optimistically
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    setNewMessage("");
    
    try {
      // Send via Socket.IO
      console.log("Sending message via Socket.IO:", {
        conversationId: currentConversation.id,
        userId: currentUser.id,
        username: currentUser.username,
        content: messageContent
      });
      
      const socketSent = SocketIOService.sendMessage(
        currentConversation.id,
        currentUser.id, 
        currentUser.username,
        messageContent,
        "text",
        replyingTo
      );
      
      if (!socketSent) {
        console.warn("Failed to send message via Socket.IO, falling back to API only");
      }
      
      // Also save to database with REST API
      let responseMessage;
      
      if (replyingTo) {
        // Create a reply
        responseMessage = await createReply(replyingTo, {
          userId: currentUser.id,
          content: messageContent,
          messageType: "text",
          conversationId: currentConversation.id
        });
        setReplyingTo(null);
      } else {
        // Create a top-level message
        responseMessage = await createMessage(currentConversation.id, {
          userId: currentUser.id,
          content: messageContent,
          messageType: "text"
        });
      }
  
      // Replace temporary message with real one
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempMessage.id ? responseMessage : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive"
      });
      
      // Remove temporary message on error
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
    }
  };

  // Handle creating a new conversation
  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/threads/${threadId}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newConversationTitle,
          participantIds: [currentUser.id]
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const newConversation = await response.json();
      
      // Update conversations list and set new one as current
      setConversations([...conversations, newConversation]);
      setCurrentConversation(newConversation);
      setMessages([]);
      setNewConversationTitle("");
      setIsNewConversationDialogOpen(false);
      
      toast({
        title: "Conversation created",
        description: "New conversation has been started successfully."
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Failed to create conversation",
        description: "Could not create a new conversation. Please try again.",
        variant: "destructive"
      });
    }
  };


  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator, but not too frequently
    if (!typingTimeoutRef.current && currentConversation && isConnected) {
      console.log("Sending typing indicator");
      SocketIOService.sendTypingIndicator(
        currentConversation.id,
        currentUser.id,
        currentUser.username
      );
      
      // Set a timeout to prevent sending too many events
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  // Handle switching between conversations
  const handleConversationChange = async (conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    setReplyingTo(null);
    
    try {
      const messagesData = await getMessagesByConversationId(conversation.id);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error loading messages",
        description: "Could not load conversation messages. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get user name by ID
  const getUserNameById = (userId) => {
    const member = members.find(m => m.id === userId);
    return member ? member.username : "Unknown User";
  };

  // Check if a message is from the current user
  const isCurrentUserMessage = (message) => {
    return message.userId === currentUser.id;
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Handle reply to a message
  const handleReplyClick = (messageId) => {
    setReplyingTo(messageId);
    // Focus the message input
    document.getElementById('message-input')?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Render message content based on type and JSON structure
  const renderMessageContent = (message) => {
    // Parse content if it's a string containing JSON
    let contentObj = message.content;
    if (typeof message.content === 'string') {
      try {
        contentObj = JSON.parse(message.content);
      } catch (e) {
        // If not valid JSON, use as is
        contentObj = { text: message.content };
      }
    }

    // Handle reply context if present
    const replyContext = contentObj.replyContext ? (
      <div className="text-xs italic text-slate-500 mb-1 pb-1 border-b border-slate-200">
        {contentObj.replyContext}
      </div>
    ) : null;

    switch (message.messageType?.toLowerCase()) {
      case "text":
        return (
          <div>
            {replyContext}
            <p className="whitespace-pre-wrap">{contentObj.text}</p>
          </div>
        );
      case "image":
        return (
          <div>
            {replyContext}
            <img 
              src={contentObj.imageUrl} 
              alt="Shared image" 
              className="max-w-xs rounded-lg border border-slate-200 my-2"
            />
            {contentObj.caption && <p className="text-sm text-slate-600 mt-1">{contentObj.caption}</p>}
          </div>
        );
      case "code":
        return (
          <div>
            {replyContext}
            <div className="bg-slate-900 text-slate-50 p-3 rounded-md my-2 font-mono text-sm overflow-x-auto">
              <pre>{contentObj.code}</pre>
              {contentObj.language && (
                <div className="text-xs text-slate-400 mt-2 pb-1">
                  {contentObj.language}
                </div>
              )}
            </div>
          </div>
        );
      default:
        // Handle plain strings
        if (typeof message.content === 'string' && !contentObj.text) {
          return <p className="whitespace-pre-wrap">{message.content}</p>;
        }
        // Fallback for any unhandled content type
        return <p>{typeof contentObj === 'object' ? JSON.stringify(contentObj) : contentObj}</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-12 w-full rounded-lg mb-6" />
              <Skeleton className="h-[60vh] w-full rounded-lg" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-60 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Thread Not Found</h1>
          <p className="text-slate-600 mb-6">
            The thread you're looking for might have been removed or is not accessible to you.
          </p>
          <Button 
            onClick={() => router.push('/community')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center text-sm gap-2 text-slate-600">
            <Link href="/community" className="hover:text-blue-600 transition-colors">
              Community
            </Link>
            <ChevronRight className="h-4 w-4" />
            {thread.parentThreadId && (
              <>
                <Link href={`/threads/${thread.parentThreadId}`} className="hover:text-blue-600 transition-colors">
                  Parent Thread
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-slate-800 font-medium truncate max-w-[180px]">
              {thread.name}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Thread Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{thread.name}</h1>
                <Badge className={thread.active ? 'bg-green-100 text-green-700 border-none' : 'bg-amber-100 text-amber-700 border-none'}>
                  {thread.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-slate-600 text-lg mb-2">{thread.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{members.length} members</span>
                </div>

                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{conversations.length} conversations</span>
                </div>
                
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Created {formatTimestamp(thread.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsNewConversationDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Conversations List */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 px-4 py-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    Conversations
                  </div>
                  
                  {conversations.length > 5 && (
                    <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {conversations.length === 0 ? (
                    <div className="py-8 text-center">
                      <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 mb-3">No conversations started yet</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsNewConversationDialogOpen(true)}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Start a Conversation
                      </Button>
                    </div>
                  ) : (
                    conversations.map(conversation => (
                      <div 
                        key={conversation.id}
                        className={`flex justify-between items-center p-3 hover:bg-slate-50 cursor-pointer ${
                          currentConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => handleConversationChange(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://avatar.vercel.sh/${conversation.id}`} />
                            <AvatarFallback>{conversation.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-slate-800">{conversation.title}</h3>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatTimestamp(conversation.lastActivityAt || conversation.startedAt)}</span>
                              
                              {conversation.participantIds?.length > 0 && (
                                <>
                                  <div className="h-1 w-1 bg-slate-300 rounded-full mx-2"></div>
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{conversation.participantIds.length} participants</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Messages Section */}
            {currentConversation ? (
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${currentConversation.id}`} />
                        <AvatarFallback>{currentConversation.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{currentConversation.title}</CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Started {formatTimestamp(currentConversation.startedAt)}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Bookmark className="h-4 w-4 mr-2" />
                          Bookmark
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Info className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Messages Container */}
                  <div className="h-[55vh] overflow-y-auto p-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageSquare className="h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700 mb-1">No messages yet</h3>
                        <p className="text-slate-500 mb-4 max-w-sm">
                          Be the first to contribute to this conversation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div key={message.id} className={`flex gap-3 ${isCurrentUserMessage(message) ? 'justify-end' : ''}`}>
                            {!isCurrentUserMessage(message) && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={`https://avatar.vercel.sh/${message.userId}`} />
                                <AvatarFallback>{getUserNameById(message.userId).substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={`max-w-[80%] ${isCurrentUserMessage(message) ? 'order-first' : 'order-last'}`}>
                              <div className={`px-4 py-3 rounded-lg ${
                                isCurrentUserMessage(message)
                                  ? 'bg-blue-600 text-white ml-auto'
                                  : 'bg-white border border-slate-200'
                              }`}>
                                {renderMessageContent(message)}
                              </div>
                              
                              <div className={`flex items-center gap-2 mt-1 text-xs ${
                                isCurrentUserMessage(message) ? 'justify-end text-slate-500' : 'text-slate-500'
                              }`}>
                                {!isCurrentUserMessage(message) && (
                                  <span className="font-medium">{getUserNameById(message.userId)}</span>
                                )}
                                <span>{formatTimestamp(message.timestamp)}</span>
                                
                                {!message.isTemporary && (
                                  <div className="flex items-center ml-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Heart className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Like</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={() => handleReplyClick(message.id)}
                                          >
                                            <Reply className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Reply</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {isCurrentUserMessage(message) && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src="/avatar-placeholder.png" />
                                <AvatarFallback>ME</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t border-slate-200">
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-blue-50 p-2 rounded mb-2 text-sm">
                        <div className="flex items-center">
                          <Reply className="h-3.5 w-3.5 text-blue-500 mr-2" />
                          <span className="text-slate-700">
                            Replying to {getUserNameById(messages.find(m => m.id === replyingTo)?.userId)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={cancelReply}
                        >
                          <span className="sr-only">Cancel reply</span>
                          <span aria-hidden>×</span>
                        </Button>
                      </div>
                    )}
                    <div className="flex items-end gap-3">
                    {typingUsers.size > 0 && (
                        <div className="text-xs text-slate-500 italic">
                          {Array.from(typingUsers.values()).join(", ")} 
                          {typingUsers.size === 1 ? " is" : " are"} typing...
                        </div>
                      )}
                      <Textarea
                        id="message-input"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleInputChange(e);
                        }}
                        placeholder={replyingTo ? "Type your reply..." : "Type your message..."}
                        className="min-h-[80px] flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 gap-2 h-10 px-4"
                      >
                        <Send className="h-4 w-4" />
                        {replyingTo ? "Reply" : "Send"}
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Press Shift + Enter for a new line. Messages support basic formatting.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">No Conversation Selected</h2>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Select a conversation from the list above or start a new conversation to begin discussing with others.
                  </p>
                  <Button 
                    onClick={() => setIsNewConversationDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Start a New Conversation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Thread Members */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50 px-4 py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Thread Members
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-[300px] overflow-y-auto">
                {members.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-slate-500 text-sm">No members in this thread yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${member.id}`} />
                          <AvatarFallback>{member.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-800 truncate">{member.username}</p>
                            {member.role === 'expert' && (
                              <Badge className="bg-blue-100 text-blue-800 border-none text-xs flex items-center gap-1 px-2">
                                <Sparkles className="h-3 w-3" />
                                Expert
                              </Badge>
                            )}
                            {member.role === 'moderator' && (
                              <Badge className="bg-purple-100 text-purple-800 border-none text-xs px-2">
                                Moderator
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-500 text-xs">
                            Level {member.level || 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
                <div className="flex justify-between w-full">
                  <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                  {members.length > 10 && <Button variant="link" size="sm" className="h-auto p-0">View All</Button>}
                </div>
              </CardFooter>
            </Card>

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 px-4 py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    Related Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {relatedCourses.map(course => (
                      <Link 
                        key={course.id} 
                        href={`/courses/${course.id}`}
                        className="block"
                      >
                        <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                          <div className="h-10 w-10 bg-indigo-100 rounded-md flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-slate-800 text-sm mb-1 truncate">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-100 text-slate-700 border-none text-xs">
                                {course.difficultyLevel || "All Levels"}
                              </Badge>
                              {course.modules && (
                                <span className="text-xs text-slate-500">
                                  {course.modules.length} modules
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thread Tags */}
            {thread.conceptTags && thread.conceptTags.length > 0 && (
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 px-4 py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    Concept Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {thread.conceptTags.map(tag => (
                      <Badge key={tag} className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Thread Actions */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Bookmark className="h-4 w-4" />
                    Bookmark Thread
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Thread
                  </Button>
                  <Link href={`/community`}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Community
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create New Conversation Dialog */}
      <Dialog open={isNewConversationDialogOpen} onOpenChange={setIsNewConversationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Conversation</DialogTitle>
            <DialogDescription>
              Start a new conversation in this thread. Add a descriptive title to help others understand the topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right font-medium text-sm">
                Title
              </label>
              <Input
                id="title"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
                className="col-span-3"
                placeholder="Give your conversation a title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConversationDialogOpen(false)}>
                Cancel
            </Button>
            <Button 
                type="button"
                onClick={handleCreateConversation}
                disabled={!newConversationTitle.trim()}
            >
                Create Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}