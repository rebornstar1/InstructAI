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
import { Brain } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Dashboard() {
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Instruct AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
            Progress
          </Link>
          <Link
            className="text-sm font-medium hover:text-primary transition-colors"
            href="#"
          >
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
            className="max-w-2xl mx-auto space-y-8"
          >
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Interactive AI Learning
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Engage with our AI tutor for a personalized learning experience.
                Select your subject and preferred learning style to get started.
              </p>
            </div>
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="subject"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select a subject
                    </label>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger
                        id="subject"
                        className={`w-full ${
                          showValidationError && !selectedSubject
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Choose a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="science">Science</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="literature">Literature</SelectItem>
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
                  onClick={handleBeginAdventure}
                >
                  Begin Your Learning Adventure
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Instruct AI. All rights reserved.
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
    </div>
  );
}
