import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Star, Plus, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const CollectionsPage = ({ onClose }) => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/collections?userId=default-user`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
        if (data.length > 0 && !selectedCollection) {
          setSelectedCollection(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionId) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setCollections(collections.filter(c => c._id !== collectionId));
        if (selectedCollection?._id === collectionId) {
          setSelectedCollection(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const removeProject = async (projectId) => {
    if (!selectedCollection) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/collections/${selectedCollection._id}/projects/${projectId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        const updated = await response.json();
        setSelectedCollection(updated);
        setCollections(collections.map(c => c._id === updated._id ? updated : c));
      }
    } catch (error) {
      console.error('Failed to remove project:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Bookmark className="w-6 h-6 mr-3" />
            My Collections
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Sidebar - Collections List */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Collections ({collections.length})</span>
            </h3>
            
            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : collections.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bookmark className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No collections yet</p>
                <p className="text-xs text-gray-400 mt-2">Save projects to create your first collection!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map(col => (
                  <div
                    key={col._id}
                    onClick={() => setSelectedCollection(col)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedCollection?._id === col._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">📁 {col.name}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCollection(col._id);
                        }}
                        className={`hover:bg-red-600/20 rounded p-1 ${
                          selectedCollection?._id === col._id ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className={`text-xs ${
                      selectedCollection?._id === col._id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {col.projects.length} projects • {new Date(col.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right - Collection Details */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedCollection ? (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCollection.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedCollection.projects.length} projects • Created {new Date(selectedCollection.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {selectedCollection.projects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No projects in this collection yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCollection.projects.map((project) => (
                      <div key={project._id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-900 text-sm flex-1">
                            <a 
                              href={project.repoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 flex items-center"
                            >
                              {project.repoName}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </h4>
                          <button
                            onClick={() => removeProject(project._id)}
                            className="text-red-600 hover:bg-red-50 rounded p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                        
                        {project.compatibility && (
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold">Match: {project.compatibility.compatibilityScore}%</span>
                            <span className="text-gray-500">{project.stars} ⭐</span>
                          </div>
                        )}
                        
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Select a collection to view projects</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;

