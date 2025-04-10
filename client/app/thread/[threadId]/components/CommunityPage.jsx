"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  Search, 
  Filter,
  Layers,
  Clock,
  Tag,
  AlertCircle,
  ChevronRight,
  RefreshCcw,
  Plus,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

// Import API services
import { getAllMainThreads, getThreadsByUserId, createThread } from "@/services/threadApi";

export default function CommunityPage() {
  const [allThreads, setAllThreads] = useState([]);
  const [userThreads, setUserThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [isNewThreadDialogOpen, setIsNewThreadDialogOpen] = useState(false);
  const [newThreadData, setNewThreadData] = useState({
    name: "",
    description: "",
    active: true,
    conceptTags: []
  });
  const [newTagInput, setNewTagInput] = useState("");
  const router = useRouter();

  // Current user simulation - in a real app, this would come from authentication
  const currentUser = {
    id: 1, // Replace with actual user ID from your auth system
    username: "Current User"
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Fetch all main threads
      const allThreadsData = await getAllMainThreads();
      setAllThreads(allThreadsData);
      
      // Fetch user's threads
      try {
        const userThreadsData = await getThreadsByUserId(currentUser.id);
        setUserThreads(userThreadsData);
      } catch (userThreadsError) {
        console.error("Error fetching user threads:", userThreadsError);
        // Don't set an error for this as it might just mean the user is not logged in
      }
      
    } catch (error) {
      console.error("Error fetching threads:", error);
      setErrorMessage("Failed to load community threads. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter threads based on search term and filter option
  const getFilteredThreads = () => {
    let filtered = activeTab === "all" ? allThreads : userThreads;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(thread => 
        thread.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterBy !== "all") {
      if (filterBy === "active") {
        filtered = filtered.filter(thread => thread.active);
      } else if (filterBy === "course") {
        filtered = filtered.filter(thread => thread.relatedCourseIds?.length > 0);
      } else if (filterBy === "parent") {
        filtered = filtered.filter(thread => !thread.parentThreadId);
      } else if (filterBy === "sub") {
        filtered = filtered.filter(thread => thread.parentThreadId);
      }
    }
    
    return filtered;
  };
  
  const filteredThreads = getFilteredThreads();

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Handle creating a new thread
  const handleCreateThread = async () => {
    if (!newThreadData.name.trim()) {
      toast({
        title: "Thread name required",
        description: "Please provide a name for your thread.",
        variant: "destructive"
      });
      return;
    }

    try {
      const createdThread = await createThread({
        ...newThreadData,
        // Add any additional data needed
      });

      // Update the threads list
      setAllThreads([...allThreads, createdThread]);
      
      // If the user is the creator, also add to user threads
      setUserThreads([...userThreads, createdThread]);
      
      // Reset form and close dialog
      setNewThreadData({
        name: "",
        description: "",
        active: true,
        conceptTags: []
      });
      setIsNewThreadDialogOpen(false);
      
      toast({
        title: "Thread created",
        description: "Your new thread has been created successfully."
      });
      
      // Optionally navigate to the new thread
      router.push(`/threads/${createdThread.id}`);
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Failed to create thread",
        description: "Could not create your thread. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle adding tags to the new thread
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    
    // Check if tag already exists
    if (!newThreadData.conceptTags.includes(newTagInput.trim())) {
      setNewThreadData({
        ...newThreadData,
        conceptTags: [...newThreadData.conceptTags, newTagInput.trim()]
      });
    }
    
    setNewTagInput("");
  };

  // Handle removing tags from the new thread
  const handleRemoveTag = (tagToRemove) => {
    setNewThreadData({
      ...newThreadData,
      conceptTags: newThreadData.conceptTags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Community Discussions</h1>
              <p className="text-blue-100 text-lg max-w-3xl mb-6">
                Connect with peers, ask questions, and participate in discussions about courses, concepts, and learning resources.
              </p>
            </div>
            <Button 
              onClick={() => setIsNewThreadDialogOpen(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <Input 
                placeholder="Search threads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-transparent placeholder:text-blue-200 text-white pl-10"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full sm:w-48 bg-white/10 border-transparent text-white">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threads</SelectItem>
                <SelectItem value="active">Active Threads</SelectItem>
                <SelectItem value="course">Course Threads</SelectItem>
                <SelectItem value="parent">Main Threads</SelectItem>
                <SelectItem value="sub">Sub-Threads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="all" className="text-base py-2 px-4">All Threads</TabsTrigger>
            <TabsTrigger value="my" className="text-base py-2 px-4">My Threads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {renderThreadsList(allThreads, isLoading, errorMessage, filteredThreads)}
          </TabsContent>
          
          <TabsContent value="my" className="mt-0">
            {renderThreadsList(userThreads, isLoading, errorMessage, filteredThreads)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create New Thread Dialog */}
      <Dialog open={isNewThreadDialogOpen} onOpenChange={setIsNewThreadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
            <DialogDescription>
              Start a new discussion thread in the community. Provide details to help others understand the topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="thread-name" className="font-medium text-sm">
                Thread Name
              </label>
              <Input
                id="thread-name"
                value={newThreadData.name}
                onChange={(e) => setNewThreadData({...newThreadData, name: e.target.value})}
                placeholder="Give your thread a descriptive title"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="thread-description" className="font-medium text-sm">
                Description
              </label>
              <Textarea
                id="thread-description"
                value={newThreadData.description}
                onChange={(e) => setNewThreadData({...newThreadData, description: e.target.value})}
                placeholder="Describe what this thread is about"
                rows={4}
              />
            </div>
            
            <div className="grid gap-2">
              <label className="font-medium text-sm">Concept Tags</label>
              <div className="flex gap-2">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Add relevant tags"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              
              {newThreadData.conceptTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newThreadData.conceptTags.map(tag => (
                    <Badge key={tag} className="bg-slate-100 text-slate-800 gap-1 pl-2">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-slate-200"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewThreadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleCreateThread}
              disabled={!newThreadData.name.trim()}
            >
              Create Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function to render the threads list
  function renderThreadsList(sourceThreads, isLoading, errorMessage, filteredThreads) {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, index) => (
            <Card key={index} className="border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                    <Skeleton className="h-4 w-full my-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Failed to load threads</h3>
          <p className="text-slate-600 max-w-md mb-6">
            {errorMessage}
          </p>
          <Button 
            onClick={fetchThreads} 
            variant="outline"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (filteredThreads.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No threads found</h3>
          <p className="text-slate-600 max-w-md mb-6">
            {searchTerm ? `No threads matching "${searchTerm}" were found. Try adjusting your search.` : 
              (activeTab === "my" ? 
                "You haven't joined any threads yet. Browse the 'All Threads' tab to find discussions." : 
                "There are no community threads available right now.")}
          </p>
          {activeTab === "my" ? (
            <Button 
              onClick={() => setActiveTab("all")}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Browse All Threads
            </Button>
          ) : (
            <Button 
              onClick={() => setIsNewThreadDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Thread
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThreads.map(thread => (
          <Link 
            key={thread.id} 
            href={`/threads/${thread.id}`}
            className="block"
          >
            <Card className="border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all h-full">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-full ${
                        thread.active ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 truncate">{thread.name}</h3>
                    </div>
                    <p className="text-slate-600 mb-4 line-clamp-2">{thread.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={thread.active ? 'bg-green-100 text-green-700 border-none' : 'bg-amber-100 text-amber-700 border-none'}>
                        {thread.active ? 'Active' : 'Inactive'}
                      </Badge>
                      
                      {thread.subThreadIds && thread.subThreadIds.length > 0 && (
                        <Badge className="bg-indigo-100 text-indigo-700 border-none gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {thread.subThreadIds.length} Subthreads
                        </Badge>
                      )}
                      
                      {thread.parentThreadId && (
                        <Badge className="bg-purple-100 text-purple-700 border-none">
                          Subthread
                        </Badge>
                      )}
                      
                      {thread.relatedCourseIds && thread.relatedCourseIds.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 border-none gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {thread.relatedCourseIds.length} Course{thread.relatedCourseIds.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>{formatDate(thread.createdAt)}</span>
                      </div>
                      <div className="flex items-center font-medium text-blue-600">
                        <span>View</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  }
}