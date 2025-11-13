import React, { useState } from 'react';
import { Code, Copy, Download, Check, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const CursorPromptGenerator = ({ project, sowAnalysis, compatibilityData }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePrompt = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-cursor-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          sowAnalysis,
          compatibilityData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt);
      } else {
        const errorData = await response.json();
        console.error('Prompt generation error:', errorData);
        alert(`Failed to generate prompt: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Generate prompt error:', error);
      alert('Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPrompt = () => {
    const blob = new Blob([prompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-cursor-setup.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-indigo-900">Cursor AI Setup</h4>
        </div>
        {!prompt && (
          <button
            onClick={generatePrompt}
            disabled={loading}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all disabled:bg-gray-400 flex items-center space-x-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <span>Generate Prompt</span>
            )}
          </button>
        )}
      </div>

      {prompt && (
        <>
          <div className="bg-white border border-indigo-200 rounded-lg p-3 max-h-48 overflow-y-auto mb-3">
            <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono">
              {prompt.substring(0, 500)}...
            </pre>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Full Prompt</span>
                </>
              )}
            </button>
            <button
              onClick={downloadPrompt}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Download .txt</span>
            </button>
          </div>

          <p className="text-xs text-indigo-700 mt-2 text-center">
            📋 Paste this into Cursor AI to get step-by-step setup guidance
          </p>
        </>
      )}
    </div>
  );
};

export default CursorPromptGenerator;

