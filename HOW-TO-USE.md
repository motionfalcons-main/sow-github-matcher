# How to Use SOW-GitHub Project Matcher

## 🎯 Your App is Ready!

Both servers are running:
- **Frontend**: http://localhost:5173/
- **Backend**: http://localhost:3001/

Your OpenAI API key is configured in the backend `.env` file - no need to enter it in the browser!

## 📖 Step-by-Step Guide

### 1. Open the Application
Open your browser and go to: **http://localhost:5173/**

### 2. Load Sample Data (Recommended for First Test)
Click the **"Load Sample SOW"** button at the bottom of the form. This will:
- ✅ Load a sample astrology AI project SOW
- ✅ Fill in search keywords automatically
- ✅ Give you test data to see how the app works

### 3. Select AI Provider
Make sure **"OpenAI (GPT-4)"** is selected (it should be by default)
- Your OpenAI API key is already configured in the backend
- No need to enter any API keys!

### 4. Click "Analyze & Find Projects"
The big blue button in the center. This will start the analysis process.

### 5. Watch the Progress
You'll see real-time updates:
- 🔍 Searching GitHub repositories...
- 📚 Fetching README files (project 1/10...)
- 🤖 Analyzing SOW with OpenAI...
- 📊 Comparing projects (1/10...)
- 📋 Generating report...

**This takes about 2-5 minutes total**

### 6. View Results
Once complete, you'll see:
- **Analysis Summary**: Average compatibility, highly compatible count
- **Best Match**: The top-scoring GitHub project
- **Project Rankings**: All 10 projects sorted by compatibility score

Each project shows:
- ✅ **Matching Features**: What the project already has
- ❌ **Missing Features**: What needs to be added
- 💡 **Recommendation**: AI's advice on using this project
- 🎯 **Compatibility Score**: Percentage match with your SOW

### 7. Download Report
Click either:
- **"Download Report (.txt)"** - Saves a comprehensive text report
- **"Copy to Clipboard"** - Copies the report for easy sharing

## 🧪 Test with Your Own SOW

### Option A: Upload a File
1. Drag and drop your SOW file (.txt, .pdf, or .docx)
2. Or click "Choose File" to browse
3. The app will extract and display the text

### Option B: Use Sample Data
Click "Load Sample SOW" for instant test data

## 📊 What You'll Get

### Analysis Summary
- Average compatibility score across all projects
- Count of highly compatible projects (>70% match)
- Total projects analyzed

### Best Match Project
- Highest scoring GitHub repository
- Direct link to the repo
- Compatibility score

### For Each Project:
1. **Rank** - Numbered 1-10 by compatibility
2. **Project Name** - Clickable link to GitHub
3. **Description** - What the project does
4. **Compatibility Score** - Color-coded percentage
5. **Matching Features** - ✅ What matches your SOW
6. **Missing Features** - ❌ What needs to be built
7. **Recommendation** - AI's expert advice

### Downloadable Report Includes:
- Complete SOW summary
- Analysis overview with statistics
- Top 5 matching projects in detail
- Comparison table for all 10 projects
- Implementation recommendations
- Risks and considerations

## 🎨 UI Features

### Color Coding:
- **Green** (70-100%) = Highly Compatible ✅
- **Yellow** (50-69%) = Moderately Compatible ⚠️
- **Red** (0-49%) = Low Compatibility ❌

### Interactive Elements:
- Hover over projects for elevation effect
- Click project names to open GitHub repo
- Smooth animations and transitions
- Responsive design for mobile/tablet

## ⚡ Quick Tips

1. **Be Specific**: Use detailed search keywords for better GitHub matches
2. **Check READMEs**: The app fetches up to 3000 characters from each README
3. **AI Delays**: 1-second delays between API calls prevent rate limiting
4. **Save Reports**: Download reports for later reference
5. **Try Both**: Test with both OpenAI and Claude to compare results

## 🔧 If Something Goes Wrong

### "No matching repositories found"
- Try different/broader search keywords
- Check your keywords are relevant to GitHub projects

### "Backend not responding"
- Make sure `npm run dev:all` is running
- Check backend is at http://localhost:3001/api/health

### "Analysis failed"
- Backend logs will show the error
- Check your API key balance/credits
- Try the other AI provider

## 🎉 You're All Set!

Just open **http://localhost:5173/** and start analyzing! The app is fully configured with your OpenAI API key and ready to use.

---

**Happy analyzing!** 🚀

