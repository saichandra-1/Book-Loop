import React, { useState, useEffect } from 'react';
import { Users, Star, MapPin, Edit3, Settings, Heart, Calendar, Award, AlertCircle } from 'lucide-react';
import { Book, User,ReadingCircle,Trade } from '../App';
import { EditBook } from '../components/EditBook';
import api from '../api';

interface ProfilePageProps {
  currentUser: User | null;
  onEditProfile: () => void;
  books: Book[],
  setBooks: (books: Book[]) => void; // <-- add this
  readingCircles: ReadingCircle[],
  trades: Trade[],
  setShowAddBook: (show: boolean) => void;
  setTrades: (trades: Trade[]) => void; // <-- add this
  onPageChange?: (page: any, circleId?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser, onEditProfile , books ,readingCircles ,trades , setShowAddBook , setBooks , setTrades, onPageChange
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'trades' | 'circles' | 'stats'>('books');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [counterparty, setCounterparty] = useState<User | null>(null);

  // Check if user has location set
  useEffect(() => {
    console.log('ProfilePage - Checking location for user:', currentUser?.id);
    console.log('ProfilePage - User location data:', currentUser?.location);
    
    if (currentUser && (!currentUser.location?.coordinates || currentUser.location.coordinates.length === 0)) {
      console.log('ProfilePage - Setting location alert to true');
      setShowLocationAlert(true);
    } else if (currentUser && currentUser.location?.coordinates && currentUser.location.coordinates.length === 2) {
      console.log('ProfilePage - Setting location alert to false');
      setShowLocationAlert(false);
    }
  }, [currentUser]);

  // Load counterparty details when a trade is selected
  useEffect(() => {
    let cancelled = false;
    const fetchCounterparty = async () => {
      if (!selectedTrade || !currentUser) {
        setCounterparty(null);
        return;
      }
      const otherId = selectedTrade.requesterId === currentUser.id ? selectedTrade.ownerId : selectedTrade.requesterId;
      try {
        const resp = await api.get(`users/${otherId}`);
        if (!cancelled) setCounterparty(resp.data);
      } catch (e) {
        if (!cancelled) setCounterparty(null);
      }
    };
    fetchCounterparty();
    return () => { cancelled = true; };
  }, [selectedTrade, currentUser]);

  if (!currentUser) {
    return <div>Please log in to view your profile</div>;
  }

  const userBooks = books.filter(book => book.ownerId === currentUser.id);
  const userTrades = trades.filter(trade =>
    trade.requesterId === currentUser.id || trade.ownerId === currentUser.id
  );
  const userCircles = readingCircles.filter(circle =>
    currentUser.circlesjoined.includes(circle.id)
  );
  const [showEditBook, setShowEditBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

// Remove book handler
const handleRemoveBook = async (bookId: string) => {
  if (!window.confirm("Are you sure you want to remove this book?")) return;
  await api.delete(`/books/${bookId}`);
  setBooks(books.filter(b => b.id !== bookId)); // update state, no reload
};

// Leave circle handler
const handleLeaveCircle = async (circleId: string) => {
  if (!window.confirm("Are you sure you want to leave this circle?")) return;
  try {
    const res = await api.delete(`circles/${circleId}/leave`, {
      data: { userId: currentUser.id },
    });
    if (res.status === 200) {
      // Update the user's circlesjoined array
      currentUser.circlesjoined = currentUser.circlesjoined.filter(id => id !== circleId);
      alert(res.data.message);
    }
  } catch (error) {
    console.error('Error leaving circle:', error);
    alert('Failed to leave circle');
  }
};

  // Accept/Decline trade handler
  const handleTradeAction = async (tradeId: string, action: 'accepted' | 'declined') => {
    try {
      const res = await api.put(`/trades/${tradeId}`, { status: action });
      if (res.status === 200) {
        setTrades(
          trades.map((trade: Trade) =>
            trade.id === tradeId ? { ...trade, status: action } : trade
          )
        );
      } else {
        alert('Failed to update trade. Please try again.');
      }
    } catch (err) {
      alert('Error updating trade.');
    }
  };

  const stats = {
    booksOwned: userBooks.length,
    tradesCompleted: userTrades.filter(trade => trade.status === 'completed').length,
    circlesjoined: userCircles.length,
    totalRating: userBooks.reduce((sum, book) => sum + book.rating, 0) / userBooks.length || 0
  };

  const tabs = [
    { key: 'books' as const, label: 'My Books', count: userBooks.length },
    { key: 'trades' as const, label: 'Trades', count: userTrades.length },
    { key: 'circles' as const, label: 'Circles', count: userCircles.length },
    { key: 'stats' as const, label: 'Statistics', count: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Alert */}
        {showLocationAlert && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Location Required
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  To find nearby books and circles, please add your location to your profile. 
                  This helps other users find you for book trades and local reading circles.
                </p>
                <div className="mt-3">
                  <button
                    onClick={onEditProfile}
                    className="text-sm bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Add Location
                  </button>
                  <button
                    onClick={() => setShowLocationAlert(false)}
                    className="text-sm text-yellow-600 hover:text-yellow-800 ml-3"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
            <div className="relative mb-6 md:mb-0">
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
                <button 
                  onClick={onEditProfile}
                  className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentUser.name}</h1>
                  <p className="text-gray-600 mb-4">{currentUser.email}</p>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {currentUser.location?.address || 'Location not set'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={onEditProfile}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.booksOwned}</div>
                  <div className="text-sm text-gray-600">Books Owned</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.tradesCompleted}</div>
                  <div className="text-sm text-gray-600">Trades</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.circlesjoined}</div>
                  <div className="text-sm text-gray-600">Circles</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.totalRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'books' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Books</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" 
                    onClick={() => setShowAddBook(true)}
                  >
                    + Add Book
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userBooks.map((book) => (
                    <div key={book.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                        <div className="flex items-center space-x-2 mb-3">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{book.rating}</span>
                        </div>
                        <div className="flex space-x-2">
  <button
    className="flex-1 text-xs bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
    onClick={() => { setEditingBook(book); setShowEditBook(true); }}
  >
    Edit
  </button>
  <button
    className="flex-1 text-xs bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors"
    onClick={() => handleRemoveBook(book.id)}
  >
    Remove
  </button>
</div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'trades' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Trade History</h2>
                <div className="space-y-4">
                  {userTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{trade.bookTitle}</h3>
                          <p className="text-gray-600 text-sm">
                            {trade.requesterId === currentUser.id 
                              ? `Requested from ${trade.ownerName}`
                              : `Requested by ${trade.requesterName}`
                            }
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          trade.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          trade.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          trade.status === 'declined' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{trade.message}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(trade.requestDate).toLocaleDateString()}
                      </div>
                      {trade.status === 'pending' && (
              <div className="flex space-x-2 mt-4">
                <button
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  onClick={e => {
                    e.stopPropagation();
                    handleTradeAction(trade.id, 'accepted');
                  }}
                >
                  Accept
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  onClick={e => {
                    e.stopPropagation();
                    handleTradeAction(trade.id, 'declined');
                  }}
                >
                  Decline
                </button>
              </div>
            )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'circles' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">My Reading Circles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userCircles.map((circle) => (
                    <div key={circle.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <img
                          src={circle.avatar}
                          alt={circle.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{circle.name}</h3>
                          <p className="text-gray-600 text-sm">{circle.memberCount} members</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{circle.description}</p>
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Reading Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Achievement Cards */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Award className="w-6 h-6 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900">Book Collector</p>
                          <p className="text-sm text-gray-600">Added 10+ books to your collection</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <Users className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">Social Reader</p>
                          <p className="text-sm text-gray-600">Joined 5+ reading circles</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Heart className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Helpful Member</p>
                          <p className="text-sm text-gray-600">Completed 5+ successful trades</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reading Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Reading Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Favorite Genres</p>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.preferences.genres.map((genre, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Languages</p>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.preferences.languages.map((language, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Favorite Authors</p>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.preferences.authors.map((author, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                              {author}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
{showEditBook && editingBook && (
  <EditBook
    book={editingBook}
    onClose={() => setShowEditBook(false)}
    onBookUpdated={(updatedBook) => {
      setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b)); // update state, no reload
      setShowEditBook(false);
    }}
  />
)}

{/* Trade Details Modal */}
  {selectedTrade && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-lg relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setSelectedTrade(null)}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4">Trade Details</h2>
        <div className="mb-2">
          <span className="font-medium">Book:</span> {selectedTrade.bookTitle}
        </div>
        <div className="mb-2">
          <span className="font-medium">Requester:</span> {selectedTrade.requesterName}
        </div>
        <div className="mb-2">
          <span className="font-medium">Owner:</span> {selectedTrade.ownerName}
        </div>
        {counterparty && (
          <div className="mb-2">
            <span className="font-medium">Contact:</span>
            <div className="mt-1 text-sm text-gray-700">
              {counterparty.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {counterparty.phone}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{counterparty.location?.address || 'Location not set'}</span>
              </div>
            </div>
          </div>
        )}
        <div className="mb-2">
          <span className="font-medium">Status:</span> {selectedTrade.status}
        </div>
        <div className="mb-2">
          <span className="font-medium">Requested On:</span> {new Date(selectedTrade.requestDate).toLocaleString()}
        </div>
        <div className="mb-2">
          <span className="font-medium">Message:</span> {selectedTrade.message}
        </div>
      </div>
    </div>
  )}
    </div>
  );
};