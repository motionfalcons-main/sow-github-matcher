import React from 'react';
import { TrendingUp, Zap, DollarSign, Clock } from 'lucide-react';

const SmartRecommendations = ({ projects, sowAnalysis }) => {
  if (!projects || projects.length === 0) return null;
  
  const topMatch = projects[0];
  const hasComparison = topMatch.comparison;
  
  if (!hasComparison) return null;
  
  const score = topMatch.comparison.compatibilityScore;
  const renderCost = topMatch.comparison.renderDeployment?.estimatedMonthlyCost || 'Unknown';
  const effortLevel = topMatch.comparison.effortToAdapt || 'medium';
  
  const getEffortColor = (effort) => {
    if (effort === 'low') return 'text-green-600 bg-green-50';
    if (effort === 'medium') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  const getEffortIcon = (effort) => {
    if (effort === 'low') return '🟢';
    if (effort === 'medium') return '🟡';
    return '🔴';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 rounded-2xl border-2 border-purple-200 shadow-xl p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎯 Smart Recommendation
        </h3>
      </div>
      
      <div className="bg-white rounded-xl p-5 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900 mb-1">{topMatch.name}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{topMatch.description}</p>
          </div>
          <div className="ml-4 text-right">
            <div className={`text-3xl font-bold ${
              score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {score}%
            </div>
            <p className="text-xs text-gray-500">Match</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Zap className="w-5 h-5 mx-auto text-blue-600 mb-1" />
            <p className="text-xs text-gray-600 mb-1">Compatibility</p>
            <p className="font-bold text-blue-600">{score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low'}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Clock className="w-5 h-5 mx-auto text-green-600 mb-1" />
            <p className="text-xs text-gray-600 mb-1">Effort to Adapt</p>
            <p className={`font-bold ${getEffortColor(effortLevel).split(' ')[0]}`}>
              {getEffortIcon(effortLevel)} {effortLevel.charAt(0).toUpperCase() + effortLevel.slice(1)}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <DollarSign className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <p className="text-xs text-gray-600 mb-1">Render Cost</p>
            <p className="font-bold text-purple-600">{renderCost}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-800">
            <span className="font-bold">💡 Why this project?</span> {topMatch.comparison.recommendation}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <a
            href={topMatch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            🚀 Start with This Project
          </a>
        </div>
      </div>
      
      {projects.length > 1 && (
        <div className="mt-4 bg-white/50 rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Also consider:</span> {projects[1].name} ({projects[1].comparison.compatibilityScore}%)
            {projects.length > 2 && `, ${projects[2].name} (${projects[2].comparison.compatibilityScore}%)`}
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;

