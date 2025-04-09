"use client";

import { useState, useEffect, useRef } from "react";
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
  const messagesEndRef = useRef(null);
  const router = useRouter();

  // Fetch thread data
  useEffect(() => {
    const fetchThreadData = async () => {
      setIsLoading(true);
      try {
        // Fetch thread details
        const threadResponse = await fetch(`/api/threads/${threadId}`);
        if (!threadResponse.ok) throw new Error("Failed to fetch thread");
        const threadData = await threadResponse.json();
        setThread(threadData);

        // Fetch conversations in this thread
        const conversationsResponse = await fetch(`/api/threads/${threadId}/conversations`);
        if (!conversationsResponse.ok) throw new Error("Failed to fetch conversations");
        const conversationsData = await conversationsResponse.json();
        setConversations(conversationsData);

        // Set first conversation as active if available
        if (conversationsData.length > 0) {
          setCurrentConversation(conversationsData[0]);
          
          // Fetch messages for this conversation
          const messagesResponse = await fetch(`/api/conversations/${conversationsData[0].id}/messages`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(messagesData);
          }
        }

        // Fetch thread members
        const membersResponse = await fetch(`/api/threads/${threadId}/members`);
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }

        // Fetch related courses
        if (threadData.relatedCourseIds && threadData.relatedCourseIds.length > 0) {
          const coursesResponse = await fetch(`/api/courses/simplified?ids=${threadData.relatedCourseIds.join(',')}`);
          if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            setRelatedCourses(coursesData);
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    // Temporary message to show immediately
    const tempMessage = {
      id: Date.now().toString(),
      userId: "current-user", // Replace with actual current user ID
      content: { text: newMessage },
      messageType: "text",
      timestamp: new Date().toISOString(),
      isTemporary: true
    };

    // Update UI optimistically
    setMessages([...messages, tempMessage]);
    setNewMessage("");

    try {
      const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: { text: newMessage },
          messageType: "text"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Fetch updated messages to ensure consistency
      const updatedMessagesResponse = await fetch(`/api/conversations/${currentConversation.id}/messages`);
      if (updatedMessagesResponse.ok) {
        const messagesData = await updatedMessagesResponse.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive"
      });
      
      // Remove temporary message on error
      setMessages(messages.filter(msg => !msg.isTemporary));
    }
  };

  // Handle creating a new conversation
  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return;

    try {
      const response = await fetch(`/api/threads/${threadId}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newConversationTitle
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

  // Handle switching between conversations
  const handleConversationChange = async (conversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    
    try {
      const messagesResponse = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (!messagesResponse.ok) {
        throw new Error("Failed to fetch messages");
      }
      
      const messagesData = await messagesResponse.json();
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

  // Render message content based on type
  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case "text":
        return <p className="whitespace-pre-wrap">{message.content.text}</p>;
      case "image":
        return (
          <div>
            <img 
              src={message.content.imageUrl} 
              alt="Shared image" 
              className="max-w-xs rounded-lg border border-slate-200 my-2"
            />
            {message.content.caption && <p className="text-sm text-slate-600 mt-1">{message.content.caption}</p>}
          </div>
        );
      case "code":
        return (
          <div className="bg-slate-900 text-slate-50 p-3 rounded-md my-2 font-mono text-sm overflow-x-auto">
            <pre>{message.content.code}</pre>
            {message.content.language && (
              <div className="text-xs text-slate-400 mt-2 pb-1">
                {message.content.language}
              </div>
            )}
          </div>
        );
      default:
        return <p>{JSON.stringify(message.content)}</p>;
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
                        {messages.map((message, index) => (
                          <div key={message.id} className={`flex gap-3 ${message.userId === 'current-user' ? 'justify-end' : ''}`}>
                            {message.userId !== 'current-user' && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={`https://avatar.vercel.sh/${message.userId}`} />
                                <AvatarFallback>{getUserNameById(message.userId).substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={`max-w-[80%] ${message.userId === 'current-user' ? 'order-first' : 'order-last'}`}>
                              <div className={`px-4 py-3 rounded-lg ${
                                message.userId === 'current-user'
                                  ? 'bg-blue-600 text-white ml-auto'
                                  : 'bg-white border border-slate-200'
                              }`}>
                                {renderMessageContent(message)}
                              </div>
                              
                              <div className={`flex items-center gap-2 mt-1 text-xs ${
                                message.userId === 'current-user' ? 'justify-end text-slate-500' : 'text-slate-500'
                              }`}>
                                {message.userId !== 'current-user' && (
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
                                          <Button variant="ghost" size="icon" className="h-6 w-6">
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
                            
                            {message.userId === 'current-user' && (
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
                    <div className="flex items-end gap-3">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
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
                        Send
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