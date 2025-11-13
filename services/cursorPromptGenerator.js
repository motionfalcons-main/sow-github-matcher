/**
 * Generates a Cursor AI setup prompt for a GitHub project
 * Includes SOW context, compatibility analysis, and step-by-step instructions
 */

export function generateCursorPrompt(project, sowAnalysis, compatibilityData) {
  const gaps = compatibilityData.missingFeatures || [];
  const matches = compatibilityData.matchingFeatures || [];
  const renderCost = compatibilityData.renderDeployment?.estimatedMonthlyCost || 'Unknown';
  
  const prompt = `# 🚀 PROJECT SETUP GUIDE

## Project: ${project.name}
Repository: ${project.url}
Stars: ${project.stars || 0} ⭐
Language: ${project.language || 'Unknown'}

---

## 📋 CONTEXT
I'm using this project as a boilerplate for a client project. Here are the requirements:

**Client SOW Requirements:**
${sowAnalysis.mainFeatures?.map(f => `- ${f}`).join('\n') || 'No features specified'}

**Tech Stack Required:**
${sowAnalysis.technologies?.join(', ') || 'Not specified'}

**Project Type:** ${sowAnalysis.projectType || 'Not specified'}
**Complexity:** ${sowAnalysis.complexity || 'Not specified'}
**Timeline:** ${sowAnalysis.estimatedTimeline || 'Not specified'}

---

## 🎯 COMPATIBILITY ANALYSIS
This boilerplate has a **${compatibilityData.compatibilityScore || 0}/100 compatibility score** with my SOW.

**What Already Exists:**
${matches.map(m => `✅ ${m}`).join('\n') || '✅ No matching features identified'}

**What Needs to Be Added:**
${gaps.map(g => `❌ ${g}`).join('\n') || '❌ All features already present'}

**Deployment Estimate:**
💰 Render Cost: ${renderCost}/month
${compatibilityData.renderDeployment?.services?.map(s => `- ${s}`).join('\n') || ''}

---

## 🔧 SETUP STEPS

### Step 1: Clone and Analyze
\`\`\`bash
git clone ${project.url}
cd ${project.name}
\`\`\`

### Step 2: Environment Setup
- Create a \`.env\` file
- Add required environment variables
- Check README for specific configuration needs

### Step 3: Install Dependencies
\`\`\`bash
${project.language === 'JavaScript' ? 'npm install' : 
  project.language === 'TypeScript' ? 'npm install' :
  project.language === 'Python' ? 'pip install -r requirements.txt' : 
  project.language === 'Java' ? 'mvn install' :
  'See README for installation instructions'}
\`\`\`

### Step 4: Run Development Server
\`\`\`bash
${project.language === 'JavaScript' || project.language === 'TypeScript' ? 'npm run dev' : 
  project.language === 'Python' ? 'python app.py' :
  'See README for run instructions'}
\`\`\`

---

## 🤖 AI ASSISTANCE NEEDED

Please help me with the following:

1. **Analyze Project Structure**
   - Identify the main entry points
   - Map out the folder structure
   - Locate where I should add new features

2. **Feature Implementation**
   For each missing feature, provide:
   - Where to add the code (specific files)
   - What files to create/modify
   - Dependencies to install
   - Code examples and best practices
   - Estimated implementation time

3. **Integration Requirements**
   ${sowAnalysis.technologies?.length > 0 ? `- How to integrate ${sowAnalysis.technologies.join(', ')}` : ''}
   - Best practices for this tech stack
   - Security considerations
   - Performance optimization tips

4. **Deployment Preparation**
   - Verify Render deployment compatibility
   - Identify any deployment blockers
   - Configure environment variables
   - Database setup (if needed)

---

## 📊 PRIORITY TASKS

${generatePriorityTasks(gaps)}

---

## 💡 RECOMMENDATIONS

${compatibilityData.recommendation || 'No specific recommendations provided'}

---

Start by analyzing the project structure and giving me a clear, step-by-step roadmap for implementing the missing features. Focus on the highest priority items first.
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

