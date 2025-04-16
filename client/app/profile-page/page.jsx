"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Linkedin, 
  Edit2, 
  Calendar, 
  Book, 
  ChevronRight,
  Star,
  Save,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';

import Navbar2 from '@/components/Navbar2';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth , getStreaKWithAuth } from '@/lib/api'; // Assuming this is your API utility
import ProtectedRoute from '@/components/ProtectedRoute';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { user } = useAuth(); // Get the authenticated user from context
  const [streakDays, setStreakDays] = useState(0);

  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    linkedinUrl: '',
    bio: 'Passionate learner and developer interested in AI, web technologies, and continuous education.',
    location: 'San Francisco, CA'
  });

  // Fetch user profile
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        if (!user) return;
        console.log("Fetching user profile");
        
        setLoading(true);
        const response = await fetchWithAuth('/users/profile');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        setUserProfile(data);
        
        // Update profile data with API response
        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
          email: data.email || '',
          linkedinUrl: data.linkedinUrl || '',
          bio: 'Passionate learner and developer interested in AI, web technologies, and continuous education.',
          location: 'San Francisco, CA'
        });
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

    checkStreak();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetchWithAuth('/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          linkedinUrl: profileData.linkedinUrl,
          // Note: username and email might not be editable in your system
          // Include only if they should be editable
          // username: profileData.username,
          // email: profileData.email,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedData = await response.json();
      setUserProfile(updatedData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Could not update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const AchievementCard = ({ icon, title, date, description }) => (
    <motion.div 
      variants={itemVariants}
      className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{date}</p>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
      </div>
    </motion.div>
  );

  const EditableField = ({ label, name, value, type = "text", disabled = false }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
        />
      ) : (
        <div className="p-2 bg-slate-50 rounded-md text-slate-800">
          {value || 'Not provided'}
        </div>
      )}
    </div>
  );

  if (isLoading && !isLoaded) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !userProfile) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4 flex justify-center">
            <AlertCircle className="h-16 w-16" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Profile</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen font-sans bg-gradient-to-b from-slate-50 to-white">
      <Navbar2/>
      
      {/* MAIN CONTENT */}
      <main className="pt-32 md:pt-32 pb-16 px-6 md:px-8 max-w-screen-xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </p>
            <button 
              onClick={() => setError(null)} 
              className="text-sm underline hover:no-underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key="profile"
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
                    <span className="text-blue-600 font-medium">Your Profile</span>
                  </div>
                </motion.div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                    <span className="relative">
                      <span className="relative z-10">{userProfile?.firstName + "'s" || 'Your'} Profile</span>
                      <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 z-0"></span>
                    </span>
                  </h1>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
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
                    {/* <button 
                      onClick={() => isEditing ? handleSubmit() : setIsEditing(true)}
                      disabled={isLoading}
                      className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md shadow-sm relative overflow-hidden disabled:opacity-70"
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
                      {isEditing ? (
                        <>
                          <Save className="h-5 w-5 mr-2 relative z-10" />
                          <span className="relative z-10">
                            {isLoading ? "Saving..." : "Save Profile"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-5 w-5 mr-2 relative z-10" />
                          <span className="relative z-10">Edit Profile</span>
                        </>
                      )}
                    </button> */}
                  </motion.div>
                </div>
                
                <p className="text-lg text-slate-600 mb-8 max-w-2xl">
                  Manage your profile information and view your learning achievements.
                </p>
              </motion.div>
            </div>
            
            {/* Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Information */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:col-span-2 space-y-6"
              >
                {/* Profile Card */}
                <motion.div 
                  variants={itemVariants}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200"
                >
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                  </div>
                  
                  <div className="p-6">
  <form onSubmit={handleSubmit}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <EditableField 
        label="First Name" 
        name="firstName" 
        value={profileData.firstName} 
      />
      <EditableField 
        label="Last Name" 
        name="lastName" 
        value={profileData.lastName} 
      />
    </div>
    
    <EditableField 
      label="Username" 
      name="username" 
      value={profileData.username}
      disabled={true} // Username typically not editable
    />
    
    <EditableField 
      label="Email Address" 
      name="email" 
      value={profileData.email} 
      type="email"
      disabled={true} // Email typically not editable
    />
    
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
      <div className="flex items-center">
        {isEditing ? (
          <input
            type="url"
            name="linkedinUrl"
            value={profileData.linkedinUrl}
            onChange={handleInputChange}
            className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        ) : (
          <div className="flex-grow p-2 bg-slate-50 rounded-md text-slate-800 truncate">
            {profileData.linkedinUrl || "Not provided"}
          </div>
        )}
        
        {profileData.linkedinUrl && !isEditing && (
          <a 
            href={profileData.linkedinUrl.startsWith('http') ? profileData.linkedinUrl : `https://${profileData.linkedinUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
            </svg>
            Visit
          </a>
        )}
      </div>
    </div>
    
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
      {isEditing ? (
        <textarea
          name="bio"
          value={profileData.bio}
          onChange={handleInputChange}
          rows="4"
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        ></textarea>
      ) : (
        <div className="p-2 bg-slate-50 rounded-md text-slate-800 min-h-[100px]">
          {profileData.bio}
        </div>
      )}
    </div>
    
    {isEditing && (
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="mr-4 px-4 py-2 text-slate-600 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-70"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    )}
  </form>
</div>
                </motion.div>
                
                {/* Level Progress Card */}
                <motion.div 
                  variants={itemVariants}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200"
                >
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Learning Progress</h3>
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <span className="text-sm text-slate-500">Current Level</span>
                          <h2 className="text-3xl font-bold text-blue-600">{userProfile?.level || 1}</h2>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-slate-500">Total XP</span>
                          <p className="text-xl font-semibold text-slate-700">{userProfile?.xp || 0} XP</p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
                        <div 
                          className="bg-blue-600 h-4 rounded-full" 
                          style={{ width: `${userProfile?.levelProgress || 0}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Progress: {userProfile?.levelProgress || 0}%</span>
                        <span>Next Level: {userProfile?.nextLevelXPRequirement || 100} XP required</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-orange-400 to-red-400 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Activity className="h-5 w-5  text-blue-600 mr-2" />
                          <h3 className="font-semibold text-white">Current Streak</h3>
                        </div>
                        <div className="flex items-baseline ">
                          <span className="text-2xl font-bold text-white mr-1">{streakDays || 0}</span>
                          <span className="text-slate-200">days</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-semibold text-slate-800">Longest Streak</h3>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-blue-600 mr-1">{userProfile?.maxStreak || 0}</span>
                          <span className="text-slate-600">days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Achievements Section */}
                
              </motion.div>
              
              {/* Right Column - Stats & Info */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Account Info Card */}
                <motion.div 
                  variants={itemVariants}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200"
                >
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Account Summary</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Last Activity</p>
                        <p className="font-medium text-slate-800">
                          {userProfile?.lastActivityDate 
                            ? new Date(userProfile.lastActivityDate).toLocaleDateString() 
                            : 'No recent activity'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4">
                        <Book className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Courses Completed</p>
                        <p className="font-medium text-slate-800">{userProfile?.completedCourses?.length || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4">
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total XP</p>
                        <p className="font-medium text-slate-800">{userProfile?.xp || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Current Streak</p>
                        <p className="font-medium text-slate-800">{userProfile?.currentStreak || 0} days</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
               
                
                {/* Skills Card */}
                
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER would go here */}
    </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;