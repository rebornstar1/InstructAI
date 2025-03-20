"use client"

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Brain, CheckCircle, X ,Star} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const totalXP= "350";

const lessonData = [
  {
    name: "Introduction to AI",
    explanation:
      "Artificial Intelligence (AI) is a field of computer science aimed at creating systems that can perform tasks that typically require human intelligence. These tasks include learning from experience, solving problems, understanding language, and recognizing patterns. AI can be categorized into different types, such as Narrow AI, which is designed for specific tasks like voice assistants or translation tools, and General AI, which is a theoretical form of AI capable of performing any intellectual task that a human can do. Superintelligent AI, which would surpass human intelligence, is also a concept discussed in the field but remains theoretical.\n Within AI, machine learning plays a crucial role. Machine learning allows systems to learn and improve from data without being explicitly programmed for specific tasks. Deep learning, a subset of machine learning, involves using artificial neural networks with many layers to process large amounts of data, mimicking the way the human brain works. Other key areas of AI include natural language processing, which enables machines to understand and generate human language, and computer vision, which allows systems to interpret visual data.",
    quiz: [
      {
        question: "What does AI stand for?",
        options: [
          "Artificial Intelligence",
          "Automated Integration",
          "Advanced Iteration",
          "Algorithmic Inference",
        ],
        correctAnswer: 0,
        explanation:
          "AI stands for Artificial Intelligence, which refers to the simulation of human intelligence in machines.",
      },
      {
        question: "Which of the following is NOT a type of machine learning?",
        options: [
          "Supervised Learning",
          "Unsupervised Learning",
          "Reinforcement Learning",
          "Cognitive Learning",
        ],
        correctAnswer: 3,
        explanation:
          "Cognitive Learning is not a type of machine learning. The main types are Supervised, Unsupervised, and Reinforcement Learning.",
      },
      {
        question: "What is the primary goal of deep learning?",
        options: [
          "Data visualization",
          "Feature extraction",
          "Pattern recognition",
          "Data storage",
        ],
        correctAnswer: 2,
        explanation:
          "The primary goal of deep learning is pattern recognition. It aims to mimic the human brain's ability to recognize complex patterns in data.",
      },
      {
        question:
          "Which AI technique is based on the structure and function of biological neural networks?",
        options: [
          "Expert Systems",
          "Fuzzy Logic",
          "Genetic Algorithms",
          "Artificial Neural Networks",
        ],
        correctAnswer: 3,
        explanation:
          "Artificial Neural Networks are inspired by and based on the structure and function of biological neural networks in the human brain.",
      },
    ],
  },
  {
    name: "Introduction to Machine Learning",
    explanation:
      "Machine Learning (ML) is a subset of artificial intelligence focused on developing algorithms and statistical models that allow computers to learn from and make predictions based on data. Instead of being explicitly programmed for specific tasks, ML systems improve their performance as they are exposed to more data. ML is divided into several categories, including supervised learning, where models are trained on labeled datasets, and unsupervised learning, which deals with unlabeled data to find hidden patterns. Reinforcement learning involves training models to make decisions through rewards and penalties, resembling a trial-and-error approach. The applications of machine learning are vast, ranging from healthcare and finance to e-commerce and autonomous systems. However, challenges such as data privacy, algorithmic bias, and the need for model interpretability remain critical considerations in the field.",
    quiz: [
      {
        question: "What is the main goal of machine learning?",
        options: [
          "To perform tasks without human intervention",
          "To manually code every possible decision",
          "To learn and improve from data",
          "To store large amounts of data",
        ],
        correctAnswer: 2,
        explanation:
          "The main goal of machine learning is to learn and improve from data, enabling systems to make predictions or decisions based on that data.",
      },
      {
        question: "Which type of machine learning uses labeled data?",
        options: [
          "Unsupervised Learning",
          "Reinforcement Learning",
          "Supervised Learning",
          "Deep Learning",
        ],
        correctAnswer: 2,
        explanation:
          "Supervised Learning uses labeled data, allowing models to learn from input-output pairs to make predictions.",
      },
      {
        question: "What is a common application of reinforcement learning?",
        options: [
          "Image classification",
          "Spam detection",
          "Game playing",
          "Sentiment analysis",
        ],
        correctAnswer: 2,
        explanation:
          "Reinforcement learning is commonly used in game playing, where agents learn strategies by receiving rewards or penalties for their actions.",
      },
      {
        question: "Which of the following is NOT a type of machine learning?",
        options: [
          "Unsupervised Learning",
          "Supervised Learning",
          "Deep Learning",
          "Traditional Learning",
        ],
        correctAnswer: 3,
        explanation:
          "Traditional Learning is not recognized as a type of machine learning. The main types include Supervised, Unsupervised, and Reinforcement Learning.",
      },
    ],
  },
];

const TypingAnimation = ({ text }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
  
    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, 20); // Adjust the typing speed here
  
        return () => clearTimeout(timeout);
      }
    }, [currentIndex, text]);
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {displayedText}
      </motion.div>
    );
  };

export default function StartLesson() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const params = useParams();
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const id = params.id;
    const lessonId = searchParams.get("lessonId");
    const index = searchParams.get("index");

    setData({
      index: index,
      lessonId: lessonId,
      title: `Lesson ${lessonId}`,
    });

    setTimeout(() => {
        setIsLoading(false);
      }, 1500);
  }, [params.id, searchParams]);

  if (!data) {
    return <div>Loading...</div>;
  }
  const handleStartQuiz = () => {
    setShowQuiz(true);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (!isAnswered) {
      setSelectedAnswer(answerIndex);
      setIsAnswered(true);
      if (
        answerIndex === lessonData[data.index].quiz[currentQuestion].correctAnswer
      ) {
        setScore((prevScore) => prevScore + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < lessonData[data.index].quiz.length - 1) {
      setCurrentQuestion((prevQuestion) => prevQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
      setShowQuiz(false);
    }
  };

  const handleLearnVideo = () => {
    console.log("Learn with video");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header
        className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-gray-800 shadow-sm">
        <Link className="flex items-center justify-center" href="#">
          <Brain className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Instruct AI</span>
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
      <main className="flex-1 py-12 px-8">
        <h1 className="text-3xl font-bold mb-6">{lessonData[data.index].name}</h1>
        <Card className="mb-8">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <motion.div
                  className="w-4 h-4 bg-blue-500 rounded-full"
                  animate={{
                    scale: [1, 2, 2, 1, 1],
                    rotate: [0, 0, 270, 270, 0],
                    borderRadius: ["20%", "20%", "50%", "50%", "20%"],
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.5, 0.8, 1],
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              </div>
            ) : (
              <TypingAnimation text={lessonData[data.index].explanation} />
            )}
          </CardContent>
        </Card>
        {!quizCompleted ? (
          <Button onClick={handleStartQuiz}>Test Your Knowledge</Button>
        ) : (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Quiz Results</h2>
              <p className="text-lg mb-4">
                You scored {score} out of {lessonData[data.index].quiz.length}{" "}
                questions correctly.
              </p>
              {score >= 3 ? (
                <Link
                  href={{
                    pathname: `/startLesson`,
                    query: {
                      index: parseInt(data.index) + 1,
                    },
                  }}
                >
                  <Button
                    onClick={() => console.log("Navigate to next lesson")}
                  >
                    Next Lesson
                  </Button>
                </Link>
              ) : (
                <Link href={"/learn"}>
                  <Button
                    onClick={() =>
                      quizCompleted ? handleLearnVideo() : handleStartQuiz()
                    }
                  >
                    Learn With Video
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
        <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Question {currentQuestion + 1} of{" "}
                {lessonData[data.index].quiz.length}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-lg mb-4">
                {lessonData[data.index].quiz[currentQuestion].question}
              </p>
              <RadioGroup className="space-y-4">
                {lessonData[data.index].quiz[currentQuestion].options.map(
                  (option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                        disabled={isAnswered}
                        onClick={() => handleAnswerSelect(index)}
                        className={cn(
                          isAnswered &&
                            index ===
                              lessonData[data.index].quiz[currentQuestion]
                                .correctAnswer &&
                            "bg-green-500",
                          isAnswered &&
                            selectedAnswer === index &&
                            index !==
                              lessonData[data.index].quiz[currentQuestion]
                                .correctAnswer &&
                            "bg-red-500"
                        )}
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className={cn(
                          "text-lg",
                          isAnswered &&
                            index ===
                              lessonData[data.index].quiz[currentQuestion]
                                .correctAnswer &&
                            "text-green-500 font-bold",
                          isAnswered &&
                            selectedAnswer === index &&
                            index !==
                              lessonData[data.index].quiz[currentQuestion]
                                .correctAnswer &&
                            "text-red-500 font-bold"
                        )}
                      >
                        {option}
                      </Label>
                      {isAnswered &&
                        (index ===
                        lessonData[data.index].quiz[currentQuestion]
                          .correctAnswer ? (
                          <CheckCircle className="text-green-500 ml-2" />
                        ) : (
                          selectedAnswer === index && (
                            <X className="text-red-500 ml-2" />
                          )
                        ))}
                    </div>
                  )
                )}
              </RadioGroup>
              {showExplanation && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <h3 className="font-bold mb-2">Explanation:</h3>
                  <p>{lessonData[data.index].quiz[currentQuestion].explanation}</p>
                </div>
              )}
              <div className="flex justify-between mt-4">
                {isAnswered && !showExplanation && (
                  <Button onClick={() => setShowExplanation(true)}>
                    See Explanation
                  </Button>
                )}
                {isAnswered && (
                  <Button onClick={handleNextQuestion}>
                    {currentQuestion < lessonData[data.index].quiz.length - 1
                      ? "Next Question"
                      : "Finish Quiz"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2"></div>
      <Footer/>
    </div>
  );
}
