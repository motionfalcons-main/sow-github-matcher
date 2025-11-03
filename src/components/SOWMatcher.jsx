import React, { useState, useEffect } from 'react';
import { FileText, Github, Search, Upload, CheckCircle, XCircle, AlertCircle, Key, ExternalLink, File, FileType, FileImage, Star, Calendar, Code, Loader2, Download, Copy, RefreshCw } from 'lucide-react';

const SOWMatcher = () => {
  const [sowFile, setSowFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [githubKeywords, setGithubKeywords] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('openai'); // 'claude' or 'openai'
  const [matchingResults, setMatchingResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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
        setFileContent(e.target.result);
      };
      reader.readAsText(file);
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

  // GitHub API Functions
  const searchGitHubRepositories = async (keywords) => {
    try {
      setIsSearchingGitHub(true);
      setApiError('');
      
      const query = encodeURIComponent(keywords);
      const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=20`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SOW-GitHub-Matcher'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter out archived repos and repos not updated in last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const filteredRepos = data.items
        .filter(repo => !repo.archived && new Date(repo.updated_at) > sixMonthsAgo)
        .slice(0, 10)
        .map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || 'No description available',
          stars: repo.stargazers_count,
          language: repo.language || 'Unknown',
          url: repo.html_url,
          topics: repo.topics || [],
          updatedAt: repo.updated_at,
          readme: null
        }));

      setGithubProjects(filteredRepos);
      return filteredRepos;
    } catch (error) {
      console.error('GitHub API Error:', error);
      setApiError(error.message);
      throw error;
    } finally {
      setIsSearchingGitHub(false);
    }
  };

  const fetchReadmeForRepo = async (owner, repo) => {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'SOW-GitHub-Matcher'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return 'No README available';
        }
        throw new Error(`Failed to fetch README: ${response.status}`);
      }

      const readmeContent = await response.text();
      // Limit to first 3000 characters to save API costs
      return readmeContent.substring(0, 3000) + (readmeContent.length > 3000 ? '...' : '');
    } catch (error) {
      console.error(`Error fetching README for ${owner}/${repo}:`, error);
      return 'No README available';
    }
  };

  const fetchAllReadmes = async (projects) => {
    setIsFetchingReadmes(true);
    setReadmeProgress({ current: 0, total: projects.length });
    
    const projectsWithReadmes = [];
    
    for (let i = 0; i < projects.length; i++) {
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

      const response = await fetch(`${API_BASE_URL}/analyze-sow/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sowContent })
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
    setComparisonProgress({ current: 0, total: projects.length });
    
    const projectsWithComparisons = [];
    
    for (let i = 0; i < projects.length; i++) {
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
    setIsComparingProjects(false);
    return projectsWithComparisons;
  };

  // OpenAI API Functions - Now using backend
  const analyzeSOWWithOpenAI = async (sowContent) => {
    try {
      setIsAnalyzingSOW(true);
      setApiError('');

      const response = await fetch(`${API_BASE_URL}/analyze-sow/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sowContent })
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
    setComparisonProgress({ current: 0, total: projects.length });
    
    const projectsWithComparisons = [];
    
    for (let i = 0; i < projects.length; i++) {
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
    const sampleContent = `Project: Astrology AI Web Application

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

    setFileContent(sampleContent);
    setGithubKeywords('astrology AI horoscope prediction');
    
    // Create a mock file object
    const mockFile = new File([sampleContent], 'sample_sow.txt', { type: 'text/plain' });
    setSowFile(mockFile);
  };

  const analyzeMatch = async () => {
    const errors = {};
    
    if (!sowFile) {
      errors.file = 'Please upload a SOW file';
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

      // Step 3: Analyze SOW with selected AI provider
      const sowAnalysis = selectedProvider === 'claude' 
        ? await analyzeSOWWithClaude(fileContent)
        : await analyzeSOWWithOpenAI(fileContent);

      // Step 4: Compare each project with SOW requirements
      const projectsWithComparisons = selectedProvider === 'claude'
        ? await compareAllProjects(projectsWithReadmes, sowAnalysis)
        : await compareAllProjectsWithOpenAI(projectsWithReadmes, sowAnalysis);

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
          <div className="flex items-center mb-4">
            <Loader2 className={`w-6 h-6 animate-spin mr-3 ${selectedProvider === 'claude' ? 'text-indigo-600' : 'text-green-600'}`} />
            <h3 className="font-bold text-gray-900">
              {isSearchingGitHub && 'Searching GitHub...'}
              {isFetchingReadmes && `Fetching READMEs...`}
              {isAnalyzingSOW && 'Analyzing SOW...'}
              {isComparingProjects && 'Comparing Projects...'}
              {isGeneratingReport && 'Generating Report...'}
            </h3>
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            SOW-GitHub Project Matcher
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Upload your Statement of Work (SOW) document and search keywords to find matching GitHub projects with AI-powered analysis.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SOW File Upload */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-600" />
                SOW Document Upload
              </h3>
              
              {/* Drag and Drop Zone */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-lg text-gray-700 mb-2 font-medium">
                  {dragActive ? 'Drop your file here' : 'Drag & drop your SOW file here'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports .txt, .pdf, .docx files
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
                  className="cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Choose File
                </label>
                
                {/* File Info Display */}
                {sowFile && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(sowFile.type)}
                        <div>
                          <p className="font-medium text-green-800">{sowFile.name}</p>
                          <p className="text-sm text-green-600">{formatFileSize(sowFile.size)}</p>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                )}
                
                {/* File Content Preview */}
                {fileContent && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Extracted Content Preview:</h4>
                    <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {fileContent.substring(0, 300)}...
                    </div>
                  </div>
                )}
                
                {validationErrors.file && (
                  <p className="text-red-600 text-sm mt-2 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {validationErrors.file}
                  </p>
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
          </div>

          {/* Analyze Button */}
          <div className="mt-8 text-center">
            <button
              onClick={analyzeMatch}
              disabled={isLoading || !sowFile || !githubKeywords.trim()}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {githubProjects.map((project) => (
                  <div key={project.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors"
                          >
                            {project.name}
                          </a>
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      </div>
                    </div>
                    
                    {/* Project Stats */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        <span className="text-sm font-medium">{project.stars.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tech Stack - Prominent Display */}
                    <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Code className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="text-sm font-bold text-purple-900">Tech Stack</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full font-medium">
                          {project.language}
                        </span>
                        {project.topics.slice(0, 4).map((topic) => (
                          <span 
                            key={topic} 
                            className="px-3 py-1 bg-white border border-purple-300 text-purple-700 text-sm rounded-full font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                        {project.topics.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{project.topics.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* README Preview */}
                    {project.readme && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">README Preview:</h4>
                        <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                          {project.readme}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* Results Section */}
        {matchingResults && (
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOWMatcher;
