"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpenIcon,
  CheckCircle,
  Lock,
  ChevronRight,
  UnlockIcon,
  BookOpen
} from "lucide-react";

/**
 * Component to display a list of key terms with their progress status
 * 
 * @param {Object} props
 * @param {Array} props.terms - Array of term objects with status
 * @param {number} props.activeTermIndex - Index of the currently active term
 * @param {Function} props.onTermSelect - Callback when a term is selected
 */
export default function TermsList({ 
  terms = [], 
  activeTermIndex, 
  onTermSelect 
}) {
  // If there are no terms, show empty state
  if (!terms || terms.length === 0) {
    return (
      <Card className="border-none shadow-md overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50">
          <h2 className="font-bold text-xl">Key Terms</h2>
        </div>
        <CardContent className="p-4 text-center text-gray-500">
          <p>No key terms available</p>
        </CardContent>
      </Card>
    );
  }

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.05 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h2 className="font-bold text-xl">Key Terms</h2>
      </div>
      
      <motion.div 
        className="divide-y divide-gray-100 dark:divide-gray-800"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {terms.map((term, index) => {
          const isUnlocked = term.unlocked;
          const isCompleted = term.completed;
          const isActive = activeTermIndex === term.termIndex;
          
          return (
            <motion.button
              key={term.termIndex}
              variants={itemVariants}
              className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                isActive 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : isCompleted
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                  : !isUnlocked
                  ? "bg-gray-50 text-gray-400 dark:bg-gray-900/50 dark:text-gray-500 cursor-not-allowed"
                  : "hover:bg-gray-50 text-gray-700 dark:hover:bg-gray-800/50 dark:text-gray-300"
              }`}
              onClick={() => isUnlocked && onTermSelect(term.termIndex)}
              disabled={!isUnlocked}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={!isUnlocked ? "text-gray-400 dark:text-gray-600" : ""}>
                    {term.term}
                  </span>
                  
                  {/* Resource completion indicators */}
                  {isUnlocked && (
                    <div className="flex gap-1 mt-1">
                      {term.articleAvailable && (
                        <Badge 
                          variant="outline" 
                          className={`px-1 py-0 text-xs ${
                            term.articleCompleted
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          Article
                        </Badge>
                      )}
                      
                      {term.videoAvailable && (
                        <Badge 
                          variant="outline" 
                          className={`px-1 py-0 text-xs ${
                            term.videoCompleted
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          Video
                        </Badge>
                      )}
                      
                      {term.quizAvailable && (
                        <Badge 
                          variant="outline" 
                          className={`px-1 py-0 text-xs ${
                            term.quizCompleted
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          Quiz
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {isActive && (
                <ChevronRight className="h-4 w-4" />
              )}
            </motion.button>
          );
        })}
      </motion.div>
      
      {/* Progress summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>
            {terms.filter(t => t.completed).length} / {terms.length} completed
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 dark:bg-blue-600 rounded-full"
            style={{ 
              width: `${Math.round((terms.filter(t => t.completed).length / terms.length) * 100)}%` 
            }}
          />
        </div>
      </div>
    </Card>
  );
}