"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useCallback } from "react";

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8007';
/**
 * Controller component for managing key term interactions
 * Acts as a bridge between the UI and the backend APIs
 */
export default function useTermController(moduleId) {
  const [terms, setTerms] = useState([]);
  const [activeTermIndex, setActiveTermIndex] = useState(0);
  const [termContent, setTermContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

 

  // Get all key terms with progress for a module
  const loadTerms = useCallback(async (moduleId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}`,{
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load terms: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.termsAvailable && data.terms) {
        setTerms(data.terms);
        
        // Set active term from response if available
        if (data.activeTermIndex !== undefined && data.activeTermIndex !== null) {
          
          setActiveTermIndex(data.activeTermIndex);
          // Load active term content immediately
          await loadTermContent(moduleId, data.activeTermIndex);
        }
      }
    } catch (error) {
      console.error("Error loading terms:", error);
      toast({
        title: "Error",
        description: "Failed to load key terms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []
)

  useEffect(() => {
    if (moduleId) {
      loadTerms(moduleId);
    }
  }, [moduleId, loadTerms]);

  // Get content for a specific term
  const loadTermContent = useCallback(async (moduleId, termIndex) => {
    try {
      setIsLoading(true);
      setActiveTermIndex(termIndex);
      
      const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}`,{
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
      });
      
      if (!response.ok) {
        // If term is locked, handle gracefully
        if (response.status === 403) {
          toast({
            title: "Term Locked",
            description: "Complete the previous term to unlock this one.",
            variant: "warning",
          });
          return false;
        }
        throw new Error(`Failed to load term content: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTermContent(data);
      return true;
    } catch (error) {
      console.error("Error loading term content:", error);
      toast({
        title: "Error",
        description: "Failed to load term content. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  },[]);

  // Set a term as active
  const setActiveTerm = useCallback(async (moduleId, termIndex) => {
    try {
      // First check if the term is unlocked
      const term = terms.find(t => t.termIndex === termIndex);
      if (term && !term.unlocked) {
        toast({
          title: "Term Locked",
          description: "Complete the previous term to unlock this one.",
          variant: "warning",
        });
        return false;
      }
      
      // Call API to set term as active
      const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}/activate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to set active term: ${response.statusText}`);
      }
      
      // Update local state
      setActiveTermIndex(termIndex);
      
      // Load term content
      return await loadTermContent(moduleId, termIndex);
    } catch (error) {
      console.error("Error setting active term:", error);
      toast({
        title: "Error",
        description: "Failed to set active term. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [terms, loadTermContent]);

  // Generate term content if it doesn't exist
  const generateTermContent = useCallback(async (moduleId, termIndex) => {
    try {
      setIsGenerating(true);
      
      const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate term content: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTermContent(data);
      
      // Update terms list with new unlocked/completed status
      await loadTerms(moduleId);
      
      toast({
        title: "Content Generated",
        description: "Learning materials have been created successfully.",
        variant: "success",
      });
      
      return true;
    } catch (error) {
      console.error("Error generating term content:", error);
      toast({
        title: "Error",
        description: "Failed to generate term content. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  },[loadTerms]);

  // Complete a resource for a term (article, video, quiz)
  const completeResource = useCallback(async (moduleId, termIndex, resourceType) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}/resource/${resourceType}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to complete ${resourceType}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // If the term was completed, check if next term was unlocked
      if (data.termCompleted) {
        toast({
          title: "Term Completed!",
          description: data.nextTermUnlocked ? 
            "You've completed this term and unlocked the next one!" : 
            "You've completed this term!",
          variant: "success",
        });
        
        // Reload terms to get updated status
        await loadTerms(moduleId);
        
        // If the module was completed, show a toast
        if (data.moduleCompleted) {
          toast({
            title: "Module Completed!",
            description: "Congratulations! You've completed all terms in this module.",
            variant: "success",
          });
        }
        
        // If next term was unlocked, auto-navigate to it
        if (data.nextTermUnlocked && data.nextTermIndex !== null) {
          await setActiveTerm(moduleId, data.nextTermIndex);
        }
      } else {
        toast({
          title: "Progress Saved",
          description: `You've completed the ${resourceType}.`,
          variant: "success",
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error completing ${resourceType}:`, error);
      toast({
        title: "Error",
        description: `Failed to mark ${resourceType} as completed. Please try again.`,
        variant: "destructive",
      });
      return null;
    }
  },[loadTerms, setActiveTerm]);

  // Update progress for a resource (for partial completion)
const updateResourceProgress = useCallback(async (moduleId, termIndex, resourceType, percentage) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}/resource/${resourceType}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ percentage }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ${resourceType} progress: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${resourceType} progress:`, error);
    // Don't show a toast for progress updates to avoid spamming the user
    return null;
  }
}, []);

// Complete a quiz with a score
const completeQuiz = useCallback(async (moduleId, termIndex, quizId, score) => {

  console.log("moduleId",moduleId);
  console.log("termIndex",termIndex);
  console.log("quizId",quizId);
  console.log("score",score);
  
  try {
    const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}/quiz/${quizId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ score }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to complete quiz: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If completing the quiz also completed the term
    if (data.termCompleted) {
      toast({
        title: "Term Completed!",
        description: data.nextTermUnlocked ? 
          "You've completed this term and unlocked the next one!" : 
          "You've completed this term!",
        variant: "success",
      });
      
      // Reload terms to get updated status
      await loadTerms(moduleId);
      
      // If next term was unlocked, auto-navigate to it
      if (data.nextTermUnlocked && data.nextTermIndex !== null) {
        await setActiveTerm(moduleId, data.nextTermIndex);
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error completing quiz:", error);
    toast({
      title: "Error",
      description: "Failed to complete quiz. Please try again.",
      variant: "destructive",
    });
    return null;
  }
}, [loadTerms, setActiveTerm]);

// Check if a term is completed
const checkTermCompletion = useCallback(async (moduleId, termIndex) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/terms/module/${moduleId}/term/${termIndex}/check-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check term completion: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If the term was just completed, show a toast
    if (data.termWasJustCompleted) {
      toast({
        title: "Term Completed!",
        description: data.nextTermUnlocked ? 
          "You've completed this term and unlocked the next one!" : 
          "You've completed this term!",
        variant: "success",
      });
      
      // Reload terms to get updated status
      await loadTerms(moduleId);
      
      // If next term was unlocked, auto-navigate to it
      if (data.nextTermUnlocked && data.nextTermIndex !== null) {
        await setActiveTerm(moduleId, data.nextTermIndex);
      }
    }
    
    return data;
  } catch (error) {
    console.error("Error checking term completion:", error);
    return { success: false, termCompleted: false };
  }
}, [loadTerms, setActiveTerm]);

  return {
    terms,
    activeTermIndex,
    termContent,
    isLoading,
    isGenerating,
    loadTerms,
    loadTermContent,
    setActiveTerm,
    generateTermContent,
    completeResource,
    updateResourceProgress,
    completeQuiz,
    checkTermCompletion
  };
}