# Quick Start Guide - SOW-GitHub Project Matcher

## 🚀 Running the Application (Already Done!)

Your application is **already running** and ready to use!

- **Frontend**: http://localhost:5173/
- **Backend**: http://localhost:3001/

## ✅ Backend Configuration

Your OpenAI API key is already configured in the `.env` file:
```
OPENAI_API_KEY=sk-proj-U02M...D85wA (configured ✓)
```

## 📖 How to Use Right Now

1. **Open your browser** to http://localhost:5173/

2. **Click "Load Sample SOW"** to test with sample data
   - This loads a pre-configured astrology AI project
   - Automatically fills in search keywords

3. **Select AI Provider**
   - **OpenAI (GPT-4)** - Already selected and configured! ✓
   - Claude (Anthropic) - Available if you add CLAUDE_API_KEY to .env

4. **Click "Analyze & Find Projects"**
   - The app will search GitHub
   - Fetch README files
   - Analyze with OpenAI GPT-4
   - Generate compatibility scores
   - Create downloadable report

## 🎯 What's Different Now?

### Before:
- ❌ API keys entered in browser (insecure)
- ❌ Exposed to frontend code
- ❌ Could be stolen from browser console

### Now:
- ✅ API keys stored in backend .env file (secure)
- ✅ Never sent to browser
- ✅ Server-side API calls only
- ✅ Much more secure!

## 🔧 Commands

### Run both servers together:
```bash
npm run dev:all
```

### Run servers separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev
```

### Stop servers:
```bash
# Press Ctrl+C in the terminal running the servers
```

## 📝 Testing the Application

### Test 1: Sample SOW (Recommended)
1. Go to http://localhost:5173/
2. Click "Load Sample SOW" button
3. Verify "OpenAI (GPT-4)" is selected
4. Click "Analyze & Find Projects"
5. Wait 2-3 minutes for analysis
6. Download the report

### Test 2: Custom SOW
1. Upload your own .txt, .pdf, or .docx file
2. Enter relevant search keywords
3. Select your preferred AI provider
4. Click "Analyze & Find Projects"

## ✅ Backend API Endpoints

Your backend server provides these endpoints:

- `GET /api/health` - Check server status
- `POST /api/analyze-sow/openai` - Analyze SOW with OpenAI
- `POST /api/analyze-sow/claude` - Analyze SOW with Claude
- `POST /api/compare-project/openai` - Compare project with OpenAI
- `POST /api/compare-project/claude` - Compare project with Claude

## 🎉 You're Ready!

Everything is set up and running. Just open http://localhost:5173/ in your browser and start analyzing!

## 💡 Tips

- The first analysis might take 2-5 minutes
- GitHub search is fast, AI analysis takes most of the time
- You can download reports or copy to clipboard
- Try different AI providers to compare results
- The sample SOW is perfect for testing

---

**Need help?** Check the main README.md or the troubleshooting section.

