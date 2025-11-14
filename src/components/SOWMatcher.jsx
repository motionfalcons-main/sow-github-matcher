import React, { useState, useEffect } from 'react';
import { FileText, Github, Search, Upload, CheckCircle, XCircle, AlertCircle, Key, ExternalLink, File, FileType, FileImage, Star, Calendar, Code, Loader2, Download, Copy, RefreshCw, DollarSign, Server, Bookmark, Square } from 'lucide-react';
import SaveToCollectionButton from './SaveToCollectionButton';
import CursorPromptGenerator from './CursorPromptGenerator';
import CollectionsPage from './CollectionsPage';
import SmartRecommendations from './SmartRecommendations';

const SOWMatcher = () => {
  const [sowFile, setSowFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [githubKeywords, setGithubKeywords] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai'); // 'claude' or 'openai'
  const [matchingResults, setMatchingResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReadmes, setExpandedReadmes] = useState({}); // Track which READMEs are expanded
  const [expandedFeatures, setExpandedFeatures] = useState({}); // Track which feature lists are expanded
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [githubProjects, setGithubProjects] = useState([]);
  const [isSearchingGitHub, setIsSearchingGitHub] = useState(false);
  const [isFetchingReadmes, setIsFetchingReadmes] = useState(false);
  const [readmeProgress, setReadmeProgress] = useState({ current: 0, total: 0 });
  const [apiError, setApiError] = useState('');
  const [sowAnalysis, setSowAnalysis] = useState(null);
  const [projectComparisons, setProjectComparisons] = useState([]);
  const [isAnalyzingSOW, setIsAnalyzingSOW] = useState(false);
  const [isComparingProjects, setIsComparingProjects] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState({ current: 0, total: 0 });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [shouldCancel, setShouldCancel] = useState(false);

  // Load saved provider preference
  useEffect(() => {
    const savedProvider = localStorage.getItem('selected-provider');
    if (savedProvider) {
      setSelectedProvider(savedProvider);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selected-provider', selectedProvider);
  }, [selectedProvider]);

  // Backend API base URL - uses environment variable in production, or relative path if same domain
  const API_BASE_URL = import.meta.env.VITE_API_URL || (
    window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api'
  );

  // Helper function to clean Unicode characters from text - only keep basic ASCII
  const cleanText = (text) => {
    if (!text) return text;
    if (typeof text !== 'string') return text;
    
    let cleaned = text;
    // Remove ALL non-ASCII characters (only keep 0-127)
    cleaned = cleaned.replace(/[^\x00-\x7F]/g, '');
    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Remove multiple consecutive spaces
    cleaned = cleaned.replace(/  +/g, ' ');
    
    return cleaned;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      setValidationErrors(prev => ({
        ...prev,
        file: 'Please upload a .txt, .pdf, or .docx file'
      }));
      return;
    }

    setSowFile(file);
    setValidationErrors(prev => ({ ...prev, file: '' }));

    // Extract text content based on file type
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        // Clean all Unicode characters using helper
        content = cleanText(content);
        setFileContent(content);
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      // For PDF and DOCX, we'll simulate content extraction
      setFileContent(`Sample extracted content from ${file.name}:\n\nThis is a simulated extraction of text content from the uploaded file. In a real implementation, you would use libraries like pdf-parse for PDF files or mammoth for DOCX files to extract the actual text content.`);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleKeywordsChange = (event) => {
    const value = event.target.value;
    if (value.length <= 200) {
      setGithubKeywords(value);
      setValidationErrors(prev => ({ ...prev, keywords: '' }));
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') return <FileImage className="w-5 h-5" />;
    if (fileType === 'text/plain') return <FileText className="w-5 h-5" />;
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return <FileType className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // GitHub API Functions - Now using backend proxy
  const searchGitHubRepositories = async (keywords) => {
    try {
      setIsSearchingGitHub(true);
      setApiError('');
      
      console.log('Searching GitHub with keywords:', keywords);
      console.log('API Base URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/search-github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keywords })
      });

      console.log('GitHub search response status:', response.status);

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `GitHub API error: ${response.status}`;
          console.error('GitHub search error response:', errorData);
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('GitHub search response data:', data);
      const filteredRepos = data.repositories || [];

      if (filteredRepos.length === 0) {
        console.warn('No repositories returned from search');
        setApiError('No repositories found. Try different search keywords or check if your search terms are too specific.');
        // Don't throw error, just return empty array so user can see the message
        setGithubProjects([]);
        return [];
      }

      setGithubProjects(filteredRepos);
      return filteredRepos;
    } catch (error) {
      console.error('GitHub API Error:', error);
      const errorMessage = error.message || 'Failed to search GitHub repositories. Please check your connection and try again.';
      setApiError(errorMessage);
      throw error;
    } finally {
      setIsSearchingGitHub(false);
    }
  };

  const fetchReadmeForRepo = async (owner, repo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/fetch-readme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ owner, repo })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return 'No README available';
        }
        const error = await response.json();
        throw new Error(error.error || `Failed to fetch README: ${response.status}`);
      }

      const data = await response.json();
      return data.readme || 'No README available';
    } catch (error) {
      console.error(`Error fetching README for ${owner}/${repo}:`, error);
      return 'No README available';
    }
  };

  const fetchAllReadmes = async (projects) => {
    setIsFetchingReadmes(true);
    setShouldCancel(false);
    setReadmeProgress({ current: 0, total: projects.length });
    
    const projectsWithReadmes = [];
    
    for (let i = 0; i < projects.length; i++) {
      // Check for cancellation
      if (shouldCancel) {
        setIsFetchingReadmes(false);
        setGithubProjects(projectsWithReadmes);
        return projectsWithReadmes;
      }
      
      const project = projects[i];
      const [owner, repo] = project.fullName.split('/');
      
      setReadmeProgress({ current: i + 1, total: projects.length });
      
      const readme = await fetchReadmeForRepo(owner, repo);
      projectsWithReadmes.push({
        ...project,
        readme
      });
      
      // Add small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setGithubProjects(projectsWithReadmes);
    setIsFetchingReadmes(false);
    return projectsWithReadmes;
  };

  // Claude AI Functions - Now using backend
  const analyzeSOWWithClaude = async (sowContent) => {
    try {
      setIsAnalyzingSOW(true);
      setApiError('');

      // Clean content before sending
      const cleanedContent = cleanText(sowContent);

      const response = await fetch(`${API_BASE_URL}/analyze-sow/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sowContent: cleanedContent })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Claude API error: ${response.status}`);
      }

      const analysis = await response.json();
      setSowAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('Claude SOW Analysis Error:', error);
      setApiError(`SOW Analysis failed: ${error.message}`);
      throw error;
    } finally {
      setIsAnalyzingSOW(false);
    }
  };

  const compareProjectWithClaude = async (project, sowAnalysis) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compare-project/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project, sowAnalysis })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Claude API error: ${response.status}`);
      }

      const comparison = await response.json();
      return {
        ...project,
        comparison
      };
    } catch (error) {
      console.error(`Claude Project Comparison Error for ${project.name}:`, error);
      // Return project with default comparison on error
      return {
        ...project,
        comparison: {
          compatibilityScore: 0,
          matchingFeatures: [],
          missingFeatures: [],
          technologyAlignment: "low",
          strengths: [],
          weaknesses: ["Analysis failed"],
          recommendation: "Unable to analyze this project",
          effortToAdapt: "high"
        }
      };
    }
  };

  const compareAllProjects = async (projects, sowAnalysis) => {
    setIsComparingProjects(true);
    setShouldCancel(false);
    setComparisonProgress({ current: 0, total: projects.length });
    
    const projectsWithComparisons = [];
    
    for (let i = 0; i < projects.length; i++) {
      // Check for cancellation
      if (shouldCancel) {
        setIsComparingProjects(false);
        // Sort what we have so far
        projectsWithComparisons.sort((a, b) => b.comparison.compatibilityScore - a.comparison.compatibilityScore);
        setProjectComparisons(projectsWithComparisons);
        setGithubProjects(projectsWithComparisons);
        return projectsWithComparisons;
      }
      
      const project = projects[i];
      
      setComparisonProgress({ current: i + 1, total: projects.length });
      
      const projectWithComparison = await compareProjectWithClaude(project, sowAnalysis);
      projectsWithComparisons.push(projectWithComparison);
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Sort by compatibility score (highest first)
    projectsWithComparisons.sort((a, b) => b.comparison.compatibilityScore - a.comparison.compatibilityScore);
    
    setProjectComparisons(projectsWithComparisons);
    setGithubProjects(projectsWithComparisons); // Update the main projects list with comparisons
    setIsComparingProjects(false);
    return projectsWithComparisons;
  };

  // OpenAI API Functions - Now using backend
  const analyzeSOWWithOpenAI = async (sowContent) => {
    try {
      setIsAnalyzingSOW(true);
      setApiError('');

      // Clean content before sending
      const cleanedContent = cleanText(sowContent);

      const response = await fetch(`${API_BASE_URL}/analyze-sow/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sowContent: cleanedContent })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `OpenAI API error: ${response.status}`);
      }

      const analysis = await response.json();
      setSowAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('OpenAI SOW Analysis Error:', error);
      setApiError(`SOW Analysis failed: ${error.message}`);
      throw error;
    } finally {
      setIsAnalyzingSOW(false);
    }
  };

  const compareProjectWithOpenAI = async (project, sowAnalysis) => {
    try {
      const response = await fetch(`${API_BASE_URL}/compare-project/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project, sowAnalysis })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `OpenAI API error: ${response.status}`);
      }

      const comparison = await response.json();
      return {
        ...project,
        comparison
      };
    } catch (error) {
      console.error(`OpenAI Project Comparison Error for ${project.name}:`, error);
      // Return project with default comparison on error
      return {
        ...project,
        comparison: {
          compatibilityScore: 0,
          matchingFeatures: [],
          missingFeatures: [],
          technologyAlignment: "low",
          strengths: [],
          weaknesses: ["Analysis failed"],
          recommendation: "Unable to analyze this project",
          effortToAdapt: "high"
        }
      };
    }
  };

  const compareAllProjectsWithOpenAI = async (projects, sowAnalysis) => {
    setIsComparingProjects(true);
    setShouldCancel(false);
    setComparisonProgress({ current: 0, total: projects.length });
    
    const projectsWithComparisons = [];
    
    for (let i = 0; i < projects.length; i++) {
      // Check for cancellation
      if (shouldCancel) {
        setIsComparingProjects(false);
        // Sort what we have so far
        projectsWithComparisons.sort((a, b) => b.comparison.compatibilityScore - a.comparison.compatibilityScore);
        setProjectComparisons(projectsWithComparisons);
        setGithubProjects(projectsWithComparisons);
        return projectsWithComparisons;
      }
      
      const project = projects[i];
      
      setComparisonProgress({ current: i + 1, total: projects.length });
      
      const projectWithComparison = await compareProjectWithOpenAI(project, sowAnalysis);
      projectsWithComparisons.push(projectWithComparison);
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Sort by compatibility score (highest first)
    projectsWithComparisons.sort((a, b) => b.comparison.compatibilityScore - a.comparison.compatibilityScore);
    
    setProjectComparisons(projectsWithComparisons);
    setGithubProjects(projectsWithComparisons); // Update the main projects list with comparisons
    setIsComparingProjects(false);
    return projectsWithComparisons;
  };

  const generateFinalReport = (projectsWithComparisons, sowAnalysis) => {
    setIsGeneratingReport(true);
    
    // Calculate statistics
    const scores = projectsWithComparisons.map(p => p.comparison.compatibilityScore);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestMatch = projectsWithComparisons[0];
    const highlyCompatible = projectsWithComparisons.filter(p => p.comparison.compatibilityScore >= 70);
    
    const report = {
      averageCompatibility: Math.round(averageScore),
      bestMatch: bestMatch,
      highlyCompatibleCount: highlyCompatible.length,
      totalProjects: projectsWithComparisons.length,
      sowAnalysis: sowAnalysis,
      projects: projectsWithComparisons
    };
    
    setMatchingResults(report);
    setIsGeneratingReport(false);
    return report;
  };

  // Report Generation Functions
  const generateReportText = (report) => {
    const currentDate = new Date().toLocaleString();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    let reportText = `===================================
SOW TO GITHUB PROJECT ANALYSIS REPORT
Generated: ${currentDate}
===================================

📋 SOW SUMMARY
--------------
Project Type: ${report.sowAnalysis.projectType}
Domain: ${report.sowAnalysis.domain}
Complexity: ${report.sowAnalysis.complexity}
Key Features Required: ${report.sowAnalysis.mainFeatures.join(', ')}
Technologies Needed: ${report.sowAnalysis.technologies.join(', ')}

🎯 ANALYSIS OVERVIEW
--------------------
Total Projects Analyzed: ${report.totalProjects}
Average Compatibility: ${report.averageCompatibility}%
Best Match: ${report.bestMatch.name} (${report.bestMatch.comparison.compatibilityScore}%)
Highly Compatible Projects: ${report.highlyCompatibleCount}

🏆 TOP 5 MATCHING PROJECTS
===========================

`;

    // Add top 5 projects
    report.projects.slice(0, 5).forEach((project, index) => {
      reportText += `#${index + 1}. ${project.name} - ${project.comparison.compatibilityScore}%
Repository: ${project.url}
Stars: ${project.stars.toLocaleString()} | Language: ${project.language}

✅ Matching Features:
`;

      project.comparison.matchingFeatures.forEach(feature => {
        reportText += `   • ${feature}\n`;
      });

      reportText += `
❌ Missing Features:
`;

      project.comparison.missingFeatures.forEach(feature => {
        reportText += `   • ${feature}\n`;
      });

      reportText += `
💡 Recommendation:
${project.comparison.recommendation}

🔧 Effort to Adapt: ${project.comparison.effortToAdapt}
Technology Alignment: ${project.comparison.technologyAlignment}

`;

      // Add Render Deployment Cost if available
      if (project.comparison.renderDeployment) {
        reportText += `💰 Render Deployment Estimate:
Estimated Monthly Cost: ${project.comparison.renderDeployment.estimatedMonthlyCost}
`;
        
        if (project.comparison.renderDeployment.services && project.comparison.renderDeployment.services.length > 0) {
          reportText += `Required Services: ${project.comparison.renderDeployment.services.join(', ')}\n`;
        }
        
        if (project.comparison.renderDeployment.reasoning) {
          reportText += `Reasoning: ${project.comparison.renderDeployment.reasoning}\n`;
        }
        
        if (project.comparison.renderDeployment.costBreakdown) {
          reportText += `Cost Breakdown:\n`;
          Object.entries(project.comparison.renderDeployment.costBreakdown).forEach(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
            reportText += `  - ${formattedKey}: ${value}\n`;
          });
        }
      }

      reportText += `
---

`;
    });

    reportText += `📊 DETAILED COMPARISON TABLE
=============================
Rank | Project | Score | Stars | Effort | Tech Match
-----|---------|-------|-------|--------|------------
`;

    report.projects.forEach((project, index) => {
      const rank = (index + 1).toString().padStart(2);
      const name = project.name.length > 20 ? project.name.substring(0, 17) + '...' : project.name.padEnd(20);
      const score = project.comparison.compatibilityScore.toString().padStart(2);
      const stars = project.stars.toLocaleString().padStart(6);
      const effort = project.comparison.effortToAdapt.padEnd(6);
      const techMatch = project.comparison.technologyAlignment.padEnd(10);
      
      reportText += `${rank}    | ${name} | ${score}%  | ${stars} | ${effort} | ${techMatch}\n`;
    });

    reportText += `
💼 IMPLEMENTATION RECOMMENDATIONS
==================================
Best Starting Point: ${report.bestMatch.name}
Reason: ${report.bestMatch.comparison.recommendation}

Alternative Options:
`;

    report.projects.slice(1, 4).forEach((project, index) => {
      reportText += `${index + 1}. ${project.name} - ${project.comparison.recommendation}\n`;
    });

    reportText += `
Key Modifications Needed:
`;

    const allMissingFeatures = report.projects.flatMap(p => p.comparison.missingFeatures);
    const uniqueMissingFeatures = [...new Set(allMissingFeatures)];
    uniqueMissingFeatures.slice(0, 5).forEach(feature => {
      reportText += `- ${feature}\n`;
    });

    reportText += `
Estimated Development Time: ${report.sowAnalysis.estimatedTimeline}

⚠️ RISKS & CONSIDERATIONS
==========================
- Technology stack compatibility may require significant adaptation
- Missing features will need custom development
- Integration complexity varies by project architecture
- Consider licensing and maintenance requirements

===================================
END OF REPORT
===================================`;

    return reportText;
  };

  const downloadReport = () => {
    if (!matchingResults) return;
    
    const reportText = generateReportText(matchingResults);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `SOW_Analysis_Report_${timestamp}.txt`;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!matchingResults) return;
    
    const reportText = generateReportText(matchingResults);
    
    try {
      await navigator.clipboard.writeText(reportText);
      // You could add a toast notification here
      alert('Report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  const loadSampleSOW = () => {
    let sampleContent = `Project: Astrology AI Web Application

Requirements:
- Generate personalized daily horoscopes using AI
- Birth chart calculation based on date, time, location
- Compatibility matching between zodiac signs
- User authentication and profile management
- Mobile responsive design
- Integration with planetary position APIs

Technologies: Python/Node.js backend, React frontend, PostgreSQL database

Timeline: 3-4 months
Budget: $15,000`;

    // Clean any Unicode characters using helper
    sampleContent = cleanText(sampleContent);

    setFileContent(sampleContent);
    setGithubKeywords('astrology AI horoscope prediction');
    
    // Create a mock file object using Blob
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const mockFile = Object.assign(blob, {
      name: 'sample_sow.txt',
      lastModified: Date.now()
    });
    setSowFile(mockFile);
  };

  const analyzeMatch = async () => {
    const errors = {};
    
    if (!sowFile && !fileContent.trim()) {
      errors.file = 'Please upload a SOW file or paste content in the text box';
    }
    if (!githubKeywords.trim()) {
      errors.keywords = 'Please enter GitHub search keywords';
    }
    // API keys are now handled by the backend - no validation needed

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setValidationErrors({});
    setApiError('');
    setShouldCancel(false);
    
    try {
      // Step 1: Search GitHub repositories
      const projects = await searchGitHubRepositories(githubKeywords);
      
      if (projects.length === 0) {
        setApiError('No matching repositories found. Try different keywords.');
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch README files for all projects
      const projectsWithReadmes = await fetchAllReadmes(projects);
      
      // Check if cancelled during README fetching
      if (shouldCancel) {
        setIsLoading(false);
        return;
      }

      // Step 3: Analyze SOW with selected AI provider
      const sowAnalysis = selectedProvider === 'claude' 
        ? await analyzeSOWWithClaude(fileContent)
        : await analyzeSOWWithOpenAI(fileContent);
      
      // Check if cancelled during SOW analysis
      if (shouldCancel) {
        setIsLoading(false);
        return;
      }

      // Step 4: Compare each project with SOW requirements
      const projectsWithComparisons = selectedProvider === 'claude'
        ? await compareAllProjects(projectsWithReadmes, sowAnalysis)
        : await compareAllProjectsWithOpenAI(projectsWithReadmes, sowAnalysis);
      
      // Check if cancelled during comparison
      if (shouldCancel) {
        setIsLoading(false);
        return;
      }

      // Step 5: Generate final report
      await generateFinalReport(projectsWithComparisons, sowAnalysis);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      {/* Floating Progress Indicator */}
      {(isSearchingGitHub || isFetchingReadmes || isAnalyzingSOW || isComparingProjects || isGeneratingReport) && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Loader2 className={`w-6 h-6 animate-spin mr-3 ${selectedProvider === 'claude' ? 'text-indigo-600' : 'text-green-600'}`} />
              <h3 className="font-bold text-gray-900">
                {isSearchingGitHub && 'Searching GitHub...'}
                {isFetchingReadmes && `Fetching READMEs...`}
                {isAnalyzingSOW && 'Analyzing SOW...'}
                {isComparingProjects && 'Comparing Projects...'}
                {isGeneratingReport && 'Generating Report...'}
              </h3>
            </div>
            {(isFetchingReadmes || isComparingProjects) && (
              <button
                onClick={() => {
                  setShouldCancel(true);
                  if (isFetchingReadmes) {
                    setIsFetchingReadmes(false);
                  }
                  if (isComparingProjects) {
                    setIsComparingProjects(false);
                  }
                }}
                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Stop"
              >
                <Square className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {isFetchingReadmes && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Project {readmeProgress.current} of {readmeProgress.total}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(readmeProgress.current / readmeProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {isComparingProjects && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Comparing project {comparisonProgress.current} of {comparisonProgress.total}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(comparisonProgress.current / comparisonProgress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Analyzing compatibility scores & features...
              </p>
            </div>
          )}
          
          {isAnalyzingSOW && (
            <p className="text-xs text-gray-500">
              Using {selectedProvider === 'claude' ? 'Claude AI' : 'OpenAI GPT-4'} to extract requirements...
            </p>
          )}
          
          {isGeneratingReport && (
            <p className="text-xs text-gray-500">
              Finalizing analysis and generating report...
            </p>
          )}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="inline-flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Github className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SOW Project Finder
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setShowCollections(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm flex items-center space-x-2 shadow-lg transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>My Collections</span>
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered GitHub project matching for your Statement of Work
          </p>
          
          {/* Step Indicator */}
          {!matchingResults && (
            <div className="mt-8 flex items-center justify-center space-x-4 max-w-3xl mx-auto">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  fileContent ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {fileContent ? '✓' : '1'}
                </div>
                <span className={`text-sm font-medium ${fileContent ? 'text-green-600' : 'text-blue-600'}`}>
                  Add SOW
                </span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  githubKeywords.trim() ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {githubKeywords.trim() ? '✓' : '2'}
                </div>
                <span className={`text-sm font-medium ${githubKeywords.trim() ? 'text-green-600' : 'text-gray-500'}`}>
                  Search Keywords
                </span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-sm text-gray-600">
                  3
                </div>
                <span className="text-sm font-medium text-gray-500">Analyze</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Input Section */}
        {!matchingResults && (
          <div className="space-y-6 mb-8">
            {/* Step 1: SOW Input */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Add Your Statement of Work</h3>
                </div>
                <p className="text-blue-100 text-sm mt-2 ml-11">Upload a file or paste your SOW content directly</p>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File Upload Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Option 1: Upload File</h4>
                    </div>
              
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {!sowFile ? (
                        <>
                          <File className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                          <p className="text-sm text-gray-700 mb-1 font-medium">
                            {dragActive ? 'Drop your file here' : 'Drag & drop file'}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            .txt, .pdf, .docx
                          </p>
                          <input
                            type="file"
                            accept=".txt,.pdf,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="sow-upload"
                          />
                          <label
                            htmlFor="sow-upload"
                            className="inline-block cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                          >
                            Choose File
                          </label>
                        </>
                      ) : (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(sowFile.type)}
                            <div className="flex-1 text-left">
                              <p className="font-medium text-green-800 text-sm">{sowFile.name}</p>
                              <p className="text-xs text-green-600">{formatFileSize(sowFile.size)}</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Text Input Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Option 2: Paste Content</h4>
                    </div>
                    
                    <textarea
                      placeholder="Paste your SOW content here...&#10;&#10;Example:&#10;Project: AI Analytics Dashboard&#10;&#10;Requirements:&#10;- Real-time data viz&#10;- User auth & roles&#10;- API integrations&#10;&#10;Tech: React, Node.js&#10;Timeline: 3 months"
                      value={fileContent}
                      onChange={(e) => {
                        const content = cleanText(e.target.value);
                        setFileContent(content);
                        if (content.trim()) {
                          const blob = new Blob([content], { type: 'text/plain' });
                          const mockFile = Object.assign(blob, {
                            name: 'pasted_sow.txt',
                            lastModified: Date.now()
                          });
                          setSowFile(mockFile);
                          setValidationErrors(prev => ({ ...prev, file: '' }));
                        } else {
                          setSowFile(null);
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-xs"
                      rows={10}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {fileContent.length > 0 ? `${fileContent.length} characters` : 'Type or paste here'}
                      </span>
                      <button
                        onClick={loadSampleSOW}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Load Sample</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Error Display */}
                {validationErrors.file && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 text-sm font-medium">{validationErrors.file}</p>
                  </div>
                )}
                
                {/* Content Preview */}
                {fileContent && fileContent.length > 100 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Content Loaded Successfully
                    </h4>
                    <div className="text-xs text-blue-700 max-h-24 overflow-y-auto bg-white p-2 rounded">
                      {fileContent.substring(0, 200)}...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GitHub Keywords and API Key */}
            <div className="space-y-6">
              {/* GitHub Keywords */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <Github className="w-6 h-6 mr-3 text-purple-600" />
                  GitHub Search Keywords
                </h3>
                <div className="space-y-3">
                  <textarea
                    placeholder="e.g., astrology AI, horoscope prediction, mystical"
                    value={githubKeywords}
                    onChange={handleKeywordsChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Describe the type of projects you're looking for
                    </p>
                    <span className={`text-sm font-medium ${githubKeywords.length > 180 ? 'text-red-500' : 'text-gray-500'}`}>
                      {githubKeywords.length}/200
                    </span>
                  </div>
                  {validationErrors.keywords && (
                    <p className="text-red-600 text-sm flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      {validationErrors.keywords}
                    </p>
                  )}
                </div>
              </div>

              {/* API Provider Selection */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
                  <Key className="w-6 h-6 mr-3 text-indigo-600" />
                  AI Provider Selection
                </h3>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="provider"
                        value="claude"
                        checked={selectedProvider === 'claude'}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">Claude (Anthropic)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="provider"
                        value="openai"
                        checked={selectedProvider === 'openai'}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-gray-700">OpenAI (GPT-4)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* API keys are now configured in the backend .env file */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> API keys are securely configured on the backend server. 
                  No need to enter them here!
                </p>
              </div>
            </div>

            {/* Analyze Button */}
          <div className="mt-8 text-center">
            <button
              onClick={analyzeMatch}
              disabled={isLoading || (!sowFile && !fileContent.trim()) || !githubKeywords.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
            >
              <Search className="w-6 h-6 mr-3 inline" />
              {isLoading ? `Analyzing with ${selectedProvider === 'claude' ? 'Claude' : 'OpenAI'}...` : 'Analyze & Find Projects'}
            </button>
            
            {/* Validation Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Please fix the following issues:</p>
                <ul className="text-red-700 text-sm mt-2 space-y-1">
                  {Object.values(validationErrors).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sample SOW Button */}
            <div className="mt-6 text-center">
              <button
                onClick={loadSampleSOW}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center mx-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Sample SOW
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Try with sample astrology AI project data
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Smart Recommendations - Show after analysis */}
        {matchingResults && githubProjects.length > 0 && githubProjects[0].comparison && (
          <SmartRecommendations projects={githubProjects} sowAnalysis={sowAnalysis} />
        )}

        {/* GitHub Projects Section */}
        {(isSearchingGitHub || isFetchingReadmes || githubProjects.length > 0) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {isSearchingGitHub ? 'Searching GitHub...' : 
               isFetchingReadmes ? 'Fetching Project Details...' : 
               'Found GitHub Projects'}
            </h2>
            
            {/* Loading States */}
            {isSearchingGitHub && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
                <p className="text-lg text-gray-600">Searching GitHub repositories...</p>
              </div>
            )}
            
            {isFetchingReadmes && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto text-purple-600 animate-spin mb-4" />
                <p className="text-lg text-gray-600">
                  Fetching project {readmeProgress.current} of {readmeProgress.total}...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(readmeProgress.current / readmeProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Error Display */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center">
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">API Error</h3>
                    <p className="text-red-700 mt-1">{apiError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Projects Grid */}
            {githubProjects.length > 0 && !isSearchingGitHub && !isFetchingReadmes && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {githubProjects.map((project) => {
                  const hasComparison = project.comparison;
                  const score = hasComparison ? project.comparison.compatibilityScore : null;
                  const isHighMatch = score >= 70;
                  const isMediumMatch = score >= 50 && score < 70;
                  
                  return (
                  <div key={project.id} className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col h-full ${
                    hasComparison 
                      ? isHighMatch 
                        ? 'border-2 border-green-400' 
                        : isMediumMatch 
                        ? 'border-2 border-yellow-400' 
                        : 'border-2 border-gray-300'
                      : 'border-2 border-gray-200 hover:border-blue-300'
                  }`}>
                    {/* Compatibility Score Banner */}
                    {hasComparison && (
                      <div className={`px-4 py-2 text-center font-bold text-sm ${
                        isHighMatch 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                          : isMediumMatch 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}>
                        🎯 {score}% Match {isHighMatch && '✨'}
                      </div>
                    )}
                    
                    {/* Project Header */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b-2 border-gray-100">
                      <h3 className="text-base font-bold text-gray-900 mb-1.5 h-12 flex items-center">
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors line-clamp-2"
                        >
                          {project.name}
                        </a>
                      </h3>
                      <p className="text-gray-600 text-xs line-clamp-2 h-8">{project.description}</p>
                    </div>
                    
                    {/* Project Stats */}
                    <div className="px-4 py-2 bg-gray-50 flex items-center justify-between text-xs border-b border-gray-200">
                      <div className="flex items-center text-gray-700">
                        <Star className="w-3.5 h-3.5 mr-1 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{project.stars.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        <span className="text-xs">
                          {new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tech Stack */}
                    <div className="p-4 flex-1 bg-white">
                      <div className="flex items-center mb-2">
                        <Code className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                        <span className="text-xs font-bold text-purple-900">Technologies</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs rounded-full font-semibold">
                          {project.language}
                        </span>
                        {project.topics.slice(0, 4).map((topic) => (
                          <span 
                            key={topic} 
                            className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-full font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                        {project.topics.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            +{project.topics.length - 4}
                          </span>
                        )}
                      </div>
                      
                      {/* AI Comparison Results */}
                      {hasComparison && (
                        <div className="mt-3 space-y-2">
                          {/* Matching Features */}
                          {project.comparison.matchingFeatures && project.comparison.matchingFeatures.length > 0 && (
                            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center mb-1">
                                <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                <span className="text-xs font-bold text-green-900">Matching Features ({project.comparison.matchingFeatures.length})</span>
                              </div>
                              <div className="space-y-0.5">
                                {(expandedFeatures[`${project.id}-matching`] 
                                  ? project.comparison.matchingFeatures 
                                  : project.comparison.matchingFeatures.slice(0, 2)
                                ).map((feature, idx) => (
                                  <div key={idx} className="text-xs text-green-700 pl-4">• {feature}</div>
                                ))}
                                {project.comparison.matchingFeatures.length > 2 && (
                                  <button
                                    onClick={() => setExpandedFeatures(prev => ({
                                      ...prev,
                                      [`${project.id}-matching`]: !prev[`${project.id}-matching`]
                                    }))}
                                    className="text-xs text-green-600 hover:text-green-700 font-medium pl-4 mt-1 flex items-center space-x-1"
                                  >
                                    <span>
                                      {expandedFeatures[`${project.id}-matching`] 
                                        ? '▼ Show less' 
                                        : `▶ Show ${project.comparison.matchingFeatures.length - 2} more`
                                      }
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Missing Features */}
                          {project.comparison.missingFeatures && project.comparison.missingFeatures.length > 0 && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center mb-1">
                                <XCircle className="w-3 h-3 text-red-600 mr-1" />
                                <span className="text-xs font-bold text-red-900">Missing Features ({project.comparison.missingFeatures.length})</span>
                              </div>
                              <div className="space-y-0.5">
                                {(expandedFeatures[`${project.id}-missing`] 
                                  ? project.comparison.missingFeatures 
                                  : project.comparison.missingFeatures.slice(0, 2)
                                ).map((feature, idx) => (
                                  <div key={idx} className="text-xs text-red-700 pl-4">• {feature}</div>
                                ))}
                                {project.comparison.missingFeatures.length > 2 && (
                                  <button
                                    onClick={() => setExpandedFeatures(prev => ({
                                      ...prev,
                                      [`${project.id}-missing`]: !prev[`${project.id}-missing`]
                                    }))}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium pl-4 mt-1 flex items-center space-x-1"
                                  >
                                    <span>
                                      {expandedFeatures[`${project.id}-missing`] 
                                        ? '▼ Show less' 
                                        : `▶ Show ${project.comparison.missingFeatures.length - 2} more`
                                      }
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Render Deployment Cost */}
                          {project.comparison.renderDeployment && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center">
                                  <DollarSign className="w-3 h-3 text-blue-600 mr-1" />
                                  <span className="text-xs font-bold text-blue-900">Render Cost</span>
                                </div>
                                <span className="text-xs font-bold text-blue-700">{project.comparison.renderDeployment.estimatedMonthlyCost}</span>
                              </div>
                              {project.comparison.renderDeployment.services && project.comparison.renderDeployment.services.length > 0 && (
                                <div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(expandedFeatures[`${project.id}-services`] 
                                      ? project.comparison.renderDeployment.services 
                                      : project.comparison.renderDeployment.services.slice(0, 3)
                                    ).map((service, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                        {service}
                                      </span>
                                    ))}
                                  </div>
                                  {project.comparison.renderDeployment.services.length > 3 && (
                                    <button
                                      onClick={() => setExpandedFeatures(prev => ({
                                        ...prev,
                                        [`${project.id}-services`]: !prev[`${project.id}-services`]
                                      }))}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 flex items-center space-x-1"
                                    >
                                      <span>
                                        {expandedFeatures[`${project.id}-services`] 
                                          ? '▼ Show less' 
                                          : `▶ Show ${project.comparison.renderDeployment.services.length - 3} more`
                                        }
                                      </span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Recommendation */}
                          {project.comparison.recommendation && (
                            <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-700">
                                <span className="font-bold">💡 </span>{project.comparison.recommendation}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* README Expandable Section */}
                      {project.readme && project.readme.length > 50 && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedReadmes(prev => ({
                              ...prev,
                              [project.id]: !prev[project.id]
                            }))}
                            className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-1.5">
                              <File className="w-3 h-3 text-gray-600" />
                              <span className="text-xs font-semibold text-gray-700">README</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {expandedReadmes[project.id] ? '▼ Collapse' : '▶ Expand'}
                            </span>
                          </button>
                          
                          {expandedReadmes[project.id] && (
                            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                              <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                                {project.readme.substring(0, 1000)}
                                {project.readme.length > 1000 && '...'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer - Actions */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-t-2 border-gray-100 space-y-2">
                      <div className="flex items-center space-x-2">
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>GitHub</span>
                        </a>
                        <SaveToCollectionButton project={project} />
                      </div>
                      
                      {/* Cursor Prompt Generator - Only show if has comparison */}
                      {hasComparison && sowAnalysis && (
                        <CursorPromptGenerator 
                          project={project} 
                          sowAnalysis={sowAnalysis}
                          compatibilityData={project.comparison}
                        />
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}



        {/* Results Section - Now shown in cards above, keeping only summary */}
        {matchingResults && false && (
          <div className="space-y-8">
            {/* Overall Match Score */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Analysis Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {matchingResults.averageCompatibility}%
                  </div>
                  <p className="text-lg text-gray-600">Average Compatibility</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {matchingResults.highlyCompatibleCount}
                  </div>
                  <p className="text-lg text-gray-600">Highly Compatible Projects</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    {matchingResults.totalProjects}
                  </div>
                  <p className="text-lg text-gray-600">Total Projects Analyzed</p>
                </div>
              </div>
              
              {/* Best Match */}
              {matchingResults.bestMatch && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    Best Match Project
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        <a 
                          href={matchingResults.bestMatch.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors flex items-center"
                        >
                          {matchingResults.bestMatch.name}
                          <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                        </a>
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">{matchingResults.bestMatch.description}</p>
                      
                      {/* Tech Stack */}
                      <div className="flex items-center space-x-2 mt-2">
                        <Code className="w-4 h-4 text-purple-600" />
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                            {matchingResults.bestMatch.language}
                          </span>
                          {matchingResults.bestMatch.topics && matchingResults.bestMatch.topics.slice(0, 3).map((topic) => (
                            <span 
                              key={topic} 
                              className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={matchingResults.bestMatch.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-right hover:scale-110 transition-transform cursor-pointer ml-4"
                    >
                      <div className="text-3xl font-bold text-green-600">
                        {matchingResults.bestMatch.comparison.compatibilityScore}%
                      </div>
                      <p className="text-sm text-gray-600">Click to visit →</p>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Download Report Buttons */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Download Report</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={downloadReport}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Report (.txt)
                </button>
                <button
                  onClick={copyToClipboard}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copy to Clipboard
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                Download a comprehensive analysis report or copy to clipboard for sharing
              </p>
            </div>

            {/* SOW Analysis */}
            {matchingResults.sowAnalysis && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">SOW Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Overview</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Type:</span> {matchingResults.sowAnalysis.projectType}</p>
                      <p><span className="font-medium">Domain:</span> {matchingResults.sowAnalysis.domain}</p>
                      <p><span className="font-medium">Complexity:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          matchingResults.sowAnalysis.complexity === 'high' ? 'bg-red-100 text-red-700' :
                          matchingResults.sowAnalysis.complexity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {matchingResults.sowAnalysis.complexity}
                        </span>
                      </p>
                      <p><span className="font-medium">Timeline:</span> {matchingResults.sowAnalysis.estimatedTimeline}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Requirements</h3>
                    <div className="space-y-1">
                      {matchingResults.sowAnalysis.keyRequirements.map((req, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Main Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchingResults.sowAnalysis.mainFeatures.map((feature, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchingResults.sowAnalysis.technologies.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Project Rankings */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Project Rankings</h2>
              <div className="space-y-4">
                {matchingResults.projects.map((project, index) => (
                  <div key={project.id} className={`p-6 rounded-xl border-2 transition-all ${
                    project.comparison.compatibilityScore >= 70 
                      ? 'border-green-200 bg-gradient-to-r from-green-50 to-blue-50' 
                      : project.comparison.compatibilityScore >= 50
                      ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50'
                      : 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          project.comparison.compatibilityScore >= 70 ? 'bg-green-600' :
                          project.comparison.compatibilityScore >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            <a 
                              href={project.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 transition-colors flex items-center"
                            >
                              {project.name}
                              <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                            </a>
                          </h3>
                          <p className="text-gray-600 text-sm">{project.description}</p>
                          
                          {/* Tech Stack - Inline */}
                          <div className="flex items-center space-x-2 mt-2">
                            <Code className="w-4 h-4 text-purple-600" />
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                                {project.language}
                              </span>
                              {project.topics && project.topics.slice(0, 3).map((topic) => (
                                <span 
                                  key={topic} 
                                  className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-right hover:scale-110 transition-transform cursor-pointer"
                      >
                        <div className={`text-3xl font-bold ${
                          project.comparison.compatibilityScore >= 70 ? 'text-green-600' :
                          project.comparison.compatibilityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {project.comparison.compatibilityScore}%
                        </div>
                        <p className="text-sm text-gray-600">Click to visit →</p>
                        {project.comparison.compatibilityScore >= 70 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium block mt-1">
                            Highly Compatible
                          </span>
                        )}
                      </a>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Matching Features</h4>
                        <div className="space-y-1">
                          {project.comparison.matchingFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Missing Features</h4>
                        <div className="space-y-1">
                          {project.comparison.missingFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                              <XCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Recommendation:</span> {project.comparison.recommendation}
                      </p>
                    </div>
                    
                    {/* Render Deployment Cost */}
                    {project.comparison.renderDeployment && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Server className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="font-semibold text-gray-900">Render Deployment Estimate</h4>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Estimated Monthly Cost:</span>
                            <span className="text-lg font-bold text-blue-600 flex items-center">
                              <DollarSign className="w-4 h-4" />
                              {project.comparison.renderDeployment.estimatedMonthlyCost}
                            </span>
                          </div>
                          
                          {project.comparison.renderDeployment.services && project.comparison.renderDeployment.services.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-700">Required Services:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.comparison.renderDeployment.services.map((service, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {project.comparison.renderDeployment.reasoning && (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Why:</span> {project.comparison.renderDeployment.reasoning}
                              </p>
                            </div>
                          )}
                          
                          {project.comparison.renderDeployment.costBreakdown && (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <p className="text-xs font-medium text-gray-700 mb-1">Cost Breakdown:</p>
                              <div className="space-y-1">
                                {Object.entries(project.comparison.renderDeployment.costBreakdown).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs text-gray-600">
                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Collections Modal */}
        {showCollections && (
          <CollectionsPage onClose={() => setShowCollections(false)} />
        )}
      </div>
    </div>
  );
};

export default SOWMatcher;
