"use client"

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CourseContentComponent from "../../components/CourseContentComponent";
import Navbar2 from "@/components/Navbar2";
import ProtectedRoute from "@/components/ProtectedRoute";



export default function CourseContent(){

const [generatedCourse, setGeneratedCourse] = useState(null);
const [messages, setMessages] = useState([]);


return(
  <ProtectedRoute>
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      <Navbar2/>

      {/* Main content with proper padding to avoid navbar overlap */}
      <div className="pt-28 px-6 md:px-8 max-w-screen-xl mx-auto pb-16">
        <motion.div 
          key="course"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-block mb-3">
            <div className="flex items-center">
              <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
              <span className="text-blue-600 font-medium">Course Content</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
            {generatedCourse?.title || "Course Content"}
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            {generatedCourse?.description || "Explore your course materials and track your progress."}
          </p>
          
          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
            <CourseContentComponent
              generatedCourse={generatedCourse}
              setMessages={setMessages}
            />
          </div>
        </motion.div>
      </div>
    </div>
    </ProtectedRoute>
)
}