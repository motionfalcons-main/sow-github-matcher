/**
 * Generates a Cursor AI setup prompt for a GitHub project
 * Includes SOW context, compatibility analysis, and step-by-step instructions
 */

export function generateCursorPrompt(project, sowAnalysis, compatibilityData) {
  // Safe defaults for missing data
  const safeCompatibilityData = compatibilityData || {};
  const safeSowAnalysis = sowAnalysis || {};
  
  const renderServices = safeCompatibilityData.renderDeployment?.services || [];
  const renderCost = safeCompatibilityData.renderDeployment?.estimatedMonthlyCost || 'Unknown';
  const renderReasoning = safeCompatibilityData.renderDeployment?.reasoning || '';
  
  // Safe project data
  const projectUrl = project.url || project.html_url || '#';
  const projectName = project.name || project.full_name || 'Unknown Project';
  const projectStars = project.stars || project.stargazers_count || 0;
  const projectLanguage = project.language || 'Unknown';
  
  // Determine deployment type
  const needsDatabase = renderServices.some(s => s.toLowerCase().includes('postgres') || s.toLowerCase().includes('database'));
  const needsFrontend = renderServices.some(s => s.toLowerCase().includes('static') || s.toLowerCase().includes('frontend'));
  const needsBackend = renderServices.some(s => s.toLowerCase().includes('web') || s.toLowerCase().includes('service'));
  
  const prompt = `# 🚀 FAST DEPLOYMENT GUIDE - RENDER.COM

## Project: ${projectName}
Repository: ${projectUrl}
Stars: ${projectStars} ⭐
Language: ${projectLanguage}

**Estimated Monthly Cost:** ${renderCost}
**Required Services:** ${renderServices.join(', ') || 'Web Service'}

---

## ⚠️ CRITICAL: REBRANDING FIRST - DO NOT SKIP THIS!

**🚨 STOP! Before doing ANYTHING else, you MUST completely rebrand this project.**

This is the MOST IMPORTANT step. Do NOT proceed with deployment until rebranding is 100% complete.

### Step 1: Clone Project
\`\`\`bash
git clone ${projectUrl}
cd ${projectName}
\`\`\`

---

### Step 2: COMPLETE REBRANDING (MANDATORY - Do This FIRST!)

**⚠️ YOU CANNOT DEPLOY UNTIL THIS IS DONE. This prevents legal issues and claims of using someone else's work.**

#### 2.1: Search & Replace Project Names
**Do this across the ENTIRE codebase:**
- Original project name → Your project name
- Original author/creator names → Your name
- Original repository URLs → Your repository URLs
- Original domain names → Your domain names

**Files to check:**
- package.json, package-lock.json
- README.md, README.txt, all documentation files
- All config files (.env.example, config.js, etc.)
- All source code files (search for project name in comments)

#### 2.2: Update UI & Branding
**Update ALL visible text:**
- Page titles, headers, footers
- Navigation menus
- Button labels
- Error messages
- Loading text
- About pages, help pages

**Update brand assets:**
- Logo files (replace with your logo)
- Favicon (create new one)
- Meta tags (title, description, og:image)
- App icons (if mobile app)

#### 2.3: Remove All Credits & Attribution
**Remove or replace:**
- Copyright notices
- Author names in package.json
- "Created by" or "Made by" text
- Footer credits
- Acknowledgments sections
- License file (update if needed)
- "About" page content
- Original project links/references

#### 2.4: Update Configuration
**Change in all config files:**
- App name in package.json
- App name in manifest.json (if exists)
- Environment variable names (if they reference original project)
- Build configuration
- Deployment settings

#### 2.5: Verify Rebranding is Complete
**Before proceeding, verify:**
- [ ] No original project name appears anywhere
- [ ] No original author names appear anywhere
- [ ] No original repository URLs appear anywhere
- [ ] All UI text has been updated
- [ ] All logos/icons have been replaced
- [ ] All credits have been removed
- [ ] All documentation has been updated

**Use these commands to verify:**
\`\`\`bash
# Search for original project name (replace "OriginalName" with actual name)
grep -r "OriginalName" . --exclude-dir=node_modules --exclude-dir=.git

# Search for original author name
grep -r "OriginalAuthor" . --exclude-dir=node_modules --exclude-dir=.git

# Search for original repo URL
grep -r "github.com/original" . --exclude-dir=node_modules --exclude-dir=.git
\`\`\`

**ONLY proceed to Step 3 after rebranding is 100% complete!**

---

### Step 3: Prepare for Render Deployment (3 minutes)

${needsBackend ? `#### Backend Setup (Web Service):
1. **Create render.yaml** (if not exists):
\`\`\`yaml
services:
  - type: web
    name: ${projectName}-backend
    runtime: ${projectLanguage === 'Python' ? 'python' : 'node'}
    buildCommand: ${projectLanguage === 'Python' ? 'pip install -r requirements.txt' : 'npm install'}
    startCommand: ${projectLanguage === 'Python' ? 'gunicorn app:app' : 'node server.js'}
    envVars:
      - key: NODE_ENV
        value: production
\`\`\`

2. **Ensure PORT is configurable:**
   - Backend must use: \`process.env.PORT || 3000\` (Node) or \`os.environ.get('PORT', 5000)\` (Python)
   - Render assigns port dynamically

3. **Environment Variables:**
   - Create .env file with all required variables
   - Add them to Render dashboard after deployment

` : ''}${needsFrontend ? `#### Frontend Setup (Static Site):
1. **Build the frontend:**
\`\`\`bash
npm run build
\`\`\`

2. **Create render.yaml for static site:**
\`\`\`yaml
services:
  - type: web
    name: ${projectName}-frontend
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
\`\`\`

` : ''}${needsDatabase ? `#### Database Setup (PostgreSQL):
1. **Create PostgreSQL service in Render:**
   - Go to Render Dashboard → New → PostgreSQL
   - Copy the connection string

2. **Update environment variables:**
   - Add DATABASE_URL to Render environment variables
   - Update your code to use: \`process.env.DATABASE_URL\`

3. **Run migrations:**
   - Add migration script to buildCommand or startCommand
   - Or run manually after first deployment

` : ''}---

### Step 4: Deploy to Render (5 minutes)

**Option A: Using Render Dashboard (Fastest)**
1. Push your rebranded code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Render will auto-detect settings
5. Add environment variables in dashboard
6. Click "Create Web Service"
7. Wait 3-5 minutes for deployment

**Option B: Using render.yaml (Recommended)**
1. Create \`render.yaml\` in project root (see Step 2)
2. Push to GitHub
3. Go to Render → New → Blueprint
4. Connect repository
5. Render reads render.yaml automatically
6. Deploy!

---

## 🎯 DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Project rebranded (names, credits, logos)
- [ ] PORT environment variable configured
- [ ] All environment variables documented
- [ ] Database connection string ready (if needed)
- [ ] Build command works locally
- [ ] Start command works locally

### Render Configuration:
- [ ] Web Service created
${needsFrontend ? '- [ ] Static Site created (if separate frontend)' : ''}
${needsDatabase ? '- [ ] PostgreSQL database created' : ''}
- [ ] Environment variables added
- [ ] Build command set correctly
- [ ] Start command set correctly

### Post-Deployment:
- [ ] Health check endpoint working (\`/api/health\` or \`/\`)
- [ ] Database migrations run (if needed)
- [ ] Environment variables verified
- [ ] Custom domain configured (optional)

---

## 🚀 FAST DEPLOYMENT TIPS

1. **Use Render Blueprint (render.yaml)** - Fastest way, auto-configures everything
2. **Start with Free Tier** - Test deployment, upgrade later if needed
3. **Environment Variables** - Add them in Render dashboard, not in code
4. **Auto-Deploy** - Enable auto-deploy from main branch
5. **Health Checks** - Add \`/health\` endpoint for Render to monitor

---

## 🔧 COMMON ISSUES & FIXES

**Build Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies in package.json/requirements.txt
- Verify Node/Python version matches

**App Crashes:**
- Check logs: Render Dashboard → Logs
- Verify PORT is set correctly
- Check environment variables are set

**Database Connection Fails:**
- Verify DATABASE_URL is set in Render
- Check database is running (not paused)
- Ensure connection string format is correct

**Static Files Not Loading:**
- Verify staticPublishPath points to build output
- Check build command creates dist/ folder
- Ensure base URL is configured correctly

---

## 📝 NEXT STEPS AFTER DEPLOYMENT

1. **Test the deployed app** - Visit the Render URL
2. **Set up custom domain** (optional) - Render Dashboard → Settings
3. **Monitor logs** - Check for errors in Render dashboard
4. **Set up auto-deploy** - Connect GitHub branch
5. **Configure backups** - For database (if applicable)

---

## 💡 CURSOR AI - HELP ME REBRAND & DEPLOY FAST

**PRIORITY ORDER:**
1. **REBRANDING (MUST DO FIRST)** - Help me identify and replace all original project references
2. **DEPLOYMENT PREP** - Help me prepare for Render deployment
3. **DEPLOY** - Help me deploy quickly

Please help me:

1. **REBRANDING ASSISTANCE (Priority #1 - Do This First!):**
   - Identify ALL files containing original project name, author names, or credits
   - Provide a comprehensive list of strings to search and replace
   - Help me find all instances using grep/search commands
   - Update UI components with new branding
   - Verify no original project references remain
   - **DO NOT proceed to deployment until rebranding is complete**

2. **Identify deployment blockers:**
   - Check if PORT is configurable
   - Verify build/start commands
   - Identify missing environment variables
   - Check for hardcoded URLs or paths

3. **Create render.yaml:**
   - Generate the correct render.yaml for this project
   - Include all required services
   - Set correct build and start commands

4. **Fix deployment issues:**
   - Update code to work with Render's environment
   - Fix any hardcoded values
   - Ensure database connections work
   - Verify static file serving

5. **Optimize for Render:**
   - Suggest best practices for Render deployment
   - Optimize build times
   - Configure health checks
   - Set up proper logging

**REMEMBER: Rebranding is MANDATORY before deployment. Help me complete it first, then we'll deploy.**
`;

  return prompt;
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

