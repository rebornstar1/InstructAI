"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  ChevronRight, 
  Clock, 
  ChevronLeft,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  Tag,
  Users,
  AlertCircle,
  PlusCircle,
  MessageCircle,
  Share2,
  BookOpen,
  Bookmark
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Navbar2 from "@/components/Navbar2";
import ProtectedRoute from "@/components/ProtectedRoute";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';



export default function CommunityPage() {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("newest");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newThreadName, setNewThreadName] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const [users,setUsers] = useState(0);

  useEffect(() => {
    // Set isLoaded for animations
    setIsLoaded(true);
    
    // Fetch available threads from backend
    const fetchThreads = async () => {
      try {
        const response = await fetch(`${API_URL}/api/threads/main`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setThreads(data);
        setShowEmptyState(data.length === 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching threads:", error);
        setShowError(true);
        setIsLoading(false);
      }
    };

    fetchThreads();
  }, []);

useEffect(() => {
    // Set isLoaded for animations
    setIsLoaded(true);
    
    // Fetch available threads from backend
    const fetchUsers     = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setUsers(data.length);
        setShowEmptyState(data.length === 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching threads:", error);
        setShowError(true);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const navigateToThread = (threadId) => {
    router.push(`/thread/${threadId}`);
  };

  const navigateBack = () => {
    router.push("/");
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  const handleCreateThread = async () => {
    if (!newThreadName.trim()) return;
    
    // Here you would normally call an API to create a new thread
    // For now, we'll just simulate it by adding a new thread to the state
    const newThread = {
      id: threads.length + 1,
      name: newThreadName,
      description: newThreadDescription,
      parentThreadId: null,
      subThreadIds: [],
      createdAt: new Date().toISOString(),
      active: true,
      relatedCourseIds: []
    };
    
    setThreads([...threads, newThread]);
    setNewThreadName("");
    setNewThreadDescription("");
    setDialogOpen(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setShowError(false);
    
    // Refetch threads on retry
    const fetchThreads = async () => {
      try {
        const response = await fetch(`${API_URL}/api/threads/main`);
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setThreads(data);
        setShowEmptyState(data.length === 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching threads:", error);
        setShowError(true);
        setIsLoading(false);
      }
    };

    fetchThreads();
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Sort and filter the threads
  let processedThreads = [...threads];

  // Apply sorting
  if (sortBy === "newest") {
    processedThreads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === "oldest") {
    processedThreads.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === "a-z") {
    processedThreads.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  } else if (sortBy === "z-a") {
    processedThreads.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
  }

  // Apply search filter
  const filteredThreads = processedThreads.filter(thread => {
    const name = thread.name?.toLowerCase() || "";
    const description = thread.description?.toLowerCase() || "";
    return name.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase());
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const generateSkeletonCards = (count) => {
    return Array(count).fill(0).map((_, index) => (
      <div key={index}>
        <Card className="overflow-hidden h-full border border-slate-200">
          <div className="h-2 bg-slate-200"></div>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-auto flex justify-end">
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    ));
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER */}
      <Navbar2/>

      {/* MAIN CONTENT */}
      <main className="pt-32 md:pt-32 pb-16 px-6 md:px-8 max-w-screen-xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <motion.div className="inline-block mb-3">
              <div className="flex items-center">
                <div className="h-0.5 w-10 bg-purple-600 mr-3"></div>
                <span className="text-purple-600 font-medium">Community Discussions</span>
              </div>
            </motion.div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-2">
                  Join the <span className="relative">
                    <span className="relative z-10">Conversation</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-purple-100 z-0"></span>
                  </span>
                </h1>
                
                <p className="text-lg text-slate-600 max-w-2xl">
                  Connect with others, share your thoughts, and explore a variety of discussion threads in our community.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={navigateBack} 
                  className="flex items-center gap-2 text-slate-700 hover:text-purple-600 hover:bg-purple-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Overview */}
          {!isLoading && !showError && threads.length > 0 && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500">Total Threads</p>
                    <h3 className="text-3xl font-bold mt-1 text-slate-800">{threads.length}</h3>
                  </div>
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm mt-6 text-purple-600 font-medium">Join the discussion today</p>
              </div>
              
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500">Active Members</p>
                    <h3 className="text-3xl font-bold mt-1 text-slate-800">{users}</h3>
                  </div>
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm mt-6 text-purple-600 font-medium">Growing community</p>
              </div>
              
              <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500">Last Activity</p>
                    <h3 className="text-3xl font-bold mt-1 text-slate-800">
                      {threads.length > 0 ? formatDate(
                        threads.reduce((latest, thread) => {
                          const threadDate = new Date(thread.createdAt);
                          return threadDate > latest ? threadDate : latest;
                        }, new Date(0))
                      ) : "No activity"}
                    </h3>
                  </div>
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm mt-6 text-purple-600 font-medium">Stay up to date</p>
              </div>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 mt-8">
            <div className="relative flex-1 max-w-2xl mx-auto md:mx-0">
              <Input
                type="text"
                placeholder="Search threads by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 w-full border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-300 rounded-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              
              {searchTerm && (
                <Button 
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                      <Button 
                        variant="ghost" 
                        className={`h-10 px-3 rounded-none ${viewMode === 'grid' ? 'bg-purple-50 text-purple-700' : ''}`}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className={`h-10 px-3 rounded-none ${viewMode === 'list' ? 'bg-purple-50 text-purple-700' : ''}`}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Change view mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px] h-10 border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4 text-slate-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="a-z">Title (A-Z)</SelectItem>
                    <SelectItem value="z-a">Title (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transform transition hover:translate-y-[-2px] hover:shadow-lg flex items-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    New Thread
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Thread</DialogTitle>
                    <DialogDescription>
                      Start a new conversation in the community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium text-slate-700">
                        Thread Title
                      </label>
                      <Input
                        id="name"
                        value={newThreadName}
                        onChange={(e) => setNewThreadName(e.target.value)}
                        placeholder="Enter thread title"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium text-slate-700">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        value={newThreadDescription}
                        onChange={(e) => setNewThreadDescription(e.target.value)}
                        placeholder="Describe what this thread is about..."
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleCreateThread}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      Create Thread
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Results info */}
          {!isLoading && !showError && filteredThreads.length > 0 && (
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-4"
            >
              <div className="text-sm text-slate-500">
                Showing {filteredThreads.length} of {threads.length} threads
              </div>
              
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="text-xs border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                >
                  Clear Search
                </Button>
              )}
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
            >
              {generateSkeletonCards(6)}
            </motion.div>
          )}

          {/* Error State */}
          {showError && (
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h3>
              <p className="text-slate-600 max-w-md mb-6">
                We couldn't load the community threads at this time. Please check your connection and try again.
              </p>
              <Button 
                onClick={handleRetry} 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-lg font-medium transform transition hover:translate-y-[-2px] hover:shadow-lg gap-2"
              >
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retry
              </Button>
            </motion.div>
          )}

          {/* Empty State */}
          {showEmptyState && !isLoading && !showError && (
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No discussion threads yet</h3>
              <p className="text-slate-600 max-w-md mb-6">
                Be the first to start a conversation in our community by creating a new thread.
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-lg font-medium transform transition hover:translate-y-[-2px] hover:shadow-lg flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Start a Thread
              </Button>
            </motion.div>
          )}

          {/* Search Results - No matches */}
          {!isLoading && !showError && !showEmptyState && filteredThreads.length === 0 && (
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No matching threads</h3>
              <p className="text-slate-600 max-w-md mb-6">
                No threads found matching "{searchTerm}". Try adjusting your search or create a new thread.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button 
                  onClick={() => setSearchTerm("")} 
                  variant="outline" 
                  className="gap-2 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Clear Search
                </Button>
                <Button 
                  onClick={() => setDialogOpen(true)} 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Thread
                </Button>
              </div>
            </motion.div>
          )}

          {/* Grid View */}
          {!isLoading && !showError && filteredThreads.length > 0 && viewMode === "grid" && (
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
            >
              <AnimatePresence>
                {filteredThreads.map((thread) => (
                  <motion.div
                    key={thread.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer transition-all duration-300 h-full border border-slate-200 hover:border-purple-200 hover:shadow-lg"
                      onClick={() => navigateToThread(thread.id)}
                    >
                      <div className="h-2 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-purple-100 p-1.5 rounded-full">
                            <MessageCircle className="h-5 w-5 text-purple-600" />
                          </div>
                          <h2 className="text-xl font-bold text-slate-800 line-clamp-1">
                            {thread.name || "Untitled Thread"}
                          </h2>
                        </div>
                        
                        <p className="text-slate-600 mb-5 flex-grow line-clamp-3">
                          {thread.description || "No description available."}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Community
                          </Badge>
                          
                          {thread.relatedCourseIds && thread.relatedCourseIds.length > 0 && (
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">
                              <BookOpen className="h-3.5 w-3.5 mr-1" />
                              {thread.relatedCourseIds.length} related {thread.relatedCourseIds.length === 1 ? 'course' : 'courses'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                          <span className="text-sm text-slate-500">Created: {formatDate(thread.createdAt)}</span>
                          <div className="flex items-center text-purple-600 text-sm font-medium">
                            View Thread
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* List View */}
          {!isLoading && !showError && filteredThreads.length > 0 && viewMode === "list" && (
            <motion.div 
              variants={itemVariants}
              className="space-y-4 mt-6"
            >
              <AnimatePresence>
                {filteredThreads.map((thread) => (
                  <motion.div
                    key={thread.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer transition-all duration-300 border border-slate-200 hover:border-purple-200 hover:shadow-md"
                      onClick={() => navigateToThread(thread.id)}
                    >
                      <div className="flex h-full">
                        <div className="w-2 bg-gradient-to-b from-purple-600 to-indigo-600"></div>
                        <CardContent className="p-5 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="bg-purple-100 p-1.5 rounded-full">
                                  <MessageCircle className="h-4 w-4 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">
                                  {thread.name || "Untitled Thread"}
                                </h2>
                              </div>
                              
                              <p className="text-slate-600 line-clamp-2 md:pr-4">
                                {thread.description || "No description available."}
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                              <div className="flex items-center gap-3 text-sm text-slate-500">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{formatDate(thread.createdAt)}</span>
                                </div>
                                {thread.relatedCourseIds && thread.relatedCourseIds.length > 0 && (
                                  <div className="flex items-center">
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    <span>{thread.relatedCourseIds.length} {thread.relatedCourseIds.length === 1 ? 'course' : 'courses'}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-purple-600 text-sm font-medium flex items-center whitespace-nowrap">
                                View Thread
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {!isLoading && !showError && filteredThreads.length > 9 && (
            <motion.div 
              variants={itemVariants}
              className="flex justify-center mt-12"
            >
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                  className="border-slate-200 text-slate-600"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-purple-50 text-purple-700 border-purple-200">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                    3
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Featured Threads Section */}
      {!isLoading && !showError && filteredThreads.length > 0 && (
        <section className="pt-8 pb-20 bg-slate-100">
          <div className="max-w-screen-xl mx-auto px-6 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Featured Discussions</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Join these popular conversations and share your perspective with the community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredThreads.slice(0, 2).map((thread) => (
                <Card 
                  key={thread.id}
                  className="overflow-hidden cursor-pointer transition-all duration-300 border border-slate-200 hover:border-purple-200 hover:shadow-lg"
                  onClick={() => navigateToThread(thread.id)}
                >
                  <div className="h-2 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <MessageCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                          {thread.name || "Untitled Thread"}
                        </h3>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700 border-none">
                        Featured
                      </Badge>
                    </div>
                    
                    <p className="text-slate-600 mb-6 line-clamp-3">
                      {thread.description || "No description available."}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatDate(thread.createdAt)}</span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        Join Discussion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
     

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          {/* Main footer content */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="h-10 w-10 bg-purple-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight">
                  Instruct<span className="text-purple-500">AI</span>
                </span>
              </div>
              <p className="text-slate-400 mb-6">
                Revolutionizing personalized education through AI-powered learning experiences.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'linkedin', 'instagram'].map(social => (
                  <a key={social} href="#" className="text-slate-500 hover:text-purple-400 transition">
                    <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center">
                      <span className="sr-only">{social}</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Use Cases', 'Roadmap', 'Integrations'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Community</h3>
              <ul className="space-y-2">
                {['Forums', 'Events', 'Discord Server', 'User Stories', 'Contribute'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom footer */}
          <div className="py-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} InstructAI, Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Terms</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Cookies</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </ProtectedRoute>
  );
}