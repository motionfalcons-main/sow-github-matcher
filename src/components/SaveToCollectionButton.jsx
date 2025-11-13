import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, X, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const SaveToCollectionButton = ({ project }) => {
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (showModal) {
      loadCollections();
    }
  }, [showModal]);

  const loadCollections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/collections?userId=default-user`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const createNewCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName,
          description: '',
          userId: 'default-user'
        })
      });
      
      if (response.ok) {
        const newCollection = await response.json();
        setCollections([...collections, newCollection]);
        setNewCollectionName('');
        // Auto-save to new collection
        await saveToCollection(newCollection._id);
      }
    } catch (error) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection');
    }
  };

  const saveToCollection = async (collectionId) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project,
          notes: '',
          tags: []
        })
      });
      
      if (response.ok) {
        setSavedMessage('✅ Saved!');
        setTimeout(() => {
          setSavedMessage('');
          setShowModal(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save project');
      }
    } catch (error) {
      console.error('Failed to save to collection:', error);
      alert('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1"
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span>Save</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Bookmark className="w-5 h-5 mr-2" />
                Save to Collection
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {savedMessage ? (
                <div className="text-center py-8">
                  <Check className="w-16 h-16 mx-auto text-green-600 mb-3" />
                  <p className="text-xl font-bold text-green-600">{savedMessage}</p>
                </div>
              ) : (
                <>
                  {/* Project Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-1">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>

                  {/* Existing Collections */}
                  {collections.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Select Collection:</h4>
                      <div className="space-y-2">
                        {collections.map(col => (
                          <button
                            key={col._id}
                            onClick={() => saveToCollection(col._id)}
                            disabled={saving}
                            className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">📁 {col.name}</p>
                                <p className="text-xs text-gray-500">{col.projects.length} projects</p>
                              </div>
                              <Plus className="w-5 h-5 text-gray-400" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create New Collection */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Or Create New Collection:</h4>
                    <input
                      type="text"
                      placeholder="e.g., E-commerce Projects, Client: Acme Corp"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && createNewCollection()}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
                    />
                    <button
                      onClick={createNewCollection}
                      disabled={!newCollectionName.trim() || saving}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create & Save</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveToCollectionButton;

