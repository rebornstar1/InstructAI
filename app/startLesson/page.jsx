"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

const sections = [
  { title: "Introduction to AI" },
  { title: "Machine Learning Basics" },
  { title: "Neural Networks" },
  { title: "Deep Learning" },
  { title: "Natural Language Processing" },
  { title: "Computer Vision" },
  { title: "Reinforcement Learning" },
  { title: "AI Ethics and Future" },
];

function LessonContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [currentLesson, setCurrentLesson] = useState(0);

  useEffect(() => {
    const index = searchParams.get("index");
    if (index !== null) {
      setCurrentLesson(parseInt(index));
    }
  }, [searchParams]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {sections.map((section, id) => (
        <div
          key={id}
          className={cn(
            "p-6 rounded-lg transition-colors flex flex-col justify-between",
            id === currentLesson
              ? "bg-primary text-primary-foreground"
              : id < currentLesson
              ? "bg-green-100 dark:bg-green-900"
              : "bg-secondary",
            id > currentLesson && "opacity-50 cursor-not-allowed"
          )}
          style={{ minHeight: "180px" }}
        >
          <div>
            <h3 className="text-lg font-semibold mb-2">{`Lesson ${id + 1}`}</h3>
            <h4 className="text-xl font-bold mb-4">{section.title}</h4>
          </div>
          {id === currentLesson && (
            <Link
              href={{
                pathname: `/startLesson/${id}`,
                query: {
                  lessonId: currentLesson,
                  index: currentLesson,
                },
              }}
            >
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Start
              </Button>
            </Link>
          )}
          {id < currentLesson && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="mr-2" />
              Completed
            </div>
          )}
          {id > currentLesson && (
            <div className="flex items-center">
              <Lock className="mr-2" />
              Locked
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function StartLesson({ subject }) {
  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Header />
      <main className="py-12">
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30" />
        <div className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-auto w-[75vw] h-[75vh]">
          <h2 className="text-2xl font-bold mb-4">Lessons to be Learned</h2>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LessonContent />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
}