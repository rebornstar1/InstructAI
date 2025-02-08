"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CardContent, Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, Book, FileText, Clock, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardComponent() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I'm your AI tutor. What would you like to learn about your selected subject?",
    },
  ]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    setIsFormValid(selectedSubject !== "");
  }, [selectedSubject]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBeginAdventure = (event) => {
    if (!isFormValid) {
      event.preventDefault();
      setShowValidationError(true);
    }
  };

  // Mock data for previous classes
  const previousClasses = [
    { id: 1, name: "Introduction to Algebra", date: "2024-03-01" },
    { id: 2, name: "Basic Geometry", date: "2024-03-05" },
    { id: 3, name: "Trigonometry Fundamentals", date: "2024-03-10" },
  ];

  // Mock data for notes
  const notes = [
    { id: 1, title: "Algebra Formulas", content: "a^2 + b^2 = c^2", date: "2024-03-02" },
    { id: 2, title: "Geometry Shapes", content: "Circle, Square, Triangle", date: "2024-03-06" },
    { id: 3, title: "Trig Functions", content: "sin, cos, tan", date: "2024-03-11" },
  ];

  // Mock data for learning graph
  const learningData = [
    { date: '2024-03-01', minutes: 30 },
    { date: '2024-03-02', minutes: 45 },
    { date: '2024-03-03', minutes: 60 },
    { date: '2024-03-04', minutes: 40 },
    { date: '2024-03-05', minutes: 55 },
    { date: '2024-03-06', minutes: 50 },
    { date: '2024-03-07', minutes: 70 },
  ];

  // Calculate total XP (1 minute = 1 XP)
  const totalXP = learningData.reduce((sum, day) => sum + day.minutes, 0);

  return (
    (<div
      className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header
        className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">AI Tutor</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <div
            className="flex items-center bg-primary text-white px-3 py-1 rounded-full text-sm">
            <Star className="h-4 w-4 mr-1" />
            <span>{totalXP} XP</span>
          </div>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#">
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#">
            Progress
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#">
            Settings
          </Link>
        </nav>
      </header>
      <main className="flex-1 py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Your Learning Dashboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Track your progress, review past classes, and continue your learning journey.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Book className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold">Previous Classes</h2>
                    </div>
                    <ul className="space-y-2">
                      {previousClasses.map((cls) => (
                        <li key={cls.id} className="flex justify-between items-center">
                          <span>{cls.name}</span>
                          <span className="text-sm text-gray-500">{cls.date}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-full">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold">Notes Taken</h2>
                    </div>
                    <ul className="space-y-2">
                      {notes.map((note) => (
                        <li key={note.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{note.title}</span>
                            <span className="text-sm text-gray-500">{note.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{note.content}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold">Learning Time</h2>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={learningData}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="minutes" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Select a subject for your next lesson
                    </label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger
                        id="subject"
                        className={`w-full ${
                          showValidationError && !selectedSubject
                            ? "border-red-500"
                            : ""
                        }`}>
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">Artificial Intelligence</SelectItem>
                        <SelectItem value="science">Machine Learning</SelectItem>
                        <SelectItem value="history">BlockChain</SelectItem>
                        <SelectItem value="literature">Cryptography</SelectItem>
                      </SelectContent>
                    </Select>
                    {showValidationError && !selectedSubject && (
                      <p className="text-sm text-red-500">
                        Please select a subject
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Link href="/startLesson">
                <Button
                  size="lg"
                  className={`rounded-full transition-all duration-300 ${
                    isFormValid
                      ? "bg-primary hover:bg-primary-dark"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                  onClick={handleBeginAdventure}>
                  Begin Your Next Lesson
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <footer
        className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 AI Tutor. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Cookie Policy
          </Link>
        </nav>
      </footer>
    </div>)
  );
}