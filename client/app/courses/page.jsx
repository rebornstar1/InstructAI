"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  ChevronRight, 
  Layers, 
  Clock, 
  Award, 
  ChevronLeft,
  Search,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  Tag,
  Users,
  CheckCircle,
  Info,
  AlertCircle
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("newest");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch available courses
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8007/api/courses/simplified");
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setCourses(data);
        setShowEmptyState(data.length === 0);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const navigateToCourse = (courseId) => {
    router.push(`/courses/${courseId}`);
  };

  const navigateBack = () => {
    router.push("/");
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  const handleDifficultyChange = (value) => {
    setSelectedDifficulty(value);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setShowError(false);
    fetchCourses();
  };

  // Sort and filter the courses
  let processedCourses = [...courses];

  // Apply difficulty filter
  if (selectedDifficulty !== "all") {
    processedCourses = processedCourses.filter(course => {
      const difficultyLevel = course.courseMetadata?.difficultyLevel?.toLowerCase() || "";
      return difficultyLevel.includes(selectedDifficulty.toLowerCase());
    });
  }

  // Apply sorting
  if (sortBy === "newest") {
    // For demo, just reverse the array as a proxy for "newest first"
    processedCourses = [...processedCourses].reverse();
  } else if (sortBy === "a-z") {
    processedCourses.sort((a, b) => {
      const titleA = a.courseMetadata?.title?.toLowerCase() || "";
      const titleB = b.courseMetadata?.title?.toLowerCase() || "";
      return titleA.localeCompare(titleB);
    });
  } else if (sortBy === "z-a") {
    processedCourses.sort((a, b) => {
      const titleA = a.courseMetadata?.title?.toLowerCase() || "";
      const titleB = b.courseMetadata?.title?.toLowerCase() || "";
      return titleB.localeCompare(titleA);
    });
  } else if (sortBy === "most-modules") {
    processedCourses.sort((a, b) => {
      const modulesA = a.modules?.length || 0;
      const modulesB = b.modules?.length || 0;
      return modulesB - modulesA;
    });
  }

  // Apply search filter
  const filteredCourses = processedCourses.filter(course => {
    const title = course.courseMetadata?.title?.toLowerCase() || "";
    const description = course.courseMetadata?.description?.toLowerCase() || "";
    return title.includes(searchTerm.toLowerCase()) || 
           description.includes(searchTerm.toLowerCase());
  });

  // Calculate total duration for a course based on its modules
  const calculateTotalDuration = (modules) => {
    if (!modules || modules.length === 0) return "Self-paced";
    
    // Sum the durations if they're in a standard format like "1.5 hours" or "30 minutes"
    let totalMinutes = 0;
    
    modules.forEach(module => {
      const duration = module.duration || "";
      
      // Extract hours
      const hoursMatch = duration.match(/(\d+(\.\d+)?)\s*hour/i);
      if (hoursMatch) {
        totalMinutes += parseFloat(hoursMatch[1]) * 60;
      }
      
      // Extract minutes
      const minutesMatch = duration.match(/(\d+)\s*minute/i);
      if (minutesMatch) {
        totalMinutes += parseInt(minutesMatch[1]);
      }
    });
    
    if (totalMinutes === 0) return "Self-paced";
    
    // Convert back to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${minutes} minutes`;
  };

  // Extract unique difficulty levels for filtering
  const getDifficultyLevels = () => {
    const levels = courses.map(course => course.courseMetadata?.difficultyLevel?.trim()).filter(Boolean);
    return ["all", ...new Set(levels)];
  };

  // Count courses by difficulty level for stats
  const getCoursesByDifficulty = () => {
    const counts = {};
    courses.forEach(course => {
      const difficulty = course.courseMetadata?.difficultyLevel || "Unknown";
      counts[difficulty] = (counts[difficulty] || 0) + 1;
    });
    return counts;
  };

  // Get total course count
  const getTotalCourseCount = () => courses.length;

  // Get total module count across all courses
  const getTotalModuleCount = () => {
    return courses.reduce((sum, course) => sum + (course.modules?.length || 0), 0);
  };

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
        <Card className="overflow-hidden h-full">
          <div className="h-2 bg-gray-200 dark:bg-gray-700"></div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={navigateBack} 
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 px-3 py-1.5"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <span>Portal v1.2.0</span>
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">Documentation</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Request Support</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Keyboard Shortcuts</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Course Library
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Explore our comprehensive collection of courses designed to help you master new skills. 
            Each course provides in-depth content tailored to your learning journey.
          </p>
          
          {/* Stats Overview */}
          {!isLoading && !showError && courses.length > 0 && (
            <motion.div 
              variants={itemVariants} 
              className="flex flex-wrap justify-center gap-4 mt-6"
            >
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 flex items-center gap-2 text-blue-700">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">{getTotalCourseCount()} Courses</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 flex items-center gap-2 text-indigo-700">
                <Layers className="h-4 w-4" />
                <span className="font-medium">{getTotalModuleCount()} Modules</span>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-2 flex items-center gap-2 text-purple-700">
                <Award className="h-4 w-4" />
                <span className="font-medium">Multiple Difficulty Levels</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 max-w-2xl mx-auto md:mx-0">
            <Input
              type="text"
              placeholder="Search courses by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 w-full border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            
            {searchTerm && (
              <Button 
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
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
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <Button 
                      variant="ghost" 
                      className={`h-10 px-3 rounded-none ${viewMode === 'grid' ? 'bg-blue-50 text-blue-700' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className={`h-10 px-3 rounded-none ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : ''}`}
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
                <SelectTrigger className="w-[180px] h-10 border-gray-200">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="a-z">Title (A-Z)</SelectItem>
                  <SelectItem value="z-a">Title (Z-A)</SelectItem>
                  <SelectItem value="most-modules">Most Modules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedDifficulty} onValueChange={handleDifficultyChange}>
                <SelectTrigger className="w-[180px] h-10 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Filter by difficulty" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {getDifficultyLevels().filter(level => level !== "all").map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h3>
            <p className="text-gray-500 max-w-md mb-6">
              We couldn't load the courses at this time. Please check your connection and try again.
            </p>
            <Button onClick={handleRetry} className="gap-2">
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No courses available</h3>
            <p className="text-gray-500 max-w-md mb-6">
              There are no courses available in the library yet. Check back later or create a new course.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Create a Course
            </Button>
          </motion.div>
        )}

        {/* Search Results - No matches */}
        {!isLoading && !showError && !showEmptyState && filteredCourses.length === 0 && (
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No matching courses</h3>
            <p className="text-gray-500 max-w-md mb-6">
              No courses found matching "{searchTerm}". Try adjusting your search or filters.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => setSearchTerm("")} variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Clear Search
              </Button>
              <Button onClick={() => {setSelectedDifficulty("all"); setSortBy("newest");}} variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </motion.div>
        )}

        {/* Grid View */}
        {!isLoading && !showError && filteredCourses.length > 0 && viewMode === "grid" && (
          <>
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-4"
            >
              <div className="text-sm text-gray-500">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
              
              {(searchTerm || selectedDifficulty !== "all") && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDifficulty("all");
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 h-full border-gray-200 hover:border-blue-300"
                      onClick={() => navigateToCourse(course.id)}
                    >
                      <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-blue-100 p-1.5 rounded-full">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-800 line-clamp-1">
                            {course.courseMetadata?.title || "Untitled Course"}
                          </h2>
                        </div>
                        
                        <p className="text-gray-600 mb-5 flex-grow line-clamp-3">
                          {course.courseMetadata?.description || "No description available."}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                            <Award className="h-3.5 w-3.5 mr-1" />
                            {course.courseMetadata?.difficultyLevel || "Mixed"}
                          </Badge>
                          {course.modules && (
                            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none">
                              <Layers className="h-3.5 w-3.5 mr-1" />
                              {course.modules.length} modules
                            </Badge>
                          )}
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {calculateTotalDuration(course.modules)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-500">ID: {course.courseUuid?.substring(0, 8)}</span>
                          <div className="flex items-center text-blue-600 text-sm font-medium">
                            View Course
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* List View */}
        {!isLoading && !showError && filteredCourses.length > 0 && viewMode === "list" && (
          <>
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between mb-4"
            >
              <div className="text-sm text-gray-500">
                Showing {filteredCourses.length} of {courses.length} courses
              </div>
              
              {(searchTerm || selectedDifficulty !== "all") && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDifficulty("all");
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          
            <motion.div 
              variants={itemVariants}
              className="space-y-4"
            >
              <AnimatePresence>
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 border-gray-200 hover:border-blue-300"
                      onClick={() => navigateToCourse(course.id)}
                    >
                      <div className="flex h-full">
                        <div className="w-2 bg-gradient-to-b from-blue-600 to-indigo-600"></div>
                        <CardContent className="p-5 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="bg-blue-100 p-1.5 rounded-full">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">
                                  {course.courseMetadata?.title || "Untitled Course"}
                                </h2>
                                {course.courseMetadata?.difficultyLevel && (
                                  <Badge className="bg-blue-100 text-blue-800 border-none">
                                    {course.courseMetadata.difficultyLevel}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-gray-600 line-clamp-2 md:pr-4">
                                {course.courseMetadata?.description || "No description available."}
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Layers className="h-4 w-4 mr-1" />
                                  <span>{course.modules?.length || 0} modules</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{calculateTotalDuration(course.modules)}</span>
                                </div>
                              </div>
                              
                              <div className="text-blue-600 text-sm font-medium flex items-center whitespace-nowrap">
                                View Course
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
          </>
        )}

        {/* Pagination (placeholder) */}
        {!isLoading && !showError && filteredCourses.length > 9 && (
          <motion.div 
            variants={itemVariants}
            className="flex justify-center mt-8"
          >
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-blue-50 text-blue-700 border-blue-200">
                  1
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  2
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  3
                </Button>
                <span className="mx-1">...</span>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  10
                </Button>
              </div>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500"
        >
          <p>© {new Date().getFullYear()} Course Learning Portal. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}