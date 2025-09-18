import { useState } from 'react';
import { Send } from 'lucide-react';

// Mock data, replace with data from your backend
const initialPosts = {
  'circle1': [{ id: 'post1', author: 'Jane Doe', content: 'Just finished chapter 3, what a twist!' }],
};

const MyCircles = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const activeCircleId = 'circle1'; // This would be dynamic based on user selection

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const postData = {
      circleId: activeCircleId,
      content: newPostContent,
      // authorId would come from the authenticated user session
    };

    // In a real app, this would be a POST request to your API
    // const response = await fetch('/api/circle-posts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(postData),
    // });
    // if (!response.ok) { /* handle error */ return; }

    // --- Mocking the backend response for UI update ---
    const newPost = {
      id: `post_${Date.now()}`,
      author: 'You',
      content: newPostContent,
    };

    setPosts(prevPosts => ({
      ...prevPosts,
      [activeCircleId]: [...(prevPosts[activeCircleId] || []), newPost],
    }));
    // --- End Mock ---

    setNewPostContent('');
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Circle Feed</h3>
      <div className="space-y-4 mb-6">
        {(posts[activeCircleId] || []).map((post: { id: string; author: string; content: string }) => (
          <div key={post.id} className="bg-white p-3 rounded shadow">
            <p className="font-semibold">{post.author}</p>
            <p className="text-gray-700">{post.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handlePostSubmit} className="flex items-center gap-2">
        <input type="text" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Write a post..." className="flex-grow p-2 border rounded-md" />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={!newPostContent.trim()}><Send size={20} /></button>
      </form>
    </div>
  );
};

export default MyCircles;