"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Loader2 } from "lucide-react";

export default function CourseCreationComponent({
  rawCourses,
  setGeneratedCourse,
  setActiveTab,
  messages,
  setMessages,
}) {
  const [coursePrompt, setCoursePrompt] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFormValid(coursePrompt.trim() !== "");
  }, [coursePrompt]);

  const handleSelectRawCourse = async (rawCourse) => {
    setCoursePrompt(rawCourse.title);
    await handleGenerateCourse({ preventDefault: () => {} });
  };

  const handleGenerateCourse = async (event) => {
    event.preventDefault();
    if (!isFormValid) {
      setShowValidationError(true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8007/api/courses/simplified/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: coursePrompt,
          difficultyLevel: "Intermediate",
          moduleCount: 4,
        }),
      });
      const data = await response.json();
      console.log("Generated Course Structure:", data);
      setGeneratedCourse(data);
      setActiveTab("course");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: `I've generated a course structure for "${coursePrompt}". Check out the Course Content tab.`,
        },
      ]);
    } catch (error) {
      console.error("Error generating course:", error);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Generate a course about: ${coursePrompt}` },
        {
          role: "ai",
          content: "There was an error generating your course. Please try a different topic.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome!</h1>
        <p className="text-gray-500">Generate a new course on any topic you'd like to learn about.</p>
      </div>

      {/* Suggested Courses Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Suggested Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rawCourses.map((course, idx) => (
            <Card
              key={idx}
              className="cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => handleSelectRawCourse(course)}
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold">{course.title}</h3>
                <p className="text-gray-600 mt-2">{course.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generate New Course Section */}
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-4">
            <label htmlFor="coursePrompt" className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Generate a New Course
            </label>
            <p className="text-gray-500 text-sm">
              Enter a topic to generate a personalized course structure.
            </p>
            <Input
              id="coursePrompt"
              placeholder="e.g., Machine Learning, Web Development, Blockchain"
              value={coursePrompt}
              onChange={(e) => setCoursePrompt(e.target.value)}
              className={`w-full text-lg py-6 ${
                showValidationError && !coursePrompt.trim() ? "border-red-500" : ""
              }`}
            />
            {showValidationError && !coursePrompt.trim() && (
              <p className="text-sm text-red-500">Please enter a topic for your course</p>
            )}
            <Button onClick={handleGenerateCourse} disabled={isLoading} className="w-full mt-4 py-6 rounded-lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Your Course...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Generate Course Structure
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
