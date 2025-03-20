"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const BACKEND_URL = "https://9cdc-106-208-148-243.ngrok-free.app";

const VideoPreview = ({ title, url }) => (
  <motion.div
    className="w-full max-w-sm"
    whileHover={{ scale: 1.05 }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center p-2">
        <img
          src={`https://img.youtube.com/vi/${url.split("v=")[1]}/0.jpg`}
          alt={title}
          className="w-full h-auto max-h-44 object-cover rounded-md"
        />
      </CardContent>
      <CardFooter className="flex-shrink-0 justify-center">
        <Button onClick={() => window.open(url, "_blank")}>
          <Play className="mr-2 h-4 w-4" /> Watch
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

const YouTubePreviewDialog = () => {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/youtube?topic=ml`);
        
        console.log(response);
        
        if (response.status !== 200) {
          throw new Error("Failed to fetch videos");
        }
  
        const data = response.data;
        console.log(data);
  
        setVideos(data);
      } catch (err) {
        setError(
          "An error occurred while fetching videos. Please try again later."
        );
        console.error("Error fetching videos:", err);
      } finally {
        setIsLoading(false);
      }
    };
  
    if (open) {
      fetchVideos();
    }
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Show YouTube Previews</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>YouTube Video Previews</DialogTitle>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-items-center">
            {videos.map((video) => (
              <VideoPreview key={video.id} {...video} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default YouTubePreviewDialog;
