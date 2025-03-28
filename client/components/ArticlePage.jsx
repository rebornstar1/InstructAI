"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  BookmarkPlus, 
  Download, 
  Share2, 
  Clock, 
  Tag,
  Printer,
  ThumbsUp
} from "lucide-react";
import CustomMarkdownRenderer from "./ui/CustomMarkdownRenderer";

const ArticlePage = ({ 
  article, 
  onBack, 
  courseTitle, 
  moduleTitle 
}) => {
  useEffect(() => {
    // Scroll to top when article page loads
    window.scrollTo(0, 0);
    
    // Optional: Save to recent views or reading history
    // saveToReadingHistory(article.title);
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No article selected. Please select an article to view.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header with breadcrumb */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={onBack} 
                className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
                aria-label="Back to module"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to module
              </button>
              <div className="mt-1 text-xs text-gray-400">
                {courseTitle} / {moduleTitle}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1">
                <BookmarkPlus className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="pt-8">
        {/* Article header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            {article.readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{article.readingTime}</span>
              </div>
            )}
            
            {article.date && (
              <div className="flex items-center gap-1">
                <span>Published {article.date}</span>
              </div>
            )}
            
            {article.author && (
              <div className="flex items-center gap-1">
                <span>By {article.author}</span>
              </div>
            )}
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {article.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Article content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8 mb-8">
              <div className="prose prose-blue max-w-none">
                <CustomMarkdownRenderer markdown={article.content} />
              </div>
            </div>
            
            {/* Article actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white shadow-sm rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Helpful
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
              
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save to Library
              </Button>
            </div>
            
            {/* Related content */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8 mb-8">
                <h2 className="text-xl font-bold mb-4">Related Articles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {article.relatedArticles.map((related, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <h3 className="font-medium text-blue-600">{related.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{related.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>
      
      {/* Fixed bottom navigation on mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 p-3 flex justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" className="h-9 w-9 bg-blue-600 hover:bg-blue-700">
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;