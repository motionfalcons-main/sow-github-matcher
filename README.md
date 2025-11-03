# SOW-GitHub Project Matcher

A powerful AI-powered tool that analyzes Statement of Work (SOW) documents and finds the most compatible GitHub projects using Claude AI or OpenAI and GitHub API integration.

## 🔐 Security First - Backend API Keys

**NEW:** API keys are now securely stored on the backend server! No more entering API keys in the browser - everything is handled server-side for maximum security.

## What This Tool Does

This application helps developers and project managers find existing GitHub repositories that best match their project requirements. Simply upload a SOW document, enter search keywords, and get AI-powered compatibility analysis with detailed recommendations and downloadable reports.

## Features

- 📄 **Multi-format SOW Upload**: Supports .txt, .pdf, and .docx files with drag-and-drop
- 🔍 **GitHub API Integration**: Searches and analyzes top 10 most relevant repositories
- 🤖 **Claude AI Analysis**: Extracts requirements and compares projects using advanced AI
- 📊 **Compatibility Scoring**: Ranks projects by compatibility with detailed analysis
- 📋 **Comprehensive Reports**: Download formatted analysis reports or copy to clipboard
- 🎯 **Sample Data**: Try with pre-loaded astrology AI project example

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sow-github-matcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys (Backend)**
   
   Create a `.env` file in the project root:
   ```bash
   # Copy the example file
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   # Add your OpenAI API key
   OPENAI_API_KEY=sk-proj-your-key-here
   
   # Optional: Add Claude API key if you want to use Claude
   CLAUDE_API_KEY=your-claude-key-here
   
   # Backend port (default is fine)
   PORT=3001
   ```

4. **Start both frontend and backend**
   ```bash
   npm run dev:all
   ```
   
   This starts:
   - Backend server on `http://localhost:3001`
   - Frontend app on `http://localhost:5173`

5. **Open your browser**
   Navigate to `http://localhost:5173`

## How to Use

### Step 1: Choose AI Provider
1. Select between **Claude (Anthropic)** or **OpenAI (GPT-4)**
2. Make sure you've configured the corresponding API key in `.env` file
3. Default is OpenAI (already configured with your key)

### Step 2: Upload Your SOW Document
1. **Drag and drop** your SOW file or click "Choose File"
2. Supported formats: `.txt`, `.pdf`, `.docx`
3. The tool will extract and display the text content

### Step 3: Enter Search Keywords
1. Describe the type of projects you're looking for
2. Example: "astrology AI, horoscope prediction, mystical"
3. Character limit: 200 characters

### Step 4: Analyze Projects
1. Click "Analyze & Find Projects"
2. Watch the progress as the tool:
   - Searches GitHub for relevant repositories
   - Fetches README files and project details
   - Analyzes your SOW requirements with Claude AI
   - Compares each project for compatibility
   - Generates a comprehensive report

### Step 5: Review Results
1. **Analysis Summary**: Overall compatibility scores and statistics
2. **Best Match**: The highest-scoring project with detailed analysis
3. **SOW Analysis**: Extracted requirements, features, and technologies
4. **Project Rankings**: All projects ranked by compatibility score

### Step 6: Download Report
1. Click "Download Report (.txt)" for a comprehensive text report
2. Or click "Copy to Clipboard" to share the analysis
3. Reports include detailed comparisons, recommendations, and implementation guidance

## Sample Data

Try the tool with our pre-loaded sample:
- Click "Load Sample SOW" to test with astrology AI project data
- Automatically fills in sample SOW content and search keywords
- Perfect for testing the full workflow

## FAQ

### Q: Where do I add my API keys?
A: API keys are configured in the `.env` file on the backend server. This is more secure than entering them in the browser.

### Q: Do I need a GitHub API key?
A: No! The tool uses GitHub's public API which doesn't require authentication for searching public repositories.

### Q: How accurate is the AI analysis?
A: The tool uses Claude Sonnet 4 or OpenAI GPT-4, both are advanced AI models for highly accurate requirement extraction and project comparison.

### Q: What file formats are supported?
A: Currently supports .txt, .pdf, and .docx files. For PDF and DOCX files, the tool simulates text extraction (in production, you'd use libraries like pdf-parse or mammoth).

### Q: How long does analysis take?
A: Typically 2-5 minutes depending on the number of projects and API response times. The tool shows real-time progress updates.

### Q: Can I analyze private repositories?
A: Currently, the tool only analyzes public GitHub repositories. Private repo analysis would require GitHub authentication.

## Troubleshooting

### Common Issues

**"GitHub API rate limit exceeded"**
- Wait 1 hour and try again
- GitHub allows 60 requests per hour for unauthenticated users

**"Invalid API key" or "API key not configured"**
- Check your `.env` file has the correct API key
- Make sure the backend server is running (`http://localhost:3001`)
- Verify the API key format is correct
- Check your account has sufficient credits

**"No matching repositories found"**
- Try different search keywords
- Use more specific or broader terms
- Check that your keywords are relevant to existing projects

**File upload issues**
- Ensure file is under 10MB
- Check file format is .txt, .pdf, or .docx
- Try refreshing the page and uploading again

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your internet connection
3. Ensure all required fields are filled
4. Try the sample SOW data to test functionality

## Technical Details

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React
- **AI**: Claude Sonnet 4 (Anthropic) or OpenAI GPT-4
- **Data**: GitHub REST API
- **Security**: API keys stored server-side in .env file

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings
4. Add your environment variables in Vercel dashboard

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure build settings if needed

### GitHub Pages
1. Run `npm run build`
2. Push the `dist` folder to a `gh-pages` branch
3. Enable GitHub Pages in repository settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

---

**Need help?** Open an issue on GitHub or contact the development team.