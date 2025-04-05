"use client";

import React, { useState, useEffect } from "react";

export default function Footer() {
  // Use state to store the year and update it on the client side only
  const [year, setYear] = useState("2024"); // Provide a default value for SSR
  
  // Update the year after component mounts on client
  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);
  
  return (
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
            &copy; {year} InstructAI, Inc. All rights reserved.
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
  );
}