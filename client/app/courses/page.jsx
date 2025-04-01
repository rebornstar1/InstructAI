"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  ChevronRight, 
  Layers, 
  Clock, 
  Award, 
  ChevronLeft,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Fetch available courses
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8007/api/courses/simplified");
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
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

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={navigateBack} 
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Available Courses</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Explore our library of courses designed to help you master new skills. 
            Each course provides comprehensive content tailored to your learning journey.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="relative max-w-xl mx-auto mb-8">
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-6 w-full"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
                  onClick={() => navigateToCourse(course.id)}
                >
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <CardContent className="p-6 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      {course.title}
                    </h2>
                    <p className="text-gray-600 mb-4 flex-grow">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                        <Award className="h-3.5 w-3.5 mr-1" />
                        {course.difficultyLevel || "Mixed"}
                      </Badge>
                      {course.modules && (
                        <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none">
                          <Layers className="h-3.5 w-3.5 mr-1" />
                          {course.modules.length} modules
                        </Badge>
                      )}
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {course.duration || "Self-paced"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-end text-blue-600 text-sm font-medium">
                      View Course
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="text-center py-12">
            <p className="text-gray-500 mb-4">No courses found matching "{searchTerm}".</p>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Clear Search
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}