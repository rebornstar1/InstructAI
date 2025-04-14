"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Layers, 
  AlertCircle, 
  CheckCircle,
  UserPlus,
  UserMinus,
  Tag,
  ArrowLeft,
  UserCheck,
  Settings,
  RefreshCcw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export default function ThreadManagementDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState("threads");
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadUsers, setThreadUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddThreadDialogOpen, setIsAddThreadDialogOpen] = useState(false);
  const [isEditThreadDialogOpen, setIsEditThreadDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [newThread, setNewThread] = useState({
    name: "",
    description: "",
    parentThreadId: null,
    active: true,
    relatedCourseIds: []
  });
  
  const router = useRouter();

  // Fetch threads on component mount
  useEffect(() => {
    fetchThreads();
    fetchUsers();
    fetchCourses();
  }, []);

  // Fetch main threads from API
  const fetchThreads = async () => {
    setIsLoading(true);
    setShowError(false);
    
    try {
      const response = await fetch(`${API_URL}/api/threads/main`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setThreads(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setShowError(true);
      setIsLoading(false);
    }
  };

  // Fetch available users for adding to threads
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch available courses for adding to threads
  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courses/simplified`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableCourses(data);
      console.log("availableCourses", data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  // Fetch users for a specific thread
  const fetchThreadUsers = async (threadId) => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${threadId}/users`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setThreadUsers(data);
    } catch (error) {
      console.error(`Error fetching users for thread ${threadId}:`, error);
    }
  };

  // Handle thread selection
  const handleSelectThread = async (thread) => {
    setSelectedThread(thread);
    await fetchThreadUsers(thread.id);
  };

  const handleOpenAddCourseDialog = () => {
    console.log("Available courses:", availableCourses);
    console.log("Selected thread courses:", selectedThread?.relatedCourseIds);
    setIsAddCourseDialogOpen(true);
  };

  // Create new thread
  const handleCreateThread = async () => {
    console.log("Create thread function called with data:", newThread);
    
    if (!newThread.name) {
      console.error("Thread name is required");
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/threads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newThread),
      });
      
      const responseData = await response.text();
      console.log("Response:", responseData);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}, message: ${responseData}`);
      }
      
      // Refresh thread list
      fetchThreads();
      setIsAddThreadDialogOpen(false);
      // Reset form
      setNewThread({
        name: "",
        description: "",
        parentThreadId: null,
        active: true,
        relatedCourseIds: []
      });
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  // Update existing thread
  const handleUpdateThread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${selectedThread.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newThread),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Refresh thread list
      fetchThreads();
      setIsEditThreadDialogOpen(false);
    } catch (error) {
      console.error("Error updating thread:", error);
    }
  };

  // Delete thread
  const handleDeleteThread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${selectedThread.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Refresh thread list
      fetchThreads();
      setIsDeleteConfirmOpen(false);
      setSelectedThread(null);
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  // Add user to thread
  const handleAddUserToThread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${selectedThread.id}/users/${selectedUserId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Refresh thread users
      fetchThreadUsers(selectedThread.id);
      setIsAddUserDialogOpen(false);
      setSelectedUserId("");
    } catch (error) {
      console.error("Error adding user to thread:", error);
    }
  };

  // Remove user from thread
  const handleRemoveUserFromThread = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${selectedThread.id}/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Refresh thread users
      fetchThreadUsers(selectedThread.id);
    } catch (error) {
      console.error("Error removing user from thread:", error);
    }
  };

  // Add course to thread
  const handleAddCourseToThread = async () => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${selectedThread.id}/courses/${selectedCourseId}`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Refresh thread list to update course relationships
      fetchThreads();
      setIsAddCourseDialogOpen(false);
      setSelectedCourseId("");
    } catch (error) {
      console.error("Error adding course to thread:", error);
    }
  };

  // Remove course from thread
  const handleRemoveCourseFromThread = async (courseId) => {
    try {
      const response = await fetch(`${API_URL}/api/threads/${selectedThread.id}/courses/${courseId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      // Refresh thread list to update course relationships
      fetchThreads();
    } catch (error) {
      console.error("Error removing course from thread:", error);
    }
  };

  // Filter threads based on search term
  const filteredThreads = threads.filter(thread => 
    thread.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Start editing a thread
  const startEditThread = (thread) => {
    setNewThread({
      name: thread.name,
      description: thread.description,
      parentThreadId: thread.parentThreadId,
      active: thread.active,
      relatedCourseIds: thread.relatedCourseIds || []
    });
    setIsEditThreadDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  console.log("available Courses",availableCourses);

  // Render thread list items
  const renderThreadItems = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, index) => (
        <div key={index} className="mb-4">
          <Card className="border border-slate-200">
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
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      ));
    }

    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Failed to load threads</h3>
          <p className="text-slate-600 max-w-md mb-6">
            There was an error loading the community threads. Please check your connection and try again.
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
            {searchTerm 
              ? `No threads matching "${searchTerm}" were found. Try adjusting your search.` 
              : "There are no community threads created yet. Create your first thread to get started."}
          </p>
          <Button 
            onClick={() => setIsAddThreadDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Thread
          </Button>
        </div>
      );
    }

    return filteredThreads.map(thread => (
      <div key={thread.id} className="mb-4">
        <Card 
          className={`border hover:border-blue-200 hover:shadow-md transition-all cursor-pointer ${
            selectedThread?.id === thread.id ? 'border-blue-400 shadow-md bg-blue-50' : 'border-slate-200'
          }`}
          onClick={() => handleSelectThread(thread)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-full ${
                    thread.active ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{thread.name}</h3>
                  <Badge className={thread.active ? 'bg-green-100 text-green-700 border-none' : 'bg-amber-100 text-amber-700 border-none'}>
                    {thread.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-slate-600 mb-4 line-clamp-2">{thread.description}</p>
                <div className="flex flex-wrap gap-2">
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
                  {thread.relatedCourseIds && (
                    <Badge className="bg-blue-100 text-blue-700 border-none gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {thread.relatedCourseIds.length} Courses
                    </Badge>
                  )}
                  <Badge className="bg-slate-100 text-slate-700 border-none">
                    Created: {formatDate(thread.createdAt)}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-500 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditThread(thread);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-500 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedThread(thread);
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER */}
      <nav className="fixed w-full z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-8 w-8 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-6 w-6 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-sm -rotate-12">A</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight text-slate-800">
                  Instruct<span className="text-blue-600">AI</span>
                </span>
              </div>
            </Link>
            
            {/* Admin label */}
            <div className="flex items-center gap-4">
              <Badge className="bg-indigo-100 text-indigo-800 py-1 px-2">Admin Dashboard</Badge>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-600 gap-2 hover:text-blue-600"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Platform
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="pt-24 pb-16 px-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sidebar */}
          <div className="w-full sm:w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4 sticky top-20">
              <div className="font-semibold text-slate-600 mb-4">Admin Tools</div>
              <div className="space-y-1">
                <Button 
                  variant={activeTab === "threads" ? "default" : "ghost"} 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("threads")}
                >
                  <MessageSquare className="h-4 w-4" />
                  Thread Management
                </Button>
                <Button 
                  variant={activeTab === "users" ? "default" : "ghost"} 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("users")}
                >
                  <Users className="h-4 w-4" />
                  User Management
                </Button>
                <Button 
                  variant={activeTab === "courses" ? "default" : "ghost"} 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("courses")}
                >
                  <BookOpen className="h-4 w-4" />
                  Course Management
                </Button>
                <Button 
                  variant={activeTab === "settings" ? "default" : "ghost"} 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">Thread Management</h1>
                  <p className="text-slate-600">Manage community discussion threads and user memberships</p>
                </div>
                <Button 
                  onClick={() => setIsAddThreadDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Thread
                </Button>
              </div>

              <TabsContent value="threads" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Thread List */}
                  <div className="md:col-span-1">
                    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
                      <div className="flex items-center mb-4">
                        <Search className="h-4 w-4 text-slate-400 mr-2" />
                        <Input
                          placeholder="Search threads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-2">
                        {renderThreadItems()}
                      </div>
                    </div>
                  </div>

                  {/* Thread Details */}
                  <div className="md:col-span-2">
                    {selectedThread ? (
                      <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedThread.name}</h2>
                            <p className="text-slate-600">{selectedThread.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-slate-200 gap-1 text-slate-600 hover:text-blue-600"
                              onClick={() => startEditThread(selectedThread)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-slate-200 gap-1 text-red-600 hover:bg-red-50"
                              onClick={() => setIsDeleteConfirmOpen(true)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h3 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              Thread Details
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Status:</span>
                                <Badge className={selectedThread.active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                  {selectedThread.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Created:</span>
                                <span className="text-slate-800">{formatDate(selectedThread.createdAt)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Thread ID:</span>
                                <span className="text-slate-800">{selectedThread.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Parent Thread:</span>
                                <span className="text-slate-800">
                                  {selectedThread.parentThreadId ? `#${selectedThread.parentThreadId}` : 'None (Main Thread)'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Subthreads:</span>
                                <span className="text-slate-800">
                                  {selectedThread.subThreadIds?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-600" />
                                Related Courses
                              </h3>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setIsAddCourseDialogOpen(true)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {selectedThread.relatedCourseIds?.length > 0 ? (
                              <div className="space-y-1">
                                {selectedThread.relatedCourseIds.map(courseId => {
                                  const course = availableCourses.find(c => c.id === courseId);
                                  return (
                                    <div key={courseId} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-sm">
                                      <span className="text-slate-800 font-medium">
                                        {course ? course.title : `Course #${courseId}`}
                                      </span>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-600"
                                        onClick={() => handleRemoveCourseFromThread(courseId)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-sm text-slate-500">
                                No courses associated with this thread yet
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Thread Members */}
                        <div className="mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-slate-800 flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              Thread Members
                            </h3>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-slate-200 gap-1 hover:text-blue-600"
                              onClick={() => setIsAddUserDialogOpen(true)}
                            >
                              <UserPlus className="h-4 w-4" />
                              Add Member
                            </Button>
                          </div>
                          
                          {threadUsers.length > 0 ? (
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {threadUsers.map(user => (
                                    <TableRow key={user.id}>
                                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                                      <TableCell className="font-medium">{user.username}</TableCell>
                                      <TableCell>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                                          onClick={() => handleRemoveUserFromThread(user.id)}
                                        >
                                          <UserMinus className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                              <UserCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500 mb-2">No members in this thread yet</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-slate-200 gap-1 hover:text-blue-600"
                                onClick={() => setIsAddUserDialogOpen(true)}
                              >
                                <UserPlus className="h-4 w-4" />
                                Add First Member
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Thread Details</h3>
                        <p className="text-slate-600 mb-6">
                          Select a thread from the list to view details, manage members, and related courses.
                        </p>
                        <Button 
                          onClick={() => setIsAddThreadDialogOpen(true)}
                          variant="outline"
                          className="border-slate-200 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create New Thread
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                  <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">User Management</h3>
                  <p className="text-slate-600">
                    This section will allow you to manage users and their permissions.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="courses" className="mt-0">
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Course Management</h3>
                  <p className="text-slate-600">
                    This section will allow you to manage courses and their relationships with threads.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                  <Settings className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Settings</h3>
                  <p className="text-slate-600">
                    Configure platform settings and thread-related configurations.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modal: Add Thread */}
      <Dialog open={isAddThreadDialogOpen} onOpenChange={setIsAddThreadDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Thread</DialogTitle>
            <DialogDescription>
              Create a new discussion thread for your community.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right font-medium text-sm">
                Name
              </label>
              <Input
                id="name"
                value={newThread.name}
                onChange={(e) => setNewThread({...newThread, name: e.target.value})}
                className="col-span-3"
                placeholder="Thread name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right font-medium text-sm">
                Description
              </label>
              <Input
                id="description"
                value={newThread.description}
                onChange={(e) => setNewThread({...newThread, description: e.target.value})}
                className="col-span-3"
                placeholder="Thread description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="parent" className="text-right font-medium text-sm">
                Parent Thread
              </label>
              <Select
                value={newThread.parentThreadId ? String(newThread.parentThreadId) : undefined}
                onValueChange={(value) => setNewThread({
                  ...newThread, 
                  parentThreadId: value ? parseInt(value) : null
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select parent thread (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Thread">None (Main Thread)</SelectItem>
                  {threads.map(thread => (
                    <SelectItem key={thread.id} value={String(thread.id)}>
                      {thread.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-sm">
                Status
              </label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={newThread.active}
                  onChange={(e) => setNewThread({...newThread, active: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <label htmlFor="active" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddThreadDialogOpen(false)}>
                Cancel
            </Button>
            <Button 
                type="button"
                onClick={() => {
                console.log("Create button clicked");
                handleCreateThread();
                }}
            >
                Create Thread
            </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Thread */}
      <Dialog open={isEditThreadDialogOpen} onOpenChange={setIsEditThreadDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Thread</DialogTitle>
            <DialogDescription>
              Update thread information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-name" className="text-right font-medium text-sm">
                Name
              </label>
              <Input
                id="edit-name"
                value={newThread.name}
                onChange={(e) => setNewThread({...newThread, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-description" className="text-right font-medium text-sm">
                Description
              </label>
              <Input
                id="edit-description"
                value={newThread.description}
                onChange={(e) => setNewThread({...newThread, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-parent" className="text-right font-medium text-sm">
                Parent Thread
              </label>
              <Select
                value={newThread.parentThreadId ? String(newThread.parentThreadId) : undefined}
                onValueChange={(value) => setNewThread({
                  ...newThread, 
                  parentThreadId: value ? parseInt(value) : null
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select parent thread (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Thread">None (Main Thread)</SelectItem>
                  {threads
                    .filter(thread => thread.id !== selectedThread?.id)
                    .map(thread => (
                      <SelectItem key={thread.id} value={String(thread.id)}>
                        {thread.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-sm">
                Status
              </label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={newThread.active}
                  onChange={(e) => setNewThread({...newThread, active: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <label htmlFor="edit-active" className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditThreadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateThread}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-100 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-red-800">Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Deleting this thread will remove all member associations. Any subthreads will be reassigned as main threads or moved to the parent thread.
                  </p>
                </div>
              </div>
            </div>
            {selectedThread && (
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                <p className="font-medium text-slate-800">{selectedThread.name}</p>
                <p className="text-sm text-slate-600 mt-1">{selectedThread.description}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteThread}>
              Delete Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add User to Thread */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Member to Thread</DialogTitle>
            <DialogDescription>
              Add a user to this thread discussion.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedUserId ? String(selectedUserId) : undefined}
              onValueChange={(value) => {
                if (value) setSelectedUserId(parseInt(value));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter(user => !threadUsers.some(threadUser => threadUser.id === user.id))
                  .map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.username}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUserToThread}
              disabled={!selectedUserId}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Course to Thread */}
      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Course to Thread</DialogTitle>
            <DialogDescription>
              Associate a course with this thread.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedCourseId ? String(selectedCourseId) : undefined}
              onValueChange={(value) => {
                if (value) setSelectedCourseId(parseInt(value));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent className="text-gray-800">
                {availableCourses
                  .filter(course => !selectedThread?.relatedCourseIds?.includes(course.id))
                  .map(course => (
                    <SelectItem key={course.id} value={String(course.id)} className="text-gray-800">
                      {course.title}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCourseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCourseToThread}
              disabled={!selectedCourseId}
            >
              Add Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}