"use client"

import React, { useState, useEffect } from 'react'
import YouTube from 'react-youtube'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { PlayIcon, PauseIcon } from "lucide-react"
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Demo content
const demoContent = {
  videoId: 'ukzFI9rgwfU',
  title: "Machine Learning Basics",
  questions: [
    {
      timestamp: 10,
      question: "What is the main topic of this video?",
      options: ['Cooking recipes', 'Web development', 'Machine learning'],
      correctAnswer: 'Machine learning'
    },
    {
      timestamp: 50,
      question: "What type of machine learning is discussed?",
      options: ['Supervised learning', 'Unsupervised learning', 'Reinforcement learning'],
      correctAnswer: 'Supervised learning'
    },
    {
      timestamp:400,
      question: "What is the goal of machine learning according to the video?",
      options: ['To replace human jobs', 'To make predictions based on data', 'To create artificial intelligence'],
      correctAnswer: 'To make predictions based on data'
    },
    {
      timestamp: 100,
      question: "What is the main topic of this video?",
      options: ['Cooking recipes', 'Web development', 'Machine learning'],
      correctAnswer: 'Machine learning'
    },
    
  ]
}

export default function YoutubeGenerator() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showQuestion, setShowQuestion] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState(null)
  const [player, setPlayer] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [duration, setDuration] = useState(0)

  const currentQuestion = demoContent.questions[currentQuestionIndex]

  useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        const currentTime = Math.floor(player.getCurrentTime())
        setProgress((currentTime / duration) * 100)
        
        const nextQuestion = demoContent.questions.find(q => q.timestamp === currentTime)
        if (nextQuestion) {
          player.pauseVideo()
          setIsPlaying(false)
          setShowQuestion(true)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [player, duration])

  const onReady = (event) => {
    setPlayer(event.target)
    setDuration(event.target.getDuration())
  }

  const handleSubmit = () => {
    const correct = selectedAnswer === currentQuestion.correctAnswer
    setIsCorrect(correct)
    if (correct) {
      setTimeout(() => {
        setShowQuestion(false)
        setSelectedAnswer('')
        setIsCorrect(null)
        setCurrentQuestionIndex((prev) => prev + 1)
        player.playVideo()
        setIsPlaying(true)
      }, 2000)
    }
  }

  const handleContinue = () => {
    setShowQuestion(false)
    setIsCorrect(null)
    setSelectedAnswer('')
    setCurrentQuestionIndex(prev => prev + 1)
    player.playVideo()
    setIsPlaying(true)
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <>
  
        {/* <Header/> */}
      <div className="container mx-auto p-4 max-w-6xl">
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative aspect-video">
          <YouTube
            videoId={demoContent.videoId}
            onReady={onReady}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
              },
            }}
            className="absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-between p-6">
            <h1 className="text-4xl font-bold text-white">{demoContent.title}</h1>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-white/20 hover:bg-white/30 transition-all"
                onClick={togglePlayPause}
              >
                {isPlaying ? <PauseIcon className="h-6 w-6 text-white" /> : <PlayIcon className="h-6 w-6 text-white" />}
              </Button>
              <div className="flex-grow">
                <Progress value={progress} className="h-2" />
                <div className="relative">
                  {demoContent.questions.map((q, index) => (
                    <div
                      key={index}
                      className="absolute top-0 w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2"
                      style={{ left: `${(q.timestamp / duration) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showQuestion} onOpenChange={setShowQuestion}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentQuestion?.question}</DialogTitle>
          </DialogHeader>
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="gap-4">
            {currentQuestion?.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-end gap-4 mt-4">
            {isCorrect === null ? (
              <Button onClick={handleSubmit} disabled={!selectedAnswer}>Submit</Button>
            ) : (
              <>
                <p className={`text-lg font-semibold ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`}
                </p>
                <Button onClick={handleContinue}>Continue</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
   
    </>
  )
}