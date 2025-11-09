import React, { useEffect } from 'react';
import { BookOpen, Users, TrendingUp, Clock, Star, ArrowRight, ExternalLink } from 'lucide-react';
import { User, Page,Book, ReadingCircle,Trade } from '../App';
import api from '../api';

interface HomePageProps {
  currentUser: User | null;
  onPageChange: (page: Page) => void;
  books: Book[];
  readingCircles: ReadingCircle[];
  trades: Trade[];
  setTrades: (trades: Trade[]) => void; // <-- add this
}

export const HomePage: React.FC<HomePageProps> = ({ currentUser, onPageChange ,books ,readingCircles ,trades, setTrades }) => {
  const recentBooks = books.slice(0, 4);
  const popularCircles = readingCircles.slice(0, 3);
  const pendingTrades = trades.filter(trade => 
    (trade.requesterId === currentUser?.id || trade.ownerId === currentUser?.id) && 
    trade.status === 'pending'
  ).slice(0, 3);

  const stats = [
    { label: 'Books Available', value: '12.5K', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Active Circles', value: '2.3K', icon: Users, color: 'bg-green-500' },
    { label: 'Books Exchanged', value: '8.7K', icon: TrendingUp, color: 'bg-purple-500' },
  ];


  // useEffect(() => {
  //   window.location.reload();
  // }, []);

  const handlePendingRequestTrade = async (tradeId: string) => {
    // Implement trade request handling logic here
    // /api/trades/:id
    const res = await api.put(`/trades/${tradeId}`, { status: 'accepted' });
    if (res.status === 200) {
      alert('Trade request accepted!');
      // Optionally, refresh the trades list or update state
    } else {
      alert('Failed to accept trade request. Please try again.');
    }
  };

  const handleTradeAction = async (tradeId: string, action: 'accepted' | 'declined') => {
    const res = await api.put(`/trades/${tradeId}`, { status: action });
    if (res.status === 200) {
      setTrades(trades.map(trade =>
        trade.id === tradeId ? { ...trade, status: action } : trade
      ));
    } else {
      alert('Failed to update trade. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Discover, Share, and
              <span className="text-yellow-300"> Connect</span> Through Books
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of book lovers exchanging stories, sharing insights, and building meaningful connections through reading circles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onPageChange('books')}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Books
              </button>
              <button 
                onClick={() => onPageChange('circles')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
              >
                Join a Circle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Trades */}
        {pendingTrades.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pending Trades</h2>
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
               onClick={() => onPageChange('profile')}>
                View all <ArrowRight className="ml-1 w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pendingTrades.map((trade) => (
                <div key={trade.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{trade.bookTitle}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {trade.requesterId === currentUser?.id 
                      ? `Requested from ${trade.ownerName}`
                      : `Requested by ${trade.requesterName}`
                    }
                  </p>
                  <div className="flex space-x-2">
                    <button
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      onClick={() => handleTradeAction(trade.id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      onClick={() => handleTradeAction(trade.id, 'declined')}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Books */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recently Added Books</h2>
            <button 
              onClick={() => onPageChange('books')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                <div className="relative">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
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
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{book.rating}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-600">{book.reviews} reviews</span>
                  </div>
                    <button
                      onClick={() => onPageChange('books')}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Request Exchange
                      <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Circles */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Reading Circles</h2>
            <button 
              onClick={() => onPageChange('circles')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularCircles.map((circle) => (
              <div key={circle.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={circle.avatar}
                      alt={circle.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {circle.name}
                      </h3>
                      <p className="text-sm text-gray-600">{circle.memberCount} members</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    circle.privacy === 'public' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {circle.privacy}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{circle.description}</p>
                <button
                  onClick={() => onPageChange('circles')}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Join Circle
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};