"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Track scroll position for animation triggers and nav highlighting
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'methodology', 'pricing'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation - Asymmetrical with accented elements */}
      <nav className="fixed w-full z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - More distinctive with custom shape */}
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight text-slate-800">
                  Instruct<span className="text-blue-600">AI</span>
                </span>
              </div>
            </Link>
            
            {/* Desktop navigation - Custom styling, not template-like */}
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="#home" active={activeSection === 'home'}>Home</NavLink>
              <NavLink href="#features" active={activeSection === 'features'}>Platform</NavLink>
              <NavLink href="#methodology" active={activeSection === 'methodology'}>Methodology</NavLink>
              <NavLink href="#pricing" active={activeSection === 'pricing'}>Solutions</NavLink>
              
              <div className="ml-8 flex items-center space-x-4">
                <Link href="/login">
                  <button className="text-slate-700 py-2 font-medium">
                      Log in
                  </button>
                </Link>
                <Link href= "/register">
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg font-medium">
                    Start Free
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-700 hover:text-blue-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
                {isMenuOpen && (
                <div className="md:hidden py-4 border-t border-slate-200">
                  <div className="flex flex-col space-y-3 px-2">
                  <MobileNavLink href="#home" onClick={() => setIsMenuOpen(false)}>Home</MobileNavLink>
                  <MobileNavLink href="#features" onClick={() => setIsMenuOpen(false)}>Platform</MobileNavLink>
                  <MobileNavLink href="#methodology" onClick={() => setIsMenuOpen(false)}>Methodology</MobileNavLink>
                  <MobileNavLink href="#pricing" onClick={() => setIsMenuOpen(false)}>Solutions</MobileNavLink>
                  <div className="pt-4 border-t border-slate-200 flex flex-col space-y-3">
                    
                    <Link href="/login">
                    <button className="text-slate-700 py-2 font-medium">
                      Log in
                    </button>
                    </Link>
                    
                    <Link href= "/register">
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg font-medium">
                    Start Free
                    </button>
                    </Link>
                  </div>
                  </div>
                </div>
                )}
              </div>
              </nav>

              {/* Hero Section - Asymmetrical and distinctive */}
      <section id="home" className="pt-32 md:pt-40 pb-16 md:pb-24 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="md:w-7/12 md:pr-12"
            >
              {/* Non-centered, left-aligned heading with stylistic elements */}
              <motion.div variants={itemVariants} className="inline-block mb-3">
                <div className="flex items-center">
                  <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">Personalized Education Platform</span>
                </div>
              </motion.div>
              
              <motion.h1 
                variants={itemVariants}
                className="text-4xl md:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                Transform learning with <span className="relative">
                  <span className="relative z-10">AI-powered</span>
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 z-0"></span>
                </span> courses
              </motion.h1>
              
              <motion.p 
                variants={itemVariants}
                className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl"
              >
                Create bespoke education experiences in minutes. InstructAI analyzes your goals and learning style to generate comprehensive, personalized courses exactly when you need them.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <Link href="/home">
                  <button className="relative overflow-hidden group bg-blue-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all hover:bg-blue-700">
                    <span className="relative z-10 flex items-center">
                      Get Started
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  </button>
                </Link>
                <button className="flex items-center justify-center text-slate-700 hover:text-blue-600 px-6 py-4 rounded-lg font-medium text-lg transition border border-slate-300 hover:border-blue-300 hover:bg-blue-50/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  See it in action
                </button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="md:w-5/12 mt-12 md:mt-0"
            >
              {/* Custom stylized app preview with overlapping elements */}
              <div className="relative">
                {/* Background glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-xl opacity-70"></div>
                
                {/* Main dashboard preview */}
                <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                  <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <img 
                    src='./dashboard.png' 
                    alt="InstructAI Dashboard" 
                    className="w-full"
                  />
                </div>
                
                {/* Floating element 1 - Course creation card */}
                <div className="absolute -right-6 -bottom-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-10">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <span className="font-medium text-sm text-slate-800">Course Created</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full">
                    <div className="h-1.5 w-3/4 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Python for Data Science: 12 modules</p>
                </div>
                
                {/* Floating element 2 - Notification */}
                <div className="absolute -left-8 top-20 w-40 bg-white rounded-lg shadow-lg p-3 z-10">
                  <div className="flex items-start">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mt-0.5 mr-2 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800">AI Recommendation</p>
                      <p className="text-xs text-slate-500">Add machine learning module?</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partner logos - subtle with monochrome styling
      <section className="py-12 border-y border-slate-200 bg-slate-50">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          <p className="text-center text-slate-500 text-sm mb-8">TRUSTED BY LEADING ORGANIZATIONS</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {['Google', 'Microsoft', 'IBM', 'Stanford', 'MIT', 'Harvard'].map((partner, index) => (
              <div key={index} className="flex justify-center">
                <div className="h-8 flex items-center text-slate-400 font-bold text-lg">{partner}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Features section - Unique layout, not template-like */}
      <section id="features" className="py-20 md:py-32 px-6 md:px-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12">
            <div className="md:col-span-4">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">Platform Features</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">Craft learning experiences as unique as your goals</h2>
              <p className="text-slate-600 mb-8">Our AI engine doesn't just assemble content—it architects comprehensive learning journeys tailored to your specific objectives, preferred learning style, and background knowledge.</p>
              
              <ul className="space-y-4">
                {['Personalized curriculum design', 'Multi-modal learning support', 'Adaptive content curation'].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: "Intelligent Course Generation",
                  description: "Describe what you want to learn in your own words, and our AI creates a structured curriculum with clear learning objectives and progression paths."
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  ),
                  title: "Precision Learning Pathways",
                  description: "Customize every aspect of your course—focus areas, difficulty, time investment, and learning format—to align perfectly with your objectives."
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  ),
                  title: "Resource Orchestration",
                  description: "Our platform scans and evaluates thousands of learning resources to identify and integrate the most relevant, high-quality content for your specific learning context."
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Cognitive Assessment Engine",
                  description: "Sophisticated interactive quizzes and challenges that adapt to your performance, identify knowledge gaps, and reinforce learning through targeted practice."
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="group p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-700 group-hover:text-blue-600 mb-4 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology section - Distinctive layout */}
      <section id="methodology" className="py-20 md:py-32 px-6 md:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-16 max-w-3xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">Our Methodology</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">AI-First Learning Design</h2>
            <p className="text-lg text-slate-600">
              Unlike traditional courses, InstructAI builds dynamic, responsive learning journeys that evolve with your progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                number: "01",
                title: "Input Analysis",
                description: "Our AI identifies what you need to learn, why you're learning it, and how you learn best."
              },
              {
                number: "02",
                title: "Knowledge Mapping",
                description: "We construct a comprehensive knowledge graph of your learning domain with optimal progression paths."
              },
              {
                number: "03",
                title: "Resource Curation",
                description: "Our algorithms identify and sequence the most effective learning resources for your specific needs."
              },
              {
                number: "04",
                title: "Interactive Learning",
                description: "Engage with material through varied formats—video lectures, articles, hands-on exercises, and discussions."
              },
              {
                number: "05",
                title: "Adaptive Assessment",
                description: "Regular knowledge checks that adapt to your performance and focus on areas needing reinforcement."
              },
              {
                number: "06",
                title: "Continuous Optimization",
                description: "Your course evolves based on your progress, feedback, and changing learning objectives."
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 transition-all hover:shadow-md p-6">
                  <div className="absolute -right-2 -top-2 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview - More sophisticated and unique */}
      <section className="py-20 px-6 md:px-8 bg-white overflow-hidden">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">Intelligent Dashboard</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                Visualize your learning progress in real-time
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Our intuitive dashboard provides comprehensive insights into your learning journey, highlighting achievements, areas for improvement, and personalized recommendations.
              </p>
              
              <div className="space-y-4">
                {[
                  "Progress tracking across all courses and modules",
                  "Adaptive recommendations based on your learning patterns",
                  "Comprehensive skill development visualization",
                  "Achievement system that recognizes your milestones"
                ].map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-10">
                <button className="group inline-flex items-center text-blue-600 font-medium hover:text-blue-800">
                  Explore features
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="relative">
              {/* Dashboard visualization with realistic UI elements */}
              <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
                <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="mx-auto text-sm text-slate-500 font-medium">InstructAI Learning Dashboard</div>
                </div>
                <img 
                  src="./dashboard.png" 
                  alt="InstructAI Dashboard Interface" 
                  className="w-full"
                />
                
                {/* Floating stats card */}
                <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 border border-slate-200 w-48">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Learning Progress</h4>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Web Development</span>
                      <span className="text-blue-600 font-medium">78%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full">
                      <div className="h-1.5 bg-blue-600 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Python</span>
                      <span className="text-blue-600 font-medium">92%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full">
                      <div className="h-1.5 bg-blue-600 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Data Science</span>
                      <span className="text-blue-600 font-medium">45%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full">
                      <div className="h-1.5 bg-blue-600 rounded-full" style={{width: '45%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing section - Custom design, not template-like
      <section id="pricing" className="py-20 md:py-32 px-6 md:px-8 bg-slate-50">
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-16 max-w-3xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">Flexible Solutions</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Pricing plans for every learning journey</h2>
            <p className="text-lg text-slate-600">
              Whether you're an individual learner or an organization, we have tailored solutions to help you achieve your educational goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Explorer",
                price: "$0",
                period: "Free forever",
                description: "Perfect for casual learners looking to explore our platform.",
                features: [
                  "5 courses per month",
                  "Basic progress tracking",
                  "Community support",
                  "Limited course customization"
                ],
                buttonText: "Start for free",
                highlighted: false
              },
              {
                name: "Professional",
                price: "$19",
                period: "per month",
                description: "Ideal for dedicated learners who want to maximize their educational potential.",
                features: [
                  "Unlimited courses",
                  "Advanced progress analytics",
                  "Priority support",
                  "Full course customization",
                  "Learning path recommendations",
                  "Certificate of completion"
                ],
                buttonText: "Get started",
                highlighted: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "tailored pricing",
                description: "For organizations looking to implement personalized learning at scale.",
                features: [
                  "Team management features",
                  "Dedicated success manager",
                  "Advanced analytics & reporting",
                  "Custom integrations",
                  "SSO authentication",
                  "Multiple admin accounts"
                ],
                buttonText: "Contact us",
                highlighted: false
              }
            ].map((plan, index) => (
              <div 
                key={index} 
                className={`rounded-xl overflow-hidden transition-all hover:shadow-xl ${
                  plan.highlighted 
                    ? 'shadow-lg border-2 border-blue-600 relative' 
                    : 'bg-white shadow border border-slate-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center text-sm font-medium py-1">
                    MOST POPULAR
                  </div>
                )}
                <div className={`p-8 ${plan.highlighted ? 'bg-gradient-to-br from-blue-50 to-indigo-50 pt-10' : 'bg-white'}`}>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-slate-600 mb-6">{plan.description}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transform hover:-translate-y-0.5' 
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Testimonials - Unique and elegant design */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-50 to-transparent rounded-tr-full opacity-70"></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="mb-16 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
              <div className="h-px bg-slate-300 flex-grow"></div>
              <span className="px-4 text-blue-600 font-medium">TESTIMONIALS</span>
              <div className="h-px bg-slate-300 flex-grow"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 text-center">What our users say</h2>
            <p className="text-lg text-slate-600 text-center">
              We've helped thousands of learners achieve their educational goals. Here's what some of them have to say.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The adaptive quizzes helped identify my knowledge gaps and the system adjusted my course accordingly. I've never experienced such personalized learning.",
                name: "Sanjay Paul",
                role: "Software Development Engineer, Oracle",
                image: "./sanjaypaul.png"
              },
              {
                quote: "InstructAI completely changed how I approach learning. The personalized courses saved me countless hours of searching for the right resources.",
                name: "Vraj Shah",
                role: "Software Developer, Google",
                image: "./vrajshah.png"
              },
              {
                quote: "As a manager, I needed to quickly learn new skills for an upcoming project. InstructAI created the perfect learning path that fit my tight schedule.",
                name: "Akshay Waghmare",
                role: "Product Manager, Microsoft",
                image: "./akshaywaghmare.png"
              }
              
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6">
                  {/* Stylized quote icon */}
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391C14.017 10.465 16.735 7.03 19.652 6l.5 1.5c-1.723.729-2.879 2.35-3.057 4.18.344 0 .68-.002.962 0 3.259.015 3.964 3.515 3.914 5.202-.048 1.622-1.011 4.118-3.847 4.118h-4.107zm-7 0v-7.391C7.017 10.465 9.735 7.03 12.652 6l.5 1.5c-1.723.729-2.879 2.35-3.057 4.18.344 0 .68-.002.962 0 3.259.015 3.964 3.515 3.914 5.202-.048 1.622-1.011 4.118-3.847 4.118H7.017z"/>
                    </svg>
                  </div>
                  <p className="text-slate-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-slate-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action - Distinctive design */}
      <section className="py-20 px-6 md:px-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
        {/* Abstract decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-8 border-white"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-8 border-white"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-8 border-white"></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Transform your learning journey today
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-90">
              Join thousands of learners who are already creating personalized educational experiences with InstructAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-medium text-lg transition shadow-md hover:shadow-lg">
                Get started for free
              </button>
              <button className="border-2 border-white bg-transparent hover:bg-white/10 px-8 py-4 rounded-lg font-medium text-lg transition">
                Schedule a demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Sophisticated and unique */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-screen-xl mx-auto px-6 md:px-8">
          {/* Main footer content */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="h-10 w-10 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                  <div className="absolute top-1 left-1 h-8 w-8 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                    <span className="text-white font-bold text-lg -rotate-12">C</span>
                  </div>
                </div>
                <span className="font-extrabold tracking-tight">
                  Instruct<span className="text-blue-500">AI</span>
                </span>
              </div>
              <p className="text-slate-400 mb-6">
                Revolutionizing personalized education through AI-powered learning experiences.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'linkedin', 'instagram'].map(social => (
                  <a key={social} href="#" className="text-slate-500 hover:text-blue-400 transition">
                    <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center">
                      <span className="sr-only">{social}</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Use Cases', 'Roadmap', 'Integrations'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                {['Documentation', 'Blog', 'Community', 'Support', 'Learning Center'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service'].map(link => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 hover:text-white transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom footer */}
          <div className="py-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} InstructAI, Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Terms</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Cookies</a>
              <a href="#" className="text-slate-500 hover:text-white transition text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavLink = ({ href, active, children }) => (
  <a 
    href={href} 
    className={`px-3 py-2 rounded-md transition-colors relative group ${
      active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'
    }`}
  >
    {children}
    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left transition-transform ${
      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
    }`}></span>
  </a>
);

const MobileNavLink = ({ href, onClick, children }) => (
  <a 
    href={href} 
    onClick={onClick}
    className="px-3 py-2 text-slate-700 hover:text-blue-600 font-medium"
  >
    {children}
  </a>
);

export default LandingPage;