"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { fetchWithAuth, getStreaKWithAuth } from "@/lib/api";


// Helper component for navigation links
const NavLink = ({ href, active, disabled, children }) => (
    <Link 
      href={disabled ? "#" : href}
      className={`px-3 py-2 rounded-md transition-colors relative group ${
        disabled ? 'text-slate-400 cursor-not-allowed' :
        active ? 'text-blue-700' : 'text-slate-700 hover:text-blue-600'
      }`}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
    >
      {children}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform origin-left transition-transform ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}></span>
    </Link>
  );

  

export default function Navbar2() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streakDays, setStreakDays] = useState(0);
   
  // Fetch user profile data from the backend
  useEffect(() => {
    
    async function fetchUserProfile() {
      try {
        if (!user) return;
        
        setLoading(true);
        const response = await fetchWithAuth('/users/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        console.log("NAVBARResponse" , response)
        const data = await response.json();
        
        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Could not load user profile data');
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }

    async function checkStreak() {
      console.log("Check Streak")
      try {
        if (!user) return;
        
        setLoading(true);
        const response = await getStreaKWithAuth('/users/record');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        console.log("Streak Data" , data)
        setStreakDays(data.currentStreak);
        
      } catch (err) {
        console.error('Error fetching streaks:', err);
        setError('Could not load user streaks');
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    }
  
    fetchUserProfile();
    checkStreak();
    
  }, [user]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
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
              {user ? (
                <>
                  <Link 
                    href="/generate-course"
                    className="mr-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center group"
                  >
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white bg-opacity-20 mr-2 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium">New Course</span>
                  </Link>

                  <NavLink href="/home" active={pathname === "/home"}>Dashboard</NavLink>
                  <NavLink href="/courses" active={pathname === "/courses"} >Courses</NavLink>
                  <NavLink href="/community" active={pathname === "/community"}>Community</NavLink>
                  <NavLink href="/resume-analyser" active={pathname === "/resume-analyser"}>Analyze Resume</NavLink>
                  
                  <div className="ml-8 flex items-center space-x-4">
                    {/* Streak indicator instead of XP */}
                    <div className="flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-full text-md">
                      <Flame className="h-5 w-5 mr-1" />
                      <span>{streakDays || 0} day{streakDays !== 1 ? 's' : ''}</span>
                    </div>
                    <Link href="/profile-page">
                      <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-300 transition-colors">
                        <span className="font-medium text-slate-600">{userProfile?.username ? userProfile.username.slice(0, 2).toUpperCase() : "U"}</span>
                      </div>
                    </Link>
                  </div>
                </>
              ) : (
                <Link 
                  href="/login"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                >
                  <span className="text-sm font-medium">Login</span>
                </Link>
              )}
            </div>
                                    
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                className="text-slate-700 hover:text-blue-600 focus:outline-none"
                onClick={toggleMobileMenu}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu, with animation */}
          <div 
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen 
                ? 'max-h-[500px] opacity-100' 
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-200">
              <div className="transform transition-all duration-300 ease-in-out delay-75 origin-top">
                <Link 
                  href="/generate-course"
                  className=" w-full text-left mb-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                >
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white bg-opacity-20 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium">New Course</span>
                </Link>
              </div>

              <div className={`transform transition-all duration-300 ease-in-out delay-100 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/home" ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <Link href="/home">Dashboard</Link>
                </div>
              </div>
              
              <div className={`transform transition-all duration-300 ease-in-out delay-150 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/courses" ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <Link href="/courses">Courses</Link>
                </div>
              </div>
              
              <div className={`transform transition-all duration-300 ease-in-out delay-200 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/community" ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <Link href="/community">Community</Link>
                </div>
              </div>
              
              <div className={`transform transition-all duration-300 ease-in-out delay-250 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === "/resume-analyser" ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <Link href="/resume-analyser">Analyze Resume</Link>
                </div>
              </div>
              
              <div className={`transform transition-all duration-300 ease-in-out delay-300 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div className="py-4 flex items-center justify-between">
                  <div className="flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-full text-md">
                    <Flame className="h-5 w-5 mr-1" />
                    <span>{streakDays || 0} day{streakDays !== 1 ? 's' : ''}</span>
                  </div>
                  <Link href="/profile-page">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="font-medium text-slate-600">{userProfile?.username ? userProfile.username.slice(0, 2).toUpperCase() : "U"}</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
  );
}