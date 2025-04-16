"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Users } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        router.push('/home');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
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
          <span>✴</span>Instruct AI
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
  Master any subject with{" "}
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200 relative inline-block">
    AI-Powered Learning
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
  InstructAI transforms education with personalized AI tutoring, interactive lessons, and deep insights to accelerate your mastery of any course material
</p>
        </motion.div>
      </div>

      {/* Right Section with Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-[#2E2883]/10 p-4 rounded-2xl inline-block mx-auto"
            >
              <Users className="w-12 h-12 text-[#2E2883]" />
            </motion.div>

            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-gray-900"
              >
                Welcome Back
              </motion.h1>
              <p className="text-lg text-gray-500">
                Please sign in to access your account
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg"
              >
                {error}
              </motion.div>
            )}
            
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="username" className="block text-base font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 text-lg mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]"
                  placeholder="Enter your username"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="block text-base font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 text-lg pr-10 mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#2E2883] focus:border-[#2E2883]"
                    placeholder="Enter your password"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 text-[#2E2883] focus:ring-[#2E2883] border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-base text-gray-600">
                    Remember me
                  </label>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full h-14 text-lg font-medium text-white",
                    "bg-gradient-to-r from-[#2E2883] to-[#1a1648]",
                    "hover:from-[#2E2883]/90 hover:to-[#1a1648]/90",
                    "transition-all duration-300 shadow-lg hover:shadow-xl",
                    "rounded-lg relative overflow-hidden",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
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
              
              <div className="text-center pt-4 space-y-2">
                <p className="text-gray-600 font-medium">Don't have an account?</p>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Link 
                    href="/register" 
                    className="text-[#2E2883] font-medium hover:underline"
                  >
                    Register here
                  </Link>
                </motion.div>
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}