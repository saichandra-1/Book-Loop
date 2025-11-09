import React, { useState } from 'react';
import { Users, MessageCircle, Clock, Plus, Search, Lock, Globe, Heart } from 'lucide-react';
import { User ,ReadingCircle, Page } from '../App';
import api from '../api';


interface CirclesPageProps {
  currentUser: User | null;
  readingCircles: ReadingCircle[];
  onPageChange?: (page: Page, circleId?: string) => void;
}
export const CirclesPage: React.FC<CirclesPageProps> = ({ currentUser, readingCircles, onPageChange }) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'my-circles'>('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [circleName, setCircleName] = useState('');
  const [circleDesc, setCircleDesc] = useState('');
  const [circlePrivacy, setCirclePrivacy] = useState<'public' | 'private'>('public');
  const [circles, setCircles] = useState(readingCircles);
  

  const refreshCircles = async () => {
    try {
      const res = await api.get('circles/');
      setCircles(res.data);
    } catch (e) {
      // ignore refresh failure; optimistic UI already applied
    }
  };

  const myCircles = circles.filter(circle =>
    currentUser?.circlesjoined.includes(circle.id)
  );

  const discoverCircles = circles.filter(circle =>
    !currentUser?.circlesjoined.includes(circle.id)
  );

  // Removed distance calculations since circles no longer support nearby filtering

  const filteredCircles = (activeTab === 'my-circles' ? myCircles : discoverCircles)
    .filter(circle => {
      const matchesSearch = circle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        circle.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

  // Join Circle
  const handleJoinCircle = async (circleId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.post(`circles/${circleId}/join`, { userId: currentUser.id });
      if (res.status !== 200) {
        alert(res.data?.message || 'Failed to join circle');
        return;
      }
      alert(res.data.message);
      setCircles(prev => prev.map(c => c.id === circleId ? { ...c, memberCount: (c.memberCount || 0) + 1 } : c));
      if (!currentUser.circlesjoined.includes(circleId)) {
        currentUser.circlesjoined = [...currentUser.circlesjoined, circleId];
      }
      refreshCircles();
    } catch (error) {
      alert('Failed to join circle');
    }
  };

  // Leave Circle
  const handleLeaveCircle = async (circleId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.delete(`circles/${circleId}/leave`, { data: { userId: currentUser.id } });
      if (res.status !== 200) {
        alert(res.data?.message || 'Failed to leave circle');
        return;
      }
      alert(res.data.message);
      setCircles(prev => prev.map(c => c.id === circleId ? { ...c, memberCount: Math.max(0, (c.memberCount || 0) - 1) } : c));
      currentUser.circlesjoined = currentUser.circlesjoined.filter(id => id !== circleId);
      refreshCircles();
    } catch (error) {
      alert('Failed to leave circle');
    }
  };

  // Create Circle
  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('addcircles', {
        name: circleName,
        description: circleDesc,
        privacy: circlePrivacy,
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(circleName),
        members: currentUser ? [currentUser.id] : [],
        currentbook: null,
      });
      const newCircle = res.data;
      //add user to the circle
      const userjoin=await api.post(`circles/${newCircle.id}/join`, {
        userId: currentUser?.id,
      });
      if(userjoin.status!==200) return
      alert(userjoin.data.message);
      // Update UI state here
      setCircles([newCircle, ...circles]);
      if (currentUser) {
        currentUser.circlesjoined = [...currentUser.circlesjoined, newCircle.id];
      }
      setShowCreateModal(false);
      setCircleName('');
      setCircleDesc('');
      setCirclePrivacy('public');
      setActiveTab('my-circles');
    } catch (err) {
      alert('Failed to create circle');
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reading Circles</h1>
            <p className="text-gray-600">Connect with fellow readers and discuss your favorite books</p>
          </div>
          <button
            className="mt-4 sm:mt-0 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Circle
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Discover Circles
          </button>
          <button
            onClick={() => setActiveTab('my-circles')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-circles'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Circles ({myCircles.length})
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search circles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Circles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCircles.map((circle) => (
            <div key={circle.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              {/* Circle Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={circle.avatar}
                      alt={circle.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                      <div>
                        <h3 className="font-semibold text-gray-900">{circle.name}</h3>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{circle.memberCount} members</span>
                        </div>
                      </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {circle.privacy === 'public' ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-blue-500" />
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      circle.privacy === 'public' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {circle.privacy}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{circle.description}</p>
                
                {activeTab === 'discover' ? (
                  <button
                    onClick={() => handleJoinCircle(circle.id)}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    disabled={currentUser?.circlesjoined.includes(circle.id)}
                  >
                    {currentUser?.circlesjoined.includes(circle.id) ? 'Joined' : 'Join Circle'}
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                      onClick={() => onPageChange?.('circle-discussion', circle.id)}
                    >
                      View Posts
                    </button>
                    <button
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      onClick={() => handleLeaveCircle(circle.id)}
                    >
                      Leave Circle
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Posts Preview */}
              {activeTab === 'my-circles' && circle.posts.length > 0 && (
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {circle.posts.slice(0, 2).map((post) => (
                      <div key={post.id} className="flex space-x-3">
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{post.authorName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                              <Heart className="w-3 h-3" />
                              <span>{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                              <MessageCircle className="w-3 h-3" />
                              <span>{post.comments.length}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats for Discovery */}
              {activeTab === 'discover' && (
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>{circle.posts.length} posts</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Active today</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCircles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'my-circles' ? 'No circles joined yet' : 'No circles found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'my-circles' 
                ? 'Join some circles to start connecting with other readers'
                : 'Try adjusting your search terms'
              }
            </p>
            {activeTab === 'my-circles' && (
              <button
                onClick={() => setActiveTab('discover')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Discover circles
              </button>
            )}
          </div>
        )}

        {/* Create Circle Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <form
              onSubmit={handleCreateCircle}
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Create a New Circle</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Circle Name</label>
                <input
                  type="text"
                  value={circleName}
                  onChange={e => setCircleName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={circleDesc}
                  onChange={e => setCircleDesc(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Privacy</label>
                <select
                  value={circlePrivacy}
                  onChange={e => setCirclePrivacy(e.target.value as 'public' | 'private')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};



