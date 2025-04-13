"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Pause, Video, Check } from "lucide-react";

/**
 * Enhanced VideoProgressTracker component integrated with the new term-based progress API
 * Now includes direct submission option without tracking
 * 
 * @param {Object} props
 * @param {string|number} props.moduleId - The ID of the module
 * @param {number} props.termIndex - The index of the term this video belongs to
 * @param {string} props.videoUrl - The URL of the video
 * @param {boolean} props.isCompleted - Whether the video is already completed
 * @param {Function} props.onComplete - Callback when video is completed
 * @param {Function} props.onProgressUpdate - Callback when progress is updated
 * @param {Object} props.resourceProgress - Progress information for this resource
 */
export default function VideoProgressTracker({ 
  moduleId, 
  termIndex,
  videoUrl,
  isCompleted = false,
  onComplete,
  onProgressUpdate,
  resourceProgress = {}
}) {
  const [completed, setCompleted] = useState(isCompleted);
  const [isUpdating, setIsUpdating] = useState(false);
  const [watchPercentage, setWatchPercentage] = useState(resourceProgress.videoProgress || 0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  
  // Set initial state from props if provided
  useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  // Extract video ID from YouTube URL
  const extractVideoId = useCallback((url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  // Handle marking video as completed (with progress tracking)
  const handleMarkAsCompleted = useCallback(async () => {
    if (completed || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Call API through the parent component
      if (onComplete) {
        await onComplete();
      }
      
      // Update local state
      setCompleted(true);
      setWatchPercentage(100);
    } catch (error) {
      console.error("Error marking video as completed:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [completed, isUpdating, onComplete]);

  // Handle direct submission without progress tracking
  const handleDirectSubmit = useCallback(async () => {
    if (completed || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Call API through the parent component
      if (onComplete) {
        await onComplete();
      }
      
      // Update local state
      setCompleted(true);
      setWatchPercentage(100);
    } catch (error) {
      console.error("Error directly completing video:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [completed, isUpdating, onComplete]);

  // Format time to MM:SS
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  // Start progress tracking interval
  const startProgressTracking = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        if (duration > 0) {
          // Update watch time
          setWatchTime(Math.round(currentTime));
          
          // Calculate percentage
          const percentage = Math.min(100, Math.round((currentTime / duration) * 100));
          
          // Only update if percentage changed significantly
          if (Math.abs(percentage - watchPercentage) >= 5) {
            setWatchPercentage(percentage);
            
            // Send progress update to parent component
            if (onProgressUpdate) {
              onProgressUpdate(percentage);
            }
            
            // Auto-complete at 90%
            if (percentage >= 90 && !completed && onComplete) {
              handleMarkAsCompleted();
            }
          }
        }
      } catch (error) {
        console.error("Error tracking video progress:", error);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);
  }, [watchPercentage, completed, onComplete, onProgressUpdate, handleMarkAsCompleted]);

  // Stop progress tracking
  const stopProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Set up YouTube Player
  useEffect(() => {
    // Only set up if not already completed
    if (completed || playerInitialized) return;

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      console.error("Invalid YouTube video URL");
      return;
    }

    // Create a direct iframe instead of using the API
    // This avoids cross-origin issues in development
    const createDirectIframe = () => {
      if (!containerRef.current) return;
      
      // Clean container
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      
      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.id = `youtube-player-${videoId}`;
      iframe.width = "100%";
      iframe.height = "400px";
      iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&controls=1&rel=0`;
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      
      // Append to container
      containerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
      
      return iframe;
    };

    // Create YouTube API script tag if it doesn't exist
    const loadYouTubeAPI = () => {
      return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
          resolve(window.YT);
          return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onload = () => {
          // Wait for the global YT object to be defined
          const checkYT = () => {
            if (window.YT && window.YT.Player) {
              resolve(window.YT);
            } else {
              setTimeout(checkYT, 100);
            }
          };
          checkYT();
        };
        tag.onerror = reject;
        
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      });
    };

    // Player state change handler
    const onPlayerStateChange = (event) => {
      if (!event || !event.data) return;
      
      const YT = window.YT;
      if (!YT) return;
      
      switch (event.data) {
        case YT.PlayerState.PLAYING:
          setVideoPlaying(true);
          startProgressTracking();
          break;
        case YT.PlayerState.PAUSED:
          setVideoPlaying(false);
          stopProgressTracking();
          break;
        case YT.PlayerState.BUFFERING:
          setVideoPlaying(true);
          stopProgressTracking();
          break;
        case YT.PlayerState.ENDED:
          setVideoPlaying(false);
          stopProgressTracking();
          if (!completed && onComplete) {
            handleMarkAsCompleted();
          }
          break;
        default:
          // Unknown state
          break;
      }
    };

    // Player ready handler
    const onPlayerReady = (event) => {
      console.log("YouTube player is ready");
      setPlayerInitialized(true);
    };

    // Initialize player
    const initializePlayer = async () => {
      try {
        // Ensure YouTube API is loaded
        const YT = await loadYouTubeAPI();
        
        // Create iframe directly first
        const iframe = createDirectIframe();
        
        // Wait a moment for the iframe to load
        setTimeout(() => {
          // Destroy existing player if any
          if (playerRef.current) {
            try {
              playerRef.current.destroy();
            } catch (destroyError) {
              console.warn("Error destroying previous player:", destroyError);
            }
          }
          
          try {
            // Create new player with explicit origin
            playerRef.current = new YT.Player(iframe, {
              events: {
                'onStateChange': onPlayerStateChange,
                'onReady': onPlayerReady
              },
              playerVars: {
                'origin': window.location.origin,
                'enablejsapi': 1,
                'rel': 0
              }
            });
          } catch (error) {
            console.error("Error initializing YouTube player:", error);
          }
        }, 300);
      } catch (error) {
        console.error("Error setting up YouTube player:", error);
      }
    };

    // Start initialization
    initializePlayer();

    // Cleanup function
    return () => {
      // Stop tracking
      stopProgressTracking();
      
      // Destroy player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.warn("Error destroying player:", error);
        }
      }
    };
  }, [
    completed, 
    playerInitialized,
    videoUrl, 
    extractVideoId, 
    onComplete, 
    startProgressTracking, 
    stopProgressTracking, 
    handleMarkAsCompleted
  ]);

  // If already completed, just show the completed status
  if (completed) {
    return (
      <div className="mt-4 mb-2 flex items-center justify-center">
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg py-3 px-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Video completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
      {/* Video container (visible) */}
      <div ref={containerRef} className="w-full mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
          <Play className="h-4 w-4" />
          Watch Time: {formatTime(watchTime)}
        </span>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={videoPlaying ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-500"}
          >
            {videoPlaying ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Playing
              </>
            ) : watchPercentage > 0 ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Paused
              </>
            ) : (
              <>
                <Video className="h-3 w-3 mr-1" />
                Not started
              </>
            )}
          </Badge>
          <Badge className="bg-indigo-100 text-indigo-800 border-none">
            {watchPercentage}%
          </Badge>
        </div>
      </div>
      
      <Progress 
        value={watchPercentage} 
        className="h-2 bg-gray-200 dark:bg-gray-700 mb-4" 
      />
      
      <div className="flex justify-center gap-3 flex-wrap">
        {/* Traditional progress-based button */}
        <Button
          onClick={handleMarkAsCompleted}
          className={`${
            watchPercentage >= 90 
              ? "bg-indigo-600 hover:bg-indigo-700" 
              : "bg-gray-400 hover:bg-gray-500"
          } text-white`}
          disabled={watchPercentage < 90 || isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Video as Watched
            </>
          )}
        </Button>
        
        {/* Direct submission button */}
        <Button
          onClick={handleDirectSubmit}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Complete Directly
            </>
          )}
        </Button>
      </div>
      
      {watchPercentage < 90 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Watch at least 90% of the video to use the progress-based completion, or click "Complete Directly" to mark as completed right away.
          </p>
        </div>
      )}
    </div>
  );
}