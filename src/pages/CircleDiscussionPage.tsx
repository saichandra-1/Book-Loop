import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Heart, Send, Users, Clock, Plus } from 'lucide-react';
import { User, ReadingCircle, Post, Comment, Page } from '../App';
import api from '../api';

interface CircleDiscussionPageProps {
  currentUser: User | null;
  circleId: string;
  onPageChange: (page: Page) => void;
}

export const CircleDiscussionPage: React.FC<CircleDiscussionPageProps> = ({ 
  currentUser, 
  circleId, 
  onPageChange 
}) => {
  const [circle, setCircle] = useState<ReadingCircle | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<{ [postId: string]: string }>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCircleData();
  }, [circleId]);

  const fetchCircleData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`circles/${circleId}`);
      setCircle(response.data);
      console.log(response.data.avatar)
      setPosts(response.data.posts || []);
      
      // Load liked posts for current user
      if (currentUser) {
        loadLikedPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching circle data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikedPosts = async (posts: Post[]) => {
    if (!currentUser) return;
    
    try {
      const likedPostIds = new Set<string>();
      for (const post of posts) {
        const response = await api.get(`posts/${post.id}/like-status?userId=${currentUser.id}`);
        if (response.data.liked) {
          likedPostIds.add(post.id);
        }
      }
      setLikedPosts(likedPostIds);
    } catch (error) {
      console.error('Error loading liked posts:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUser) return;

    try {
      setIsPosting(true);
      const response = await api.post(`circles/${circleId}/posts`, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content: newPostContent.trim()
      });

      setPosts(prev => [response.data, ...prev]);
      setNewPostContent('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentContent = newComments[postId];
    if (!commentContent?.trim() || !currentUser) return;

    try {
      const response = await api.post(`posts/${postId}/comments`, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content: commentContent.trim()
      });

      // Update the post with the new comment
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, response.data] }
          : post
      ));

      setNewComments(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      const isLiked = likedPosts.has(postId);
      if (isLiked) {
        await api.delete(`posts/${postId}/like`, { data: { userId: currentUser.id } });
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        // Update post likes count
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: Math.max(0, post.likes - 1) } : post
        ));
      } else {
        await api.post(`posts/${postId}/like`, { userId: currentUser.id });
        setLikedPosts(prev => new Set([...prev, postId]));
        // Update post likes count
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like');
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading circle discussion...</p>
        </div>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Circle not found</h2>
          <button
            onClick={() => onPageChange('circles')}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Back to Circles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onPageChange('circles')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <img
                  src={circle.avatar}
                  alt={circle.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{circle.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{circle.memberCount} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{posts.length} posts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Circle Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-gray-700">{circle.description}</p>
        </div>

        {/* Create Post */}
        {currentUser && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <form onSubmit={handleCreatePost}>
              <div className="flex items-start space-x-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your thoughts with the circle..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newPostContent.trim() || isPosting}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isPosting ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to start a discussion in this circle!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                {/* Post Header */}
                <div className="flex items-start space-x-3 mb-4">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{post.authorName}</h3>
                      <span className="text-sm text-gray-500">•</span>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(post.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => handleLikeToggle(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        likedPosts.has(post.id)
                          ? 'text-red-500'
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length}</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedComments.has(post.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Comments List */}
                    <div className="space-y-4 mb-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">{comment.authorName}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment */}
                    {currentUser && (
                      <div className="flex items-start space-x-3">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 flex space-x-2">
                          <input
                            type="text"
                            value={newComments[post.id] || ''}
                            onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!newComments[post.id]?.trim()}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
