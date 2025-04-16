"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Star, 
  Book, 
  ChevronRight, 
  Sparkles,
  Trophy,
  Flame,
  Users,
  Medal,
  Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; 
import { fetchWithAuth } from "@/lib/api";

import { usePathname } from 'next/navigation';
import Navbar2 from "./Navbar2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';

export default function Dashboard() {

  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Leaderboard state
  const [leaderboardTab, setLeaderboardTab] = useState("streak");
  const [leaderboardData, setLeaderboardData] = useState({
    streak: [],
    xp: []
  });
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  

  // Example raw course suggestions - will still be hardcoded for the UI
  const rawCourses = [
    {
      title: "Mathematics: Algebra Basics",
      description: "Learn the fundamentals of algebra, including solving equations and working with variables.",
      icon: "📐"
    },
    {
      title: "Mathematics: Geometry Essentials",
      description: "Discover the basics of geometry, shapes, theorems, and proofs.",
      icon: "📏"
    },
    {
      title: "Science: Physics Fundamentals",
      description: "Explore the fundamental principles of physics, including mechanics and energy.",
      icon: "🔭"
    },
    {
      title: "Science: Chemistry Essentials",
      description: "Understand the basics of chemistry, including elements, compounds, and reactions.",
      icon: "🧪"
    },
  ];

  // Fetch user profile data from the backend
  useEffect(() => {
    console.log("HIII")
    console.log("USSS" ,user)
    async function fetchUserProfile() {
      
      try {
        
        if (!user) return;
        console.log("doing")
        
        setLoading(true);
        const response = await fetchWithAuth('/users/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        console.log("REsponse" , response.json)
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

    fetchUserProfile();
    
  }, [user]);
 
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const cardHoverVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.2 }
    }
  };
  
// Fetch leaderboard data
useEffect(() => {
  async function fetchLeaderboard() {
    try {
      setLeaderboardLoading(true);
      
      // Fetch data from real API endpoints
      const streakResponse = await fetch(`${API_URL}/api/leaderboard/streaks`);
      const xpResponse = await fetch(`${API_URL}/api/leaderboard/xp`);
      
      if (!streakResponse.ok || !xpResponse.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const streakData = await streakResponse.json();
      const xpData = await xpResponse.json();
      
      // Set the data in state
      setLeaderboardData({
        streak: streakData,
        xp: xpData
      });
      
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      
      // Fall back to mock data if API fails
      const mockStreakData = [
        { userId: 1, username: "alex_m", firstName: "Alex", lastName: "Martin", currentStreak: 42, maxStreak: 42 },
        { userId: 2, username: "sarah_j", firstName: "Sarah", lastName: "Johnson", currentStreak: 38, maxStreak: 40 },
        { userId: 3, username: "mike_t", firstName: "Mike", lastName: "Thompson", currentStreak: 35, maxStreak: 35 },
        { userId: 4, username: "emma_w", firstName: "Emma", lastName: "Wilson", currentStreak: 31, maxStreak: 35 },
        { userId: 5, username: "vraj", firstName: "Vraj", lastName: "Shah", currentStreak: 28, maxStreak: 30 },
        { userId: 6, username: "chris_d", firstName: "Chris", lastName: "Davis", currentStreak: 25, maxStreak: 40 },
        { userId: 7, username: "ashley_b", firstName: "Ashley", lastName: "Brown", currentStreak: 23, maxStreak: 25 },
        { userId: 8, username: "james_h", firstName: "James", lastName: "Harris", currentStreak: 20, maxStreak: 22 },
        { userId: 9, username: "olivia_l", firstName: "Olivia", lastName: "Lee", currentStreak: 18, maxStreak: 30 },
        { userId: 10, username: "david_m", firstName: "David", lastName: "Miller", currentStreak: 16, maxStreak: 20 }
      ];
      
      const mockXPData = [
        { userId: 5, username: "vraj", firstName: "Vraj", lastName: "Shah", xp: 8750, currentStreak: 28 },
        { userId: 3, username: "mike_t", firstName: "Mike", lastName: "Thompson", xp: 7620, currentStreak: 35 },
        { userId: 1, username: "alex_m", firstName: "Alex", lastName: "Martin", xp: 6845, currentStreak: 42 },
        { userId: 2, username: "sarah_j", firstName: "Sarah", lastName: "Johnson", xp: 5930, currentStreak: 38 },
        { userId: 6, username: "chris_d", firstName: "Chris", lastName: "Davis", xp: 5280, currentStreak: 25 },
        { userId: 4, username: "emma_w", firstName: "Emma", lastName: "Wilson", xp: 4950, currentStreak: 31 },
        { userId: 8, username: "james_h", firstName: "James", lastName: "Harris", xp: 4125, currentStreak: 20 },
        { userId: 7, username: "ashley_b", firstName: "Ashley", lastName: "Brown", xp: 3870, currentStreak: 23 },
        { userId: 10, username: "david_m", firstName: "David", lastName: "Miller", xp: 3540, currentStreak: 16 },
        { userId: 9, username: "olivia_l", firstName: "Olivia", lastName: "Lee", xp: 3210, currentStreak: 18 }
      ];
      
      setLeaderboardData({
        streak: mockStreakData,
        xp: mockXPData
      });
    } finally {
      setLeaderboardLoading(false);
    }
  }
  
  fetchLeaderboard();
}, []);

// Leaderboard component
const Leaderboard = () => (
  <motion.div 
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="w-full mb-8 sm:mb-12"
  >
    <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header section with responsive adjustments */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-2" />
            Leaderboard
          </h3>
          <div className="flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
            <button 
              onClick={() => setLeaderboardTab("streak")}
              className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                leaderboardTab === "streak" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              <span className="flex items-center justify-center sm:justify-start">
                <Flame className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="hidden xs:inline">Longest</span> Streaks
              </span>
            </button>
            <button 
              onClick={() => setLeaderboardTab("xp")}
              className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                leaderboardTab === "xp" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              <span className="flex items-center justify-center sm:justify-start">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="hidden xs:inline">Highest</span> XP
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {leaderboardLoading ? (
          <div className="p-8 sm:p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <motion.div
            key={`leaderboard-${leaderboardTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Table for tablet and desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="p-4 text-xs sm:text-sm font-medium text-slate-500">Rank</th>
                    <th className="p-4 text-xs sm:text-sm font-medium text-slate-500">User</th>
                    <th className="p-4 text-xs sm:text-sm font-medium text-slate-500 text-right">
                      {leaderboardTab === "streak" ? "Current Streak" : "XP"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leaderboardData[leaderboardTab] && leaderboardData[leaderboardTab].length > 0 ? (
                    leaderboardData[leaderboardTab].map((userData, index) => {
                      // Check if this is the current user
                      const isCurrentUser = userData.username === userProfile?.username;
                      
                      return (
                        <motion.tr 
                          key={userData.userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`hover:bg-slate-50 transition-colors ${isCurrentUser ? "bg-blue-50" : ""}`}
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              {index < 3 ? (
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                  index === 0 ? "bg-yellow-100 text-yellow-600" :
                                  index === 1 ? "bg-slate-200 text-slate-600" :
                                  "bg-amber-100 text-amber-600"
                                }`}>
                                  <Medal className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                                  {index + 1}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-medium mr-3">
                                {userData.firstName?.charAt(0) || '?'}{userData.lastName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800 flex items-center">
                                  {userData.firstName || 'User'} {userData.lastName || ''}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full">You</span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500">@{userData.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-slate-100">
                              {leaderboardTab === "streak" ? (
                                <>
                                  <Flame className="h-4 w-4 text-orange-500 mr-1.5" />
                                  <span className="text-slate-800">{userData.currentStreak} days</span>
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 text-blue-500 mr-1.5" />
                                  <span className="text-slate-800">{userData.xp.toLocaleString()} XP</span>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-slate-500">
                        No leaderboard data available yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile-friendly card layout */}
            <div className="sm:hidden">
              <div className="divide-y divide-slate-200">
                {leaderboardData[leaderboardTab] && leaderboardData[leaderboardTab].length > 0 ? (
                  leaderboardData[leaderboardTab].map((userData, index) => {
                    // Check if this is the current user
                    const isCurrentUser = userData.username === userProfile?.username;
                    
                    return (
                      <motion.div 
                        key={userData.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 ${isCurrentUser ? "bg-blue-50" : ""}`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 flex-shrink-0">
                            {index < 3 ? (
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
                                index === 0 ? "bg-yellow-100 text-yellow-600" :
                                index === 1 ? "bg-slate-200 text-slate-600" :
                                "bg-amber-100 text-amber-600"
                              }`}>
                                <Medal className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                                {index + 1}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0 mr-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-medium">
                              {userData.firstName?.charAt(0) || '?'}{userData.lastName?.charAt(0) || '?'}
                            </div>
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="font-medium text-slate-800 flex items-center flex-wrap">
                              <span className="truncate mr-1.5">
                                {userData.firstName || 'User'} {userData.lastName || ''}
                              </span>
                              {isCurrentUser && (
                                <span className="mt-0.5 text-xs bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full">You</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate">@{userData.username}</div>
                          </div>
                          
                          <div className="flex-shrink-0 ml-auto">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100">
                              {leaderboardTab === "streak" ? (
                                <>
                                  <Flame className="h-3.5 w-3.5 text-orange-500 mr-1" />
                                  <span className="text-slate-800">{userData.currentStreak} days</span>
                                </>
                              ) : (
                                <>
                                  <Star className="h-3.5 w-3.5 text-blue-500 mr-1" />
                                  <span className="text-slate-800">{userData.xp.toLocaleString()} XP</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No leaderboard data available yet
                  </div>
                )}
              </div>
            </div>
            
            
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </motion.div>
);

  // Suggested courses component
//   const SuggestedCourses = () => (
//     <motion.div 
//       variants={containerVariants}
//       initial="hidden"
//       animate="visible"
//       className="mt-12"
//     >
//       <motion.div variants={itemVariants} className="text-center space-y-4 mb-8">
//         <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
//           <Sparkles className="h-5 w-5 text-blue-500" />
//           <span>Recommended Courses</span>
//           <Sparkles className="h-5 w-5 text-blue-500" />
//         </h2>
//         <p className="text-gray-500 max-w-2xl mx-auto">
//           These courses are tailored to your learning history and goals
//         </p>
//       </motion.div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {rawCourses.map((course, index) => (
//           <motion.div
//             key={`leaderboard-${leaderboardTab}`}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.3 }}
//           >
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-slate-50 text-left">
//                   <tr>
//                     <th className="p-4 text-sm font-medium text-slate-500">Rank</th>
//                     <th className="p-4 text-sm font-medium text-slate-500">User</th>
//                     <th className="p-4 text-sm font-medium text-slate-500 text-right">
//                       {leaderboardTab === "streak" ? "Current Streak" : "XP"}
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-200">
//                   {leaderboardData[leaderboardTab] && leaderboardData[leaderboardTab].length > 0 ? (
//                     leaderboardData[leaderboardTab].map((userData, index) => {
//                       // Check if this is the current user
//                       const isCurrentUser = userData.username === userProfile?.username;
                      
//                       return (
//                         <motion.tr 
//                           key={userData.userId}
//                           initial={{ opacity: 0, y: 10 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           transition={{ delay: index * 0.05 }}
//                           className={`hover:bg-slate-50 transition-colors ${isCurrentUser ? "bg-blue-50" : ""}`}
//                         >
//                           <td className="p-4">
//                             <div className="flex items-center">
//                               {index < 3 ? (
//                                 <div className={`h-7 w-7 rounded-full flex items-center justify-center ${
//                                   index === 0 ? "bg-yellow-100 text-yellow-600" :
//                                   index === 1 ? "bg-slate-200 text-slate-600" :
//                                   "bg-amber-100 text-amber-600"
//                                 }`}>
//                                   <Medal className="h-4 w-4" />
//                                 </div>
//                               ) : (
//                                 <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
//                                   {index + 1}
//                                 </div>
//                               )}
//                             </div>
//                           </td>
//                           <td className="p-4">
//                             <div className="flex items-center">
//                               <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-medium mr-3">
//                                 {userData.firstName?.charAt(0) || '?'}{userData.lastName?.charAt(0) || '?'}
//                               </div>
//                               <div>
//                                 <div className="font-medium text-slate-800 flex items-center">
//                                   {userData.firstName || 'User'} {userData.lastName || ''}
//                                   {isCurrentUser && (
//                                     <span className="ml-2 text-xs bg-blue-100 text-blue-600 py-0.5 px-1.5 rounded-full">You</span>
//                                   )}
//                                 </div>
//                                 <div className="text-sm text-slate-500">@{userData.username}</div>
//                               </div>
//                             </div>
//                           </td>
//                           <td className="p-4 text-right">
//                             <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-slate-100">
//                               {leaderboardTab === "streak" ? (
//                                 <>
//                                   <Flame className="h-4 w-4 text-orange-500 mr-1.5" />
//                                   <span className="text-slate-800">{userData.currentStreak} days</span>
//                                 </>
//                               ) : (
//                                 <>
//                                   <Star className="h-4 w-4 text-blue-500 mr-1.5" />
//                                   <span className="text-slate-800">{userData.xp.toLocaleString()} XP</span>
//                                 </>
//                               )}
//                             </div>
//                           </td>
//                         </motion.tr>
//                       );
//                     })
//                   ) : (
//                     <tr>
//                       <td colSpan="3" className="p-8 text-center text-slate-500">
//                         No leaderboard data available yet
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
            
//             <div className="p-4 bg-slate-50 text-center">
//               <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors">
//                 View full leaderboard
//               </button>
//             </div>
//           </motion.div>
          
//         )}
//         </div>
//       </AnimatePresence>
//     </motion.div>
//   </motion.div>
// );


  // Stats cards component
  const StatsCards = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
    >
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100">Total XP</p>
            <h3 className="text-3xl font-bold mt-1">{userProfile?.xp || 0}</h3>
          </div>
          <div className="p-2 bg-white/20 rounded-lg">
            <Star className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6 bg-white/20 h-2 rounded-full overflow-hidden">
          <div className="bg-white h-full rounded-full" style={{ width: `${userProfile?.levelProgress || 65}%` }}></div>
        </div>
        <p className="text-sm mt-2 text-blue-100">{userProfile?.levelProgress || 65}% to next level</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500">Courses Started</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-800">
              {userProfile?.completedCourses?.length || 10}
            </h3>
          </div>
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Book className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm mt-6 text-blue-600 font-medium">View all courses</p>
      </motion.div>
      
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-500">Current Streak</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-800">{userProfile?.currentStreak || 0}</h3>
          </div>
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <Flame className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm mt-6 text-blue-600 font-medium cursor-pointer">
          Keep learning daily
        </p>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      {/* HEADER */}
      <Navbar2 />

      {/* MAIN CONTENT */}
      <main className="pt-32 md:pt-32 pb-16 px-6 md:px-8 max-w-screen-xl mx-auto">
        <AnimatePresence mode="wait">

        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="w-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div className="inline-block mb-3">
                <div className="flex items-center">
                  <div className="h-0.5 w-10 bg-blue-600 mr-3"></div>
                  <span className="text-blue-600 font-medium">Your Learning Dashboard</span>
                </div>
              </motion.div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                  Welcome back, <span className="relative">
                    <span className="relative z-10">{userProfile?.username}</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 z-0"></span>
                  </span>
                </h1>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.2
                  }}
                >
                  <a 
                    href="/generate-course"
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white text-md font-medium rounded-md shadow-sm relative overflow-hidden"
                    style={{
                      background: "linear-gradient(45deg, #3b82f6, #2563eb)"
                    }}
                  >
                    <motion.div 
                      className="absolute inset-0 w-full h-full"
                      animate={{
                        background: [
                          "linear-gradient(45deg, #3b82f6, #2563eb)", 
                          "linear-gradient(45deg, #2563eb, #4f46e5)",
                          "linear-gradient(45deg, #4f46e5, #2563eb)",
                          "linear-gradient(45deg, #2563eb, #3b82f6)"
                        ]
                      }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="relative z-10">Generate New Course</span>
                  </a>
                </motion.div>
              </div>
                    
              <p className="text-lg text-slate-600 mb-8 max-w-2xl">
                Continue your learning journey, explore new courses, or chat with your AI tutor to enhance your skills.
              </p>
            </motion.div>
          </div>
                    
          {/* Stats Cards Section */}
          <StatsCards />
          
          {/* Leaderboard Section */}
          <Leaderboard />                       
          {/* Suggested Courses Section */}
        </motion.div>

        </AnimatePresence>
      </main>

      {/* FOOTER */}
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
}

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

// Simple icon components for activity feed
const CheckIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
</svg>
);

const PlayIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
</svg>
);

const TrophyIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.795.077 1.584.24 2.287.491a.75.75 0 11-.574 1.385c-.708-.25-1.466-.4-2.212-.465V6.75a2.75 2.75 0 01-2.75 2.75h-2.5A2.75 2.75 0 016 6.75v-3zm7.5 3V3.75A1.25 1.25 0 0012.25 2.5h-2.5A1.25 1.25 0 008.5 3.75v3a1.25 1.25 0 001.25 1.25h2.5A1.25 1.25 0 0013.5 6.75z" clipRule="evenodd" />
  <path d="M12.78 15.81l-3.214-4.018a.75.75 0 00-1.173 0L5.18 15.81a.75.75 0 001.173.938l2.147-2.683v3.684a.75.75 0 001.5 0v-3.684l2.147 2.683a.75.75 0 001.173-.938z" />
</svg>
);