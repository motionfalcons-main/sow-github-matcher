/**
 * Generates a Cursor AI setup prompt for a GitHub project
 * Includes SOW context, compatibility analysis, and step-by-step instructions
 */

export function generateCursorPrompt(project, sowAnalysis, compatibilityData) {
  // Safe defaults for missing data
  const safeCompatibilityData = compatibilityData || {};
  const safeSowAnalysis = sowAnalysis || {};
  
  const gaps = safeCompatibilityData.missingFeatures || [];
  const matches = safeCompatibilityData.matchingFeatures || [];
  const renderCost = safeCompatibilityData.renderDeployment?.estimatedMonthlyCost || 'Unknown';
  
  // Safe project data
  const projectUrl = project.url || project.html_url || '#';
  const projectName = project.name || project.full_name || 'Unknown Project';
  const projectStars = project.stars || project.stargazers_count || 0;
  const projectLanguage = project.language || 'Unknown';
  
  const prompt = `# 🚀 PROJECT SETUP GUIDE

## Project: ${projectName}
Repository: ${projectUrl}
Stars: ${projectStars} ⭐
Language: ${projectLanguage}

---

## 📋 CONTEXT
I'm using this project as a boilerplate for a client project. Here are the requirements:

**Client SOW Requirements:**
${safeSowAnalysis.mainFeatures?.map(f => `- ${f}`).join('\n') || 'No features specified'}

**Tech Stack Required:**
${safeSowAnalysis.technologies?.join(', ') || 'Not specified'}

**Project Type:** ${safeSowAnalysis.projectType || 'Not specified'}
**Complexity:** ${safeSowAnalysis.complexity || 'Not specified'}
**Timeline:** ${safeSowAnalysis.estimatedTimeline || 'Not specified'}

---

## 🎯 COMPATIBILITY ANALYSIS
This boilerplate has a **${safeCompatibilityData.compatibilityScore || 0}/100 compatibility score** with my SOW.

**What Already Exists:**
${matches.map(m => `✅ ${m}`).join('\n') || '✅ No matching features identified'}

**What Needs to Be Added:**
${gaps.map(g => `❌ ${g}`).join('\n') || '❌ All features already present'}

**Deployment Estimate:**
💰 Render Cost: ${renderCost}/month
${safeCompatibilityData.renderDeployment?.services?.map(s => `- ${s}`).join('\n') || ''}

---

## 🔧 SETUP STEPS

### Step 1: Clone and Analyze
\`\`\`bash
git clone ${projectUrl}
cd ${projectName}
\`\`\`

### Step 2: REBRANDING - CRITICAL (Do This First!)
**⚠️ IMPORTANT: You MUST completely rebrand this project to avoid any claims that this is the original project.**

Before making any other changes, you need to:

1. **Change All UI Names and Branding:**
   - Search and replace all project names, app names, and brand names throughout the codebase
   - Update all visible text in the UI (titles, headers, footers, navigation)
   - Change logo files, favicon, and any brand assets
   - Update meta tags, page titles, and SEO content
   - Modify package.json, README.md, and all documentation

2. **Remove/Replace All Credits:**
   - Remove or replace all copyright notices
   - Update author names and attribution
   - Change "About" pages, footer credits, and acknowledgments
   - Remove original project references and links
   - Update license files if applicable

3. **Update Configuration Files:**
   - Change app names in package.json, manifest.json, config files
   - Update environment variable names if they reference the original project
   - Modify build configuration and deployment settings

4. **Search for Original Project References:**
   - Use find/replace across the entire codebase for:
     - Original project name
     - Original author/creator names
     - Original repository URLs
     - Original domain names
     - Any other identifying information

**This rebranding is essential to ensure the project is clearly your own work and not a copy of the original.**

### Step 3: Environment Setup
- Create a \`.env\` file
- Add required environment variables
- Check README for specific configuration needs

### Step 4: Install Dependencies
\`\`\`bash
${projectLanguage === 'JavaScript' ? 'npm install' : 
  projectLanguage === 'TypeScript' ? 'npm install' :
  projectLanguage === 'Python' ? 'pip install -r requirements.txt' : 
  projectLanguage === 'Java' ? 'mvn install' :
  'See README for installation instructions'}
\`\`\`

### Step 5: Run Development Server
\`\`\`bash
${projectLanguage === 'JavaScript' || projectLanguage === 'TypeScript' ? 'npm run dev' : 
  projectLanguage === 'Python' ? 'python app.py' :
  'See README for run instructions'}
\`\`\`

---

## 🤖 AI ASSISTANCE NEEDED

Please help me with the following:

1. **Rebranding Assistance (Priority #1)**
   - Identify all files containing original project names, branding, or credits
   - Provide a comprehensive list of strings to search and replace
   - Help update UI components with new branding
   - Ensure no original project references remain

2. **Analyze Project Structure**
   - Identify the main entry points
   - Map out the folder structure
   - Locate where I should add new features

3. **Feature Implementation**
   For each missing feature, provide:
   - Where to add the code (specific files)
   - What files to create/modify
   - Dependencies to install
   - Code examples and best practices
   - Estimated implementation time

4. **Integration Requirements**
   ${safeSowAnalysis.technologies?.length > 0 ? `- How to integrate ${safeSowAnalysis.technologies.join(', ')}` : ''}
   - Best practices for this tech stack
   - Security considerations
   - Performance optimization tips

5. **Deployment Preparation**
   - Verify Render deployment compatibility
   - Identify any deployment blockers
   - Configure environment variables
   - Database setup (if needed)

---

## 📊 PRIORITY TASKS

${generatePriorityTasks(gaps)}

---

## 💡 RECOMMENDATIONS

${safeCompatibilityData.recommendation || 'No specific recommendations provided'}

---

**START WITH REBRANDING**: First, help me identify and replace all original project names, UI text, credits, and branding elements. Then proceed with analyzing the project structure and implementing the missing features. Focus on the highest priority items first.
`;

  return prompt;
}

function generatePriorityTasks(gaps) {
  if (!gaps || gaps.length === 0) {
    return '✅ No additional features needed - project is ready to use!';
  }
  
  return gaps.map((gap, index) => {
    const priority = index < 2 ? '🔴 HIGH' : index < 4 ? '🟡 MEDIUM' : '🟢 LOW';
    return `${priority}: Implement "${gap}"`;
  }).join('\n');
}

export function generateQuickPrompt(project) {
  return `I want to use the GitHub project "${project.name}" (${project.url}) as a starting point. 

Please:
1. Analyze its structure
2. Explain how to set it up locally
3. Identify the main components and architecture
4. Show me where to add custom features

Tech Stack: ${project.language}
Stars: ${project.stars} ⭐`;
}

