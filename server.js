import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Helper function to aggressively clean Unicode characters
const cleanUnicode = (text) => {
  if (!text) return text;
  if (typeof text !== 'string') return text;
  
  // Convert to buffer and back to remove problematic characters
  let cleaned = Buffer.from(text, 'utf8').toString('ascii', 0, text.length);
  
  // Additional cleaning
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, ''); // Only printable ASCII + newlines/tabs
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  cleaned = cleaned.replace(/  +/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to clean all incoming request bodies from Unicode
app.use((req, res, next) => {
  if (req.body) {
    // Recursively clean all string values in the request body
    const cleanObject = (obj) => {
      if (typeof obj === 'string') {
        return cleanUnicode(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      } else if (obj !== null && typeof obj === 'object') {
        const cleaned = {};
        for (const key in obj) {
          cleaned[key] = cleanObject(obj[key]);
        }
        return cleaned;
      }
      return obj;
    };
    
    req.body = cleanObject(req.body);
  }
  next();
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  console.log(`📁 Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Analyze SOW with Claude
app.post('/api/analyze-sow/claude', async (req, res) => {
  try {
    const { sowContent } = req.body;
    
    if (!sowContent) {
      return res.status(400).json({ error: 'SOW content is required' });
    }

    // Content is already cleaned by middleware

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    // Build prompt with array join to avoid hidden Unicode
    const promptParts = [
      'Analyze this Statement of Work and extract key requirements in JSON format:',
      '',
      'SOW Content:',
      sowContent,
      '',
      'Return ONLY valid JSON with this exact structure:',
      '{',
      '  "projectType": "brief project description",',
      '  "mainFeatures": ["feature1", "feature2", "feature3", "feature4"],',
      '  "technologies": ["tech1", "tech2", "tech3"],',
      '  "complexity": "low/medium/high",',
      '  "domain": "industry or domain",',
      '  "estimatedTimeline": "estimated time to complete",',
      '  "keyRequirements": ["requirement1", "requirement2"]',
      '}'
    ];
    
    let prompt = promptParts.join('\n');
    prompt = cleanUnicode(prompt);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status}`, 
        details: error 
      });
    }

    const data = await response.json();
    const analysisText = data.content[0].text;
    
    // Parse JSON response
    const analysis = JSON.parse(analysisText);
    res.json(analysis);
  } catch (error) {
    console.error('Claude SOW Analysis Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze SOW with OpenAI
app.post('/api/analyze-sow/openai', async (req, res) => {
  try {
    const { sowContent } = req.body;
    
    if (!sowContent) {
      return res.status(400).json({ error: 'SOW content is required' });
    }

    // Content is already cleaned by middleware

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Only trim the API key, do NOT clean it - just remove whitespace
    const trimmedApiKey = apiKey.trim();

    // Build prompt with array join to avoid any hidden Unicode
    const promptParts = [
      'Analyze this Statement of Work and extract key requirements in JSON format:',
      '',
      'SOW Content:',
      sowContent,
      '',
      'Return ONLY valid JSON with this exact structure:',
      '{',
      '  "projectType": "brief project description",',
      '  "mainFeatures": ["feature1", "feature2", "feature3", "feature4"],',
      '  "technologies": ["tech1", "tech2", "tech3"],',
      '  "complexity": "low/medium/high",',
      '  "domain": "industry or domain",',
      '  "estimatedTimeline": "estimated time to complete",',
      '  "keyRequirements": ["requirement1", "requirement2"]',
      '}'
    ];
    
    let prompt = promptParts.join('\n');
    // Clean the prompt to remove any Unicode characters
    prompt = cleanUnicode(prompt);

    // Use axios which handles encoding better than fetch
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${trimmedApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    let analysisText = response.data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON response
    const analysis = JSON.parse(analysisText);
    res.json(analysis);
  } catch (error) {
    console.error('OpenAI SOW Analysis Error:', error);
    const errorMsg = error.response?.data?.error?.message || error.message;
    res.status(error.response?.status || 500).json({ error: errorMsg });
  }
});

// Compare project with Claude
app.post('/api/compare-project/claude', async (req, res) => {
  try {
    const { project, sowAnalysis } = req.body;
    
    if (!project || !sowAnalysis) {
      return res.status(400).json({ error: 'Project and SOW analysis are required' });
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    const prompt = `Compare this GitHub project with the SOW requirements and provide compatibility analysis:

SOW Requirements:
${JSON.stringify(sowAnalysis, null, 2)}

GitHub Project:
Name: ${project.name}
Description: ${project.description}
README: ${project.readme}
Language: ${project.language}
Stars: ${project.stars}

Analyze and return ONLY valid JSON:
{
  "compatibilityScore": 0-100 (number),
  "matchingFeatures": ["feature1", "feature2"],
  "missingFeatures": ["feature1", "feature2"],
  "technologyAlignment": "high/medium/low",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "brief recommendation text",
  "effortToAdapt": "low/medium/high"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status}`, 
        details: error 
      });
    }

    const data = await response.json();
    const comparisonText = data.content[0].text;
    
    // Parse JSON response
    const comparison = JSON.parse(comparisonText);
    res.json(comparison);
  } catch (error) {
    console.error('Claude Project Comparison Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Compare project with OpenAI
app.post('/api/compare-project/openai', async (req, res) => {
  try {
    const { project, sowAnalysis } = req.body;
    
    if (!project || !sowAnalysis) {
      return res.status(400).json({ error: 'Project and SOW analysis are required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Only trim the API key, do NOT clean it
    const trimmedApiKey = apiKey.trim();

    // Project data is already cleaned by middleware
    const cleanProject = project;

    // Build prompt with array join to avoid hidden Unicode
    const promptParts = [
      'Compare this GitHub project with the SOW requirements and provide compatibility analysis:',
      '',
      'SOW Requirements:',
      JSON.stringify(sowAnalysis, null, 2),
      '',
      'GitHub Project:',
      'Name: ' + cleanProject.name,
      'Description: ' + cleanProject.description,
      'README: ' + cleanProject.readme,
      'Language: ' + cleanProject.language,
      'Stars: ' + cleanProject.stars,
      '',
      'Analyze and return ONLY valid JSON:',
      '{',
      '  "compatibilityScore": 0-100 (number),',
      '  "matchingFeatures": ["feature1", "feature2"],',
      '  "missingFeatures": ["feature1", "feature2"],',
      '  "technologyAlignment": "high/medium/low",',
      '  "strengths": ["strength1", "strength2"],',
      '  "weaknesses": ["weakness1", "weakness2"],',
      '  "recommendation": "brief recommendation text",',
      '  "effortToAdapt": "low/medium/high"',
      '}'
    ];
    
    let prompt = promptParts.join('\n');
    // Clean the prompt to remove Unicode characters
    prompt = cleanUnicode(prompt);

    // Use axios which handles encoding better
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${trimmedApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    let comparisonText = response.data.choices[0].message.content;
    
    // Remove markdown code blocks if present
    comparisonText = comparisonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON response
    const comparison = JSON.parse(comparisonText);
    res.json(comparison);
  } catch (error) {
    console.error('OpenAI Project Comparison Error:', error);
    const errorMsg = error.response?.data?.error?.message || error.message;
    res.status(error.response?.status || 500).json({ error: errorMsg });
  }
});

// Handle React routing in production - return index.html for all non-API routes
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && req.method === 'GET') {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send('Frontend not built. Run: npm run build');
        }
      });
    } else {
      next();
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend served from /dist`);
  }
});

