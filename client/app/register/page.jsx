"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, UserPlus, Linkedin, Mail, User } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    lastName: '',
    linkedinUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const router = useRouter();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      newErrors.username = 'Username must be between 3 and 50 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      handleNextStep();
      return;
    }
    
    setIsLoading(true);
    setServerError('');
    
    try {
      // Registration API call
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          linkedinUrl: formData.linkedinUrl || undefined
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Show success message or redirect
      router.push('/login?registered=true');
    } catch (err) {
      setServerError(err.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex relative">
      {/* Company Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-8 z-20 flex items-center space-x-2"
      >
        <span className="text-3xl font-bold text-white flex items-center gap-2">
          <span>✴</span>InstructAI
        </span>
      </motion.div>

      {/* Left Section with Background Image and Text */}
      <div className="hidden lg:flex w-1/2 relative bg-[#2E2883] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/api/placeholder/1200/800"
            alt="Background" 
            className="w-full h-full object-cover opacity-10 scale-105 hover:scale-110 transition-transform duration-700"
          />
          {/* Animated Gradient Overlay */}
          <motion.div 
            animate={{
              background: [
                "linear-gradient(to br, rgba(46,40,131,0.9), rgba(26,22,72,0.95))",
                "linear-gradient(to br, rgba(46,40,131,0.95), rgba(26,22,72,0.9))",
                "linear-gradient(to br, rgba(46,40,131,0.9), rgba(26,22,72,0.95))"
              ]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute inset-0"
          />
          
          {/* Sparkles Effect */}
          <SparklesCore
            background="transparent"
            minSize={0.3}
            maxSize={1.0}
            particleDensity={80}
            className="absolute top-0 left-0 w-full h-full"
            particleColor="#ffffff"
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-white text-center px-12 max-w-2xl"
        >
          <div className="flex justify-center mb-6"></div>
          <h1 className="text-5xl font-bold leading-tight mb-6 tracking-tight">
            Join our learning{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200 relative inline-block">
              community today
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-lg"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </span>
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            Create your account to access personalized AI tutoring, interactive lessons, and track your learning progress
          </p>
        </motion.div>
      </div>

      {/* Right Section with Registration Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-[#2E2883]/10 p-4 rounded-2xl inline-block mx-auto"
            >
              <UserPlus className="w-12 h-12 text-[#2E2883]" />
            </motion.div>

            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-gray-900"
              >
                Create Account
              </motion.h1>
              <p className="text-lg text-gray-500">
                {currentStep === 1 ? 
                  "Enter your account details to get started" :
                  "Tell us a bit more about yourself (optional)"
                }
              </p>
            </div>

            {/* Step Progress Indicator */}
            <div className="flex justify-center space-x-2 pt-2">
              <motion.div
                className={`h-2 w-16 rounded-full ${currentStep === 1 ? 'bg-[#2E2883]' : 'bg-[#2E2883]'}`}
                initial={{ width: 0 }}
                animate={{ width: '4rem' }}
                transition={{ duration: 0.4 }}
              />
              <motion.div
                className={`h-2 w-16 rounded-full ${currentStep === 2 ? 'bg-[#2E2883]' : 'bg-gray-200'}`}
                initial={{ width: 0 }}
                animate={{ width: '4rem' }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              >
                {serverError}
              </motion.div>
            )}
            
            <motion.form
              key={`form-step-${currentStep}`}
              initial={{ opacity: 0, x: currentStep === 1 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: currentStep === 1 ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {currentStep === 1 ? (
                /* Step 1 Fields - Required Information */
                <>
                  <div className="space-y-1">
                    <label htmlFor="username" className="block text-base font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      
                      
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className={cn(
                          "h-12 text-base pl-10 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]",
                          errors.username ? "border-red-300" : "border-gray-300"
                        )}
                        placeholder="Choose a username"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-base font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={cn(
                          "h-12 text-base pl-10 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]",
                          errors.email ? "border-red-300" : "border-gray-300"
                        )}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-base font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className={cn(
                          "h-12 text-base pr-10 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]",
                          errors.password ? "border-red-300" : "border-gray-300"
                        )}
                        placeholder="Create a password"
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={cn(
                          "h-12 text-base pr-10 block w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]",
                          errors.confirmPassword ? "border-red-300" : "border-gray-300"
                        )}
                        placeholder="Confirm your password"
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              ) : (
                /* Step 2 Fields - Optional Information */
                <>
                  <div className="space-y-1">
                    <label htmlFor="firstName" className="block text-base font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="h-12 text-base mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="lastName" className="block text-base font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="h-12 text-base mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]"
                      placeholder="Enter your last name"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="linkedinUrl" className="block text-base font-medium text-gray-700">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Linkedin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="linkedinUrl"
                        name="linkedinUrl"
                        type="text"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        className="h-12 text-base pl-10 mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]"
                        placeholder="linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>
                </>
              )}

             

              <div className="flex space-x-4">
                {currentStep === 2 && (
                  <motion.button
                    type="button"
                    onClick={handlePrevStep}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-1/3 h-12 text-base font-medium text-[#2E2883] bg-white border border-[#2E2883] hover:bg-[#2E2883]/5 transition-all duration-300 rounded-lg"
                  >
                    Back
                  </motion.button>
                )}
                
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={currentStep === 1 ? "w-full" : "w-2/3"}
                >
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "w-full h-12 text-base font-medium text-white",
                      "bg-gradient-to-r from-[#2E2883] to-[#1a1648]",
                      "hover:from-[#2E2883]/90 hover:to-[#1a1648]/90",
                      "transition-all duration-300 shadow-lg hover:shadow-xl",
                      "rounded-lg relative overflow-hidden",
                      isLoading && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? "Processing..." : (currentStep === 1 ? "Continue" : "Create Account")}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    />
                  </button>
                </motion.div>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                    <Link 
                      href="/login" 
                      className="text-[#2E2883] font-medium hover:underline"
                    >
                      Sign in
                    </Link>
                  </motion.span>
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}