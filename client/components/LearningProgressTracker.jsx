import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Trophy, 
  Brain, 
  CheckCircle2, 
  BarChart3, 
  Clock,
  Star 
} from 'lucide-react';

const LearningProgressTracker = ({ courseData }) => {
  // State for tracking course progress
  const [moduleProgress, setModuleProgress] = useState([]);
  const [topicProficiency, setTopicProficiency] = useState([]);
  const [overallCompletion, setOverallCompletion] = useState(0);
  const [overallProficiency, setOverallProficiency] = useState(0);
  const [readArticlesCount, setReadArticlesCount] = useState(0);
  const [totalArticlesCount, setTotalArticlesCount] = useState(0);
  
  useEffect(() => {
    // In a real app, this would come from an API or props
    // For demo purposes, we'll generate some realistic progress data
    if (courseData) {
      console.log("Course data received:", courseData);
      generateProgressData(courseData);
    }
  }, [courseData]);
  
  // Debug effect to log state changes
  useEffect(() => {
    console.log(`Progress tracker state updated - Articles: ${readArticlesCount}/${totalArticlesCount}, Completion: ${overallCompletion}%`);
  }, [readArticlesCount, totalArticlesCount, overallCompletion]);
  
  // Track articles that have been read
  useEffect(() => {
    // This effect would normally listen to a global state or localStorage
    // to track which articles have been viewed/read
    
    // For demonstration, we'll simulate this with a mock implementation
    const getReadArticlesFromStorage = () => {
      // In a real app, this would check localStorage or a state management solution
      // like Redux, Zustand, etc.
      
      // For demo, return a mock array of read article IDs
      return [];
    };
    
    const readArticles = getReadArticlesFromStorage();
    setReadArticlesCount(readArticles.length);
    
    // Update completion percentages based on read articles
    if (moduleProgress.length > 0 && readArticles.length > 0) {
      updateCompletionBasedOnReadArticles(readArticles);
    }
  }, [moduleProgress]);
  
  // Listen for article reading events
  useEffect(() => {
    // Function to handle when an article is read/opened
    const handleArticleRead = (event) => {
      if (event.detail && event.detail.articleId) {
        // In a real app, update localStorage or state management
        // For demo, we'll just update our local state
        
        setReadArticlesCount(prevCount => {
          const newCount = prevCount + 1;
          
          // Recalculate completion percentage
          const newCompletionPercentage = Math.round((newCount / totalArticlesCount) * 100);
          setOverallCompletion(newCompletionPercentage);
          
          // Update module progress
          if (event.detail.moduleId) {
            updateModuleCompletionOnArticleRead(event.detail.moduleId, event.detail.articleId);
          }
          
          return newCount;
        });
      }
    };
    
    // Add event listener
    window.addEventListener('articleRead', handleArticleRead);
    
    // Clean up
    return () => {
      window.removeEventListener('articleRead', handleArticleRead);
    };
  }, [totalArticlesCount]);
  
  const updateModuleCompletionOnArticleRead = (moduleId, articleId) => {
    setModuleProgress(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          // Calculate new completion percentage based on articles read in this module
          const moduleArticleCount = module.totalArticles || 1;
          const newReadCount = (module.readArticles || []).includes(articleId) 
            ? module.readArticles.length 
            : module.readArticles.length + 1;
          
          const newCompletionPercentage = Math.round((newReadCount / moduleArticleCount) * 100);
          
          return {
            ...module,
            readArticles: [...(module.readArticles || []), articleId],
            completionPercentage: newCompletionPercentage,
            status: newCompletionPercentage === 100 
              ? "Completed" 
              : "In Progress"
          };
        }
        return module;
      })
    );
  };
  
  const generateProgressData = (course) => {
    if (!course) {
      return;
    }
    
    // Handle either course structure format
    const modules = course.courseStructure?.modules || course.modules || [];
    
    if (modules.length === 0) {
      console.warn("No modules found in course data");
      return;
    }
    
    // Calculate total number of potential articles across all modules
    let totalArticles = 0;
    
    modules.forEach(module => {
      // Estimate number of articles based on learning objectives or concepts
      // Ensure a minimum of 4 articles per module for better visualization
      const articleCount = module.concepts 
        ? module.concepts.length 
        : (module.learningObjectives 
            ? module.learningObjectives.length 
            : 4);  // Default to 4 if no concepts or objectives
      
      totalArticles += articleCount;
    });
    
    console.log(`Total articles calculated: ${totalArticles}`);
    setTotalArticlesCount(Math.max(totalArticles, 10)); // Ensure at least 10 total articles
    
    // Generate module completion data
    const moduleData = modules.map(module => {
      // Calculate number of articles for this module
      // Ensure a minimum of 3 articles per module
      const moduleArticleCount = module.concepts 
        ? module.concepts.length 
        : (module.learningObjectives 
            ? module.learningObjectives.length 
            : 3);
      
      // For demo purposes, generate a fixed number of articles
      // Use either concepts, objectives, or generate sample titles
      const articleTitles = [];
      
      if (module.concepts && module.concepts.length > 0) {
        module.concepts.forEach(concept => {
          articleTitles.push(typeof concept === 'string' ? concept : concept.name || 'Concept Article');
        });
      } else if (module.learningObjectives && module.learningObjectives.length > 0) {
        module.learningObjectives.forEach(objective => {
          // Extract a title from the objective
          const words = objective.split(' ');
          const title = words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
          articleTitles.push(title);
        });
      }
      
      // Ensure we have at least 3 articles by adding generic ones if needed
      while (articleTitles.length < 3) {
        articleTitles.push(`Topic ${articleTitles.length + 1} in ${module.title}`);
      }
      
      // For demo purposes, randomly mark some articles as read
      const readArticles = [];
      
      // Always mark at least 1-2 articles as read for better visualization
      const minRead = Math.floor(Math.random() * 2) + 1; // 1 or 2
      const maxRead = Math.min(articleTitles.length, minRead + Math.floor(Math.random() * 3)); // min+0 to min+2
      
      const readCount = Math.min(maxRead, articleTitles.length);
      
      for (let i = 0; i < readCount; i++) {
        readArticles.push(`${module.moduleId}-article-${i}`);
      }
      
      // Calculate completion based on read articles
      const completionPercentage = Math.round((readArticles.length / moduleArticleCount) * 100);
      
      // Calculate status based on completion
      let status = "Not Started";
      if (completionPercentage === 100) {
        status = "Completed";
      } else if (completionPercentage > 0) {
        status = "In Progress";
      }
      
      return {
        id: module.moduleId,
        title: module.title,
        completionPercentage,
        status,
        lastAccessed: new Date(
          Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        ).toISOString().split('T')[0],
        totalArticles: moduleArticleCount,
        readArticles
      };
    });
    
    // Generate topic proficiency data based on key concepts
    const allConcepts = [];
    modules.forEach(module => {
      if (module.concepts) {
        module.concepts.forEach(concept => {
          allConcepts.push(concept);
        });
      } else if (module.learningObjectives) {
        // If no concepts available, generate from learning objectives
        module.learningObjectives.forEach((objective, index) => {
          // Extract key phrases from objectives to create concept names
          const words = objective.split(' ');
          let conceptName = words.slice(0, 3).join(' ');
          if (conceptName.length < 10 && words.length > 3) {
            conceptName += '...';
          }
          
          allConcepts.push({
            id: `${module.moduleId}-concept-${index}`,
            name: conceptName,
            moduleId: module.moduleId
          });
        });
      }
    });
    
    // Generate proficiency level for each concept
    const proficiencyData = allConcepts.slice(0, 8).map(concept => {
      // Random proficiency level between 0 and 5
      const proficiencyLevel = Math.floor(Math.random() * 6);
      const proficiencyPercentage = proficiencyLevel * 20;
      
      return {
        id: typeof concept === 'string' ? concept : concept.id || Math.random().toString(),
        name: typeof concept === 'string' ? concept : concept.name || 'Unnamed Concept',
        proficiencyLevel,
        proficiencyPercentage,
        moduleId: typeof concept === 'object' ? concept.moduleId : null
      };
    });
    
    // Calculate total number of read articles across all modules
    const totalReadArticles = moduleData.reduce(
      (sum, module) => sum + (module.readArticles ? module.readArticles.length : 0), 
      0
    );
    setReadArticlesCount(totalReadArticles);
    
    // Calculate overall completion percentage based on read articles
    const totalCompletion = totalArticles > 0 
      ? Math.round((totalReadArticles / totalArticles) * 100)
      : 0;
    
    // Calculate overall proficiency
    const totalProficiency = proficiencyData.reduce(
      (sum, topic) => sum + topic.proficiencyPercentage, 
      0
    ) / (proficiencyData.length || 1);
    
    setModuleProgress(moduleData);
    setTopicProficiency(proficiencyData);
    setOverallCompletion(totalCompletion);
    setOverallProficiency(Math.round(totalProficiency));
  };
  
  // Get proficiency level label
  const getProficiencyLabel = (level) => {
    const labels = [
      "Novice", 
      "Beginner", 
      "Intermediate", 
      "Advanced", 
      "Proficient", 
      "Expert"
    ];
    return labels[level] || "Unknown";
  };
  
  // Get color based on completion percentage
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 20) return "bg-amber-500";
    return "bg-gray-300 dark:bg-gray-600";
  };
  
  // Get color based on proficiency level
  const getProficiencyColor = (level) => {
    const colors = [
      "bg-slate-300 dark:bg-slate-600", // Novice
      "bg-blue-300 dark:bg-blue-800",   // Beginner
      "bg-teal-500",                    // Intermediate
      "bg-indigo-500",                  // Advanced
      "bg-purple-500",                  // Proficient
      "bg-amber-500"                    // Expert
    ];
    return colors[level] || colors[0];
  };
  
  return (
    <div className="space-y-8">
      {/* Overall Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course Completion Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                  <Trophy className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">Course Completion</h3>
              </div>
              <div className="flex items-center justify-center text-2xl font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full h-12 w-12">
                {overallCompletion}%
              </div>
            </div>
            
            <Progress value={overallCompletion} className="h-2 mb-3" />
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                <span>{moduleProgress.filter(m => m.status === "Completed").length} Modules Completed</span>
              </div>
              <div>
                <span>{readArticlesCount} of {totalArticlesCount} Articles Read</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Overall Proficiency Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold">Overall Proficiency</h3>
              </div>
              <div className="flex items-center justify-center text-2xl font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full h-12 w-12">
                {overallProficiency}%
              </div>
            </div>
            
            <Progress value={overallProficiency} className="h-2 mb-3 bg-gray-200 dark:bg-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                style={{ width: `${overallProficiency}%` }}
              />
            </Progress>
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1 text-purple-500" />
                <span>{getProficiencyLabel(Math.floor(overallProficiency / 20))} Level</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-amber-500" />
                <span>{Math.floor(overallProficiency / 10)} XP per concept</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
};

export default LearningProgressTracker;