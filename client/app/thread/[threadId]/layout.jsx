"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  Home,
  Star,
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CommunityLayout({ children }) {
  const pathname = usePathname();
  
  // Determine if we're on the thread detail page to adjust layout
  const isThreadDetailPage = pathname?.includes('/threads/') && pathname !== '/threads';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      {!isThreadDetailPage && (
        <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-8 w-8 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                    <div className="absolute top-1 left-1 h-6 w-6 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                      <span className="text-white font-bold text-sm -rotate-12">A</span>
                    </div>
                  </div>
                  <span className="font-extrabold tracking-tight text-slate-800">
                    Instruct<span className="text-blue-600">AI</span>
                  </span>
                </div>
              </Link>
              
              {/* Nav Links */}
              <div className="hidden md:flex items-center space-x-1">
                <Link href="/">
                  <Button variant="ghost" className="gap-2">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="ghost" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Courses
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant={pathname.startsWith('/community') || pathname.startsWith('/threads') ? "default" : "ghost"} className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Community
                  </Button>
                </Link>
              </div>
              
              {/* User Menu - placeholder */}
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-slate-100">
                  <span className="font-medium text-slate-800">JD</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Community Nav Tabs - only show on main community pages */}
      {!isThreadDetailPage && pathname.startsWith('/community') && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto py-3 gap-1">
              <Link href="/community">
                <Button 
                  variant={pathname === '/community' ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  All Threads
                </Button>
              </Link>
              <Link href="/community/my-threads">
                <Button 
                  variant={pathname === '/community/my-threads' ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  My Threads
                </Button>
              </Link>
              <Link href="/community/members">
                <Button 
                  variant={pathname === '/community/members' ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Members
                </Button>
              </Link>
              <Link href="/community/courses">
                <Button 
                  variant={pathname === '/community/courses' ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Course Discussions
                </Button>
              </Link>
              <Link href="/community/settings">
                <Button 
                  variant={pathname === '/community/settings' ? "default" : "ghost"} 
                  size="sm"
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="relative">
                <div className="h-8 w-8 bg-blue-600 rounded-tl-2xl rounded-br-2xl rotate-12"></div>
                <div className="absolute top-1 left-1 h-6 w-6 bg-indigo-500 rounded-tl-xl rounded-br-xl rotate-12 flex items-center justify-center">
                  <span className="text-white font-bold text-sm -rotate-12">A</span>
                </div>
              </div>
              <span className="font-extrabold tracking-tight text-slate-800">
                Instruct<span className="text-blue-600">AI</span>
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-slate-600">
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <Link href="/help" className="hover:text-blue-600 transition-colors">Help Center</Link>
              <div className="text-slate-400">© 2025 InstructAI Inc.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}