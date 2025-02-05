import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QuestionDialog = ({ isOpen, onClose, onSubmit }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionType, setQuestionType] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');

  const generateQuestion = () => {
    const questions = [
      {
        type: 'mcq',
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 'Paris'
      },
      {
        type: 'shortAnswer',
        question: 'Explain the concept of photosynthesis in one sentence.',
        correctAnswer: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.'
      },
      {
        type: 'fillBlank',
        question: 'The chemical symbol for water is ____.',
        correctAnswer: 'H2O'
      }
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setQuestionType(randomQuestion.type);
    setUserAnswer('');
    setFeedback('');
  };

  const handleAnswerSubmit = () => {
    if (currentQuestion) {
      let isCorrect = false;
      switch (currentQuestion.type) {
        case 'mcq':
          isCorrect = userAnswer === currentQuestion.correctAnswer;
          break;
        case 'subjective':
          isCorrect = userAnswer.toLowerCase().includes(currentQuestion.correctAnswer.toLowerCase());
          break;
        case 'fillBlank':
          isCorrect = userAnswer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
          break;
      }

      setFeedback(isCorrect
        ? "Great job! That's correct."
        : `I'm afraid that's not correct. The right answer is: ${currentQuestion.correctAnswer}`
      );

      setTimeout(() => {
        onSubmit(isCorrect);
        onClose();
        setCurrentQuestion(null);
        setUserAnswer('');
        setFeedback('');
      }, 3000);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      generateQuestion();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Question</DialogTitle>
          <DialogDescription>
            Please answer this question to continue your learning session.
          </DialogDescription>
        </DialogHeader>
        {currentQuestion && (
          <div className="space-y-4">
            <p className="font-semibold">{currentQuestion.question}</p>
            {currentQuestion.type === 'mcq' && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => setUserAnswer(option)}
                    variant={userAnswer === option ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}
            {(currentQuestion.type === 'subjective' || currentQuestion.type === 'fillBlank') && (
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
              />
            )}
            <Button onClick={handleAnswerSubmit}>Submit Answer</Button>
            {feedback && (
              <p className={`font-semibold ${feedback.includes('correct') ? 'text-green-500' : 'text-red-500'}`}>
                {feedback}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDialog;