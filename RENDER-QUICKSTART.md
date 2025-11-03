# 🚀 Deploy to Render - Quickest Method (Single Service)

## ⚡ Fastest Way (5 Minutes)

Deploy your entire app as ONE service on Render.

### Step 1: Push to GitHub (2 minutes)

```bash
cd /Users/udaytomar/Developer/SOW-GITHUB/sow-github-matcher

# Initialize git
git init
git add .
git commit -m "SOW GitHub Matcher - Ready for deployment"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/sow-github-matcher.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render (3 minutes)

1. **Go to Render**: https://dashboard.render.com/

2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Click "Connect"

3. **Configuration**:
   ```
   Name: sow-github-matcher
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: node server.js
   ```

4. **Environment Variables** (Click "Advanced"):
   ```
   OPENAI_API_KEY = your-openai-api-key-here
   
   NODE_ENV = production
   
   PORT = 10000
   ```

5. **Click "Create Web Service"**

6. **Wait 3-5 minutes** for deployment

7. **Your app is live!**
   ```
   https://sow-github-matcher.onrender.com
   ```

## ✅ That's It!

Your app will be available at the Render URL shown in the dashboard.

### What Works:
- ✅ Full frontend interface
- ✅ Backend API with OpenAI integration
- ✅ Floating progress indicator
- ✅ Clickable GitHub links
- ✅ Tech stack display
- ✅ Download reports
- ✅ Sample SOW testing

### Free Tier Notes:
- Service spins down after 15 min of inactivity
- First request after sleep takes ~30-60 seconds
- Upgrade to paid plan for always-on

## 🎯 Quick Test After Deploy

1. Open your Render URL
2. Click "Load Sample SOW"
3. Click "Analyze & Find Projects"
4. Watch floating progress in top-right corner
5. Click project names or scores to visit GitHub
6. Download the report!

## 📝 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web Service created
- [ ] Environment variables set (OPENAI_API_KEY, NODE_ENV, PORT)
- [ ] Deployment successful
- [ ] Health check works: `https://your-app.onrender.com/api/health`
- [ ] Frontend loads correctly
- [ ] Test with sample SOW
- [ ] Verify GitHub links work
- [ ] Check floating progress indicator

---

**Ready to deploy?** Follow the steps above and your app will be live in 5 minutes! 🚀

