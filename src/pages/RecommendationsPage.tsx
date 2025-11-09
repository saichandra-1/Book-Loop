import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Star, BookOpen, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { User ,Book,ReadingCircle } from '../App';
import axios from 'axios';
import api from '../api';

interface RecommendationsPageProps {
  currentUser: User | null;
  books:Book[],
  readingCircles:ReadingCircle[]
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ currentUser , books,readingCircles }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'books' | 'circles' | 'trending'>('all');
  const [loading, setLoading] = useState(false);
  const [bookRecoIds, setBookRecoIds] = useState<string[]>([]);
  const [circleRecoIds, setCircleRecoIds] = useState<string[]>([]);
  const prefsSigRef = useRef<string | null>(null);

  if (!currentUser) {
    return <div>Please log in to see recommendations</div>;
  }

  const recommendedBooks = useMemo(() => {
    const ids = new Set(bookRecoIds);
    const list = (bookRecoIds.length ? books.filter(b => ids.has(b.id)) : books)
      .filter(book => book.ownerId !== currentUser.id);
    return list.slice(0, 8);
  }, [bookRecoIds, books, currentUser.id]);

  const recommendedCircles = useMemo(() => {
    const ids = new Set(circleRecoIds);
    const list = (circleRecoIds.length ? readingCircles.filter(c => ids.has(c.id)) : readingCircles)
      .filter(circle => !currentUser.circlesjoined.includes(circle.id));
    return list.slice(0, 6);
  }, [circleRecoIds, readingCircles, currentUser.circlesjoined]);

  const trendingBooks = books
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  const filters = [
    { key: 'all', label: 'All Recommendations', icon: Sparkles },
    { key: 'books', label: 'Books for You', icon: BookOpen },
    { key: 'circles', label: 'Circles to Join', icon: Users },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  const handleRequestBook = async (bookId: string) => {
    if (!currentUser) return;
    if (!currentUser.phone || currentUser.phone.trim() === '') {
      alert('Add your phone number in Profile to send trade requests.');
      return;
    }
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    try {
      const payload = {
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        ownerId: book.ownerId,
        ownerName: book.ownerName,
        bookId: book.id,
        bookTitle: book.title,
        message: `Hi ${book.ownerName}, I'm interested in trading for "${book.title}".`
      };
      const res = await api.post('trades', payload);
      if (res.status === 201) alert('Trade request sent');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to send trade request';
      alert(msg);
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    if (!currentUser) return;
    try {
      await axios.post(`http://localhost:5000/api/circles/${circleId}/join`, {
        userId: currentUser.id,
      });
      alert('Joined circle!');
      // Optionally update UI state here
    } catch (err) {
      alert('Failed to join circle');
    }
  };

  const handleRefreshRecommendations = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [booksResp, circlesResp] = await Promise.all([
        api.post('recommend/books', { user: currentUser, books }),
        api.post('recommend/circles', { user: currentUser, circles: readingCircles })
      ]);
      const bookIds = booksResp.data.bookIds || [];
      const circleIds = circlesResp.data.circleIds || [];
      setBookRecoIds(bookIds);
      setCircleRecoIds(circleIds);
      // cache with current signature
      if (prefsSigRef.current) {
        try {
          localStorage.setItem(`reco_sig_${currentUser.id}`, prefsSigRef.current);
          localStorage.setItem(`reco_books_${currentUser.id}`, JSON.stringify(bookIds));
          localStorage.setItem(`reco_circles_${currentUser.id}`, JSON.stringify(circleIds));
        } catch {}
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to refresh recommendations';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Build preference signature; load cache; auto refresh only if preferences changed
  useEffect(() => {
    if (!currentUser) return;
    const owned = books
      .filter(b => b.ownerId === currentUser.id)
      .map(b => ({ id: b.id, g: b.genre, l: b.language }))
      .slice(0, 50);
    const joined = readingCircles
      .filter(c => currentUser.circlesjoined.includes(c.id))
      .map(c => ({ id: c.id }))
      .slice(0, 50);
    const sig = JSON.stringify({
      bio: currentUser.bio || '',
      pref: currentUser.preferences,
      owned,
      joined
    });
    prefsSigRef.current = sig;
    try {
      const cachedSig = localStorage.getItem(`reco_sig_${currentUser.id}`);
      const cachedBooks = localStorage.getItem(`reco_books_${currentUser.id}`);
      const cachedCircles = localStorage.getItem(`reco_circles_${currentUser.id}`);
      if (cachedSig === sig && cachedBooks && cachedCircles) {
        setBookRecoIds(JSON.parse(cachedBooks));
        setCircleRecoIds(JSON.parse(cachedCircles));
      } else if (cachedSig && cachedSig !== sig) {
        // only auto-call when preferences changed
        handleRefreshRecommendations();
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.bio, currentUser?.preferences, books, readingCircles]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover New Books</h1>
            <p className="text-gray-600">Personalized recommendations based on your reading preferences</p>
          </div>
          <button
            onClick={handleRefreshRecommendations}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* AI Insights Card */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Your Reading Profile</h3>
              <p className="text-blue-100 mb-4">
                Based on your preferences for {currentUser.preferences.genres.join(', ')}, 
                we found {recommendedBooks.length} perfect matches for you! 
                You also might enjoy joining circles focused on your favorite authors.
              </p>
              <div className="flex flex-wrap gap-2">
                {currentUser.preferences.genres.map((genre, index) => (
                  <span key={index} className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {filters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key as any)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeFilter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Recommendations Content */}
        {(activeFilter === 'all' || activeFilter === 'books') && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Books Recommended for You</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedBooks.map((book) => (
                <div key={book.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                  <div className="relative">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Match
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        book.available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {book.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                    <div className="flex items-center space-x-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{book.rating}</span>
                      <span className="text-xs text-gray-400">({book.reviews})</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{book.description}</p>
                    <button
                      onClick={() => handleRequestBook(book.id)}
                      disabled={!book.available || !currentUser.phone}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {book.available ? (!currentUser.phone ? 'Add Phone to Request' : 'Request Exchange') : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeFilter === 'all' || activeFilter === 'circles') && (
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Reading Circles You Might Like</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedCircles.map((circle) => (
                <div key={circle.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={circle.avatar}
                        alt={circle.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{circle.name}</h3>
                        <p className="text-sm text-gray-600">{circle.memberCount} members</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Suggested
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{circle.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      {circle.posts.length} recent posts
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      circle.privacy === 'public' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {circle.privacy}
                    </span>
                  </div>
                  <button
                    onClick={() => handleJoinCircle(circle.id)}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Join Circle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeFilter === 'all' || activeFilter === 'trending') && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Trending Books</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingBooks.map((book, index) => (
                <div key={book.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-orange-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                      <div className="flex items-center space-x-2 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{book.rating}</span>
                        <span className="text-xs text-gray-400">({book.reviews} reviews)</span>
                      </div>
                      <button
                        onClick={() => handleRequestBook(book.id)}
                        disabled={!book.available || !currentUser.phone}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {book.available ? (!currentUser.phone ? 'Add Phone to Request' : 'Request Exchange') : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};