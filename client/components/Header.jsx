"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { usePathname } from "next/navigation";

// Helper component for navigation links
const NavLink = ({ href, active, onClick, disabled, children }) => (
  <Link 
    href={href} 
    onClick={(e) => {
      if (disabled || (onClick && !href.startsWith('/'))) {
        e.preventDefault();
        if (!disabled && onClick) onClick();
      }
    }} 
    className={`px-3 py-2 rounded-md transition-colors relative group ${
      disabled ? 'text-slate-400 cursor-not-allowed' :
      active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'
    }`}
  >
    {children}
    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left transition-transform ${
      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
    }`}></span>
  </Link>
);

export default function Header({ totalXP = 1000, withCourseAccess = true }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // This ensures the component only checks the active path once mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <nav className="fixed w-full z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
      <div className="max-w-screen-xl mx-auto px-6 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
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
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Only check the active state once mounted on client */}
            <NavLink 
              href="/dashboard" 
              active={mounted && pathname === "/dashboard"}
            >
              Dashboard
            </NavLink>
            <NavLink 
              href="/courses" 
              active={mounted && (pathname === "/courses" || pathname.startsWith("/courses/"))}
              disabled={!withCourseAccess}
            >
              Courses
            </NavLink>
            <NavLink 
              href="/tutor" 
              active={mounted && pathname === "/tutor"}
            >
              AI Tutor
            </NavLink>
            
            <div className="ml-8 flex items-center space-x-4">
              <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                <Star className="h-4 w-4 mr-1" />
                <span>{totalXP} XP</span>
              </div>
              <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="font-medium text-slate-600">SP</span>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-slate-700 hover:text-blue-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}