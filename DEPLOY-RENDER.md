# Deploy to Render - Step by Step Guide

## 🚀 Quick Deploy

This application consists of:
1. **Backend API** (Node.js/Express) - Handles AI API calls
2. **Frontend** (React/Vite) - User interface

We'll deploy both to Render.

## 📋 Prerequisites

1. GitHub account
2. Render account (sign up at https://render.com)
3. Your OpenAI API key (you already have it configured)

## 🔧 Step 1: Prepare Your Code

### Push to GitHub

```bash
cd /Users/udaytomar/Developer/SOW-GITHUB/sow-github-matcher

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - SOW GitHub Matcher with backend"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/sow-github-matcher.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Connect GitHub Repository**
   - Select your `sow-github-matcher` repository
   - Click "Connect"

3. **Configure Backend Service**
   - **Name**: `sow-matcher-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free (or paid if you need)

4. **Add Environment Variables**
   Click "Advanced" → "Add Environment Variable":
   
   ```
   Key:    OPENAI_API_KEY
   Value: your-openai-api-key-here
   
   Key: PORT
   Value: 10000
   ```
   
   Optional (if you want Claude):
   ```
   Key: CLAUDE_API_KEY
   Value: your-claude-key-here
   ```

5. **Create Web Service**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Note your backend URL: `https://sow-matcher-backend.onrender.com`

## 🎨 Step 3: Deploy Frontend to Render

1. **Create Another Web Service**
   - Click "New +" → "Web Service"
   - Select same repository

2. **Configure Frontend Service**
   - **Name**: `sow-matcher-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: Leave empty (static site)
   - **Publish Directory**: `dist`
   - **Plan**: Free

3. **Add Environment Variable**
   
   ```
   Key: VITE_API_URL
   Value: https://sow-matcher-backend.onrender.com/api
   ```
   
   ⚠️ **Important**: Replace with YOUR actual backend URL from Step 2!

4. **Create Web Service**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - Your app will be live at: `https://sow-matcher-frontend.onrender.com`

## ✅ Step 4: Verify Deployment

1. **Test Backend Health**
   ```
   https://sow-matcher-backend.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"Backend server is running"}`

2. **Open Frontend**
   ```
   https://sow-matcher-frontend.onrender.com
   ```

3. **Test Full Flow**
   - Click "Load Sample SOW"
   - Select "OpenAI (GPT-4)"
   - Click "Analyze & Find Projects"
   - Watch the floating progress indicator
   - View results and click GitHub links

## 🔧 Alternative: Single Service Deployment

If you prefer to deploy as a single service:

### Update server.js to serve frontend

Add this to `server.js` before `app.listen()`:

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - return index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});
```

### Then deploy as one service:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node server.js`
- Set `VITE_API_URL` to same domain: `/api`

## 🎯 Environment Variables Summary

### Backend Needs:
```
OPENAI_API_KEY=your-key-here
CLAUDE_API_KEY=your-key-here (optional)
PORT=10000
```

### Frontend Needs:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## ⚡ Important Notes

1. **Free Tier Limits**:
   - Services spin down after inactivity
   - First request may take 30-60 seconds to wake up
   - Consider paid tier for always-on service

2. **CORS Configuration**:
   - Already configured in `server.js` with `cors()`
   - Should work across different domains

3. **API Keys**:
   - Never commit `.env` file to git
   - Use Render's environment variables dashboard
   - Keys are encrypted and secure

4. **Build Time**:
   - Backend: ~2-3 minutes
   - Frontend: ~3-5 minutes
   - Total: ~5-8 minutes for first deploy

## 🐛 Troubleshooting

### Backend won't start:
- Check environment variables are set
- Check build logs in Render dashboard
- Verify `node server.js` command

### Frontend shows API errors:
- Verify `VITE_API_URL` points to backend
- Check backend is running and healthy
- Test backend health endpoint directly

### CORS errors:
- Ensure `cors()` is in `server.js`
- Check backend allows frontend domain

## 📝 After Deployment

Update your `.env.example` for others:

```env
# Production URLs
VITE_API_URL=https://sow-matcher-backend.onrender.com/api

# Backend environment variables (set in Render dashboard)
OPENAI_API_KEY=your-key-here
CLAUDE_API_KEY=your-key-here
PORT=10000
```

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live backend API at `https://sow-matcher-backend.onrender.com`
- ✅ Live frontend at `https://sow-matcher-frontend.onrender.com`
- ✅ Secure API keys on backend
- ✅ Full functionality including:
  - Floating progress indicator
  - Clickable project links
  - Tech stack display
  - AI-powered analysis
  - Downloadable reports

Share your app URL with anyone! 🚀

---

**Need help?** Check Render docs: https://render.com/docs

