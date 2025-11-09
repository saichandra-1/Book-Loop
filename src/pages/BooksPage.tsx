import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, MapPin, Heart, ExternalLink, X } from 'lucide-react';
import { User, Book } from '../App';
import api from '../api';

interface BooksPageProps {
  currentUser: User | null;
  books: Book[];
}

export const BooksPage: React.FC<BooksPageProps> = ({ currentUser, books }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [locationFilter, setLocationFilter] = useState(false);
  const [locationRange, setLocationRange] = useState(5); // in km
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showLocationGate, setShowLocationGate] = useState<string | null>(null);
  const [nearbyBooks, setNearbyBooks] = useState<Book[] | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [ownerDetails, setOwnerDetails] = useState<User | null>(null);

  const genres = ['all', ...Array.from(new Set(books.map(book => book.genre)))];
  const conditions = ['all', 'new', 'like-new', 'good', 'fair'];
  const languages = ['all', ...Array.from(new Set(books.map(book => book.language)))];

  // Derive user location from profile
  useEffect(() => {
    if (currentUser && currentUser.location?.coordinates && currentUser.location.coordinates.length === 2) {
      setUserLocation({ lat: currentUser.location.coordinates[1], lng: currentUser.location.coordinates[0] });
    } else {
      setUserLocation(null);
    }
  }, [currentUser]);

  // Fetch server-side nearby books when filter is on
  useEffect(() => {
    let cancelled = false;
    const fetchNearby = async () => {
      if (!locationFilter || !userLocation) {
        setNearbyBooks(null);
        return;
      }
      setLoadingNearby(true);
      try {
        const res = await api.get('books/', {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: locationRange * 1000, // meters
            excludeUserId: currentUser?.id // exclude current user's books
          }
        });
        if (!cancelled) setNearbyBooks(res.data);
      } catch (e) {
        if (!cancelled) setNearbyBooks([]);
      } finally {
        if (!cancelled) setLoadingNearby(false);
      }
    };
    fetchNearby();
    return () => { cancelled = true; };
  }, [locationFilter, userLocation, locationRange, currentUser?.id]);

  // Load user's favorites
  useEffect(() => {
    if (currentUser) {
      loadFavorites();
    }
  }, [currentUser]);

  // Load seller details when a book is selected
  useEffect(() => {
    let cancelled = false;
    const fetchOwner = async () => {
      if (!selectedBook) {
        setOwnerDetails(null);
        return;
      }
      try {
        const resp = await api.get(`users/${selectedBook.ownerId}`);
        if (!cancelled) setOwnerDetails(resp.data);
      } catch (e) {
        if (!cancelled) setOwnerDetails(null);
      }
    };
    fetchOwner();
    return () => { cancelled = true; };
  }, [selectedBook]);

  const loadFavorites = async () => {
    if (!currentUser) return;
    try {
      const response = await api.get(`users/${currentUser.id}/favorites`);
      const favoriteIds = response.data.map((fav: any) => fav.bookId);
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Filter books based on all criteria
  useEffect(() => {
    const source = locationFilter && userLocation ? (nearbyBooks ?? []) : books;
    let filtered = source.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
      const matchesCondition = selectedCondition === 'all' || book.condition === selectedCondition;
      const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage;
      
      // When Nearby is enabled, server already filtered by location, so no additional filtering needed
      const matchesLocation = !locationFilter || (locationFilter && userLocation);
      
      return matchesSearch && matchesGenre && matchesCondition && matchesLanguage && matchesLocation;
    });
    
    setFilteredBooks(filtered);
  }, [books, nearbyBooks, searchTerm, selectedGenre, selectedCondition, selectedLanguage, locationFilter, locationRange, userLocation]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (bookId: string) => {
    if (!currentUser) return;
    
    try {
      const isFavorited = favorites.has(bookId);
      if (isFavorited) {
        await api.delete(`books/${bookId}/favorite`, { data: { userId: currentUser.id } });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      } else {
        await api.post(`books/${bookId}/favorite`, { userId: currentUser.id });
        setFavorites(prev => new Set([...prev, bookId]));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite');
    }
  };

  // Sort so that current user's books come first
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (currentUser) {
      if (a.ownerId === currentUser.id && b.ownerId !== currentUser.id) return -1;
      if (a.ownerId !== currentUser.id && b.ownerId === currentUser.id) return 1;
    }
    return 0;
  });

  const handleRequestExchange = async (bookId: string) => {
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
      if (res.status === 201) {
        alert('Trade request sent to owner.');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to send trade request';
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Books</h1>
          <p className="text-gray-600">Find your next great read from our community library</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex space-x-4">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Genres</option>
                {genres.slice(1).map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Conditions</option>
                {conditions.slice(1).map(condition => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                {languages.slice(1).map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>

              {/* Location Filter (gated by profile location) */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={locationFilter}
                    onChange={(e) => {
                      if (!userLocation) {
                        setShowLocationGate('To use Nearby filter, set your location in your profile first.');
                        return;
                      }
                      setLocationFilter(e.target.checked);
                    }}
                    className="rounded border-gray-300"
                  />
                  <MapPin className="w-4 h-4" />
                  <span>Nearby</span>
                </label>
                {locationFilter && userLocation && (
                  <select
                    value={locationRange}
                    onChange={(e) => setLocationRange(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value={1}>1km</option>
                    <option value={2}>2km</option>
                    <option value={5}>5km</option>
                    <option value={10}>10km</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Genres</option>
                  {genres.slice(1).map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>

                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Conditions</option>
                  {conditions.slice(1).map(condition => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Languages</option>
                  {languages.slice(1).map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>
              
              {/* Mobile Location Filter (gated) */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>Show nearby books only</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={locationFilter}
                    onChange={(e) => {
                      if (!userLocation) {
                        setShowLocationGate('To use Nearby filter, set your location in your profile first.');
                        return;
                      }
                      setLocationFilter(e.target.checked);
                    }}
                    className="rounded border-gray-300"
                  />
                </div>
                {locationFilter && userLocation && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Within distance:</label>
                    <select
                      value={locationRange}
                      onChange={(e) => setLocationRange(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1km</option>
                      <option value={2}>2km</option>
                      <option value={5}>5km</option>
                      <option value={10}>10km</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loadingNearby && locationFilter ? 'Loading nearby books…' : `${sortedBooks.length} book${sortedBooks.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow group cursor-pointer"
              onClick={() => setSelectedBook(book)}
            >
              <div className="relative">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-64 object-cover rounded-t-xl"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    book.available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {book.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(book.id);
                    }}
                    className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors"
                  >
                    <Heart 
                      className={`w-4 h-4 transition-colors ${
                        favorites.has(book.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-600 hover:text-red-500'
                      }`} 
                    />
                  </button>
                </div>
                <div className="absolute bottom-3 right-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    book.condition === 'new' ? 'bg-green-100 text-green-700' :
                      book.condition === 'like-new' ? 'bg-blue-100 text-blue-700' :
                        book.condition === 'good' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                  }`}>
                    {book.condition === 'like-new' ? 'Like New' : 
                     book.condition.charAt(0).toUpperCase() + book.condition.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-sm">by {book.author}</p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{book.rating}</span>
                    <span className="text-xs text-gray-400">({book.reviews})</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {book.genre}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{book.ownerName}</span>
                  {locationFilter && userLocation && book.location?.coordinates && book.location.coordinates.length === 2 && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        book.location.coordinates[1], // latitude
                        book.location.coordinates[0] // longitude
                      ).toFixed(1)}km away
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{book.description}</p>

                <div className="flex space-x-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRequestExchange(book.id);
                    }}
                    disabled={!book.available || book.ownerId === currentUser?.id || !currentUser?.phone}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {book.ownerId === currentUser?.id ? 'Your Book' : (!currentUser?.phone ? 'Add Phone to Request' : 'Request')}
                  </button>
                  <button
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {sortedBooks.length === 0 && !loadingNearby && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGenre('all');
                setSelectedCondition('all');
                setSelectedLanguage('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Location gate modal */}
      {showLocationGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowLocationGate(null)}
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-2">Location Required</h3>
            <p className="text-sm text-gray-700">{showLocationGate}</p>
          </div>
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedBook(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={selectedBook.cover}
                alt={selectedBook.title}
                className="w-40 h-60 object-cover rounded-lg mx-auto md:mx-0"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedBook.title}</h2>
                <p className="text-gray-700 mb-1">by {selectedBook.author}</p>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{selectedBook.rating}</span>
                  <span className="text-xs text-gray-400">({selectedBook.reviews} reviews)</span>
                </div>
                <div className="mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-2">{selectedBook.genre}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{selectedBook.language}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Condition:</span> {selectedBook.condition.charAt(0).toUpperCase() + selectedBook.condition.slice(1)}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Owner:</span> {selectedBook.ownerName}
                </div>
                {ownerDetails && (
                  <div className="mb-2">
                    <span className="font-medium">Seller Contact:</span>
                    <div className="mt-1 text-sm text-gray-700">
                      {ownerDetails.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {ownerDetails.phone}
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{ownerDetails.location?.address || 'Location not set'}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mb-2">
                  <span className="font-medium">Availability:</span> {selectedBook.available ? 'Available' : 'Unavailable'}
                </div>
                <div className="mb-4">
                  <span className="font-medium">Description:</span>
                  <p className="text-gray-600 mt-1">{selectedBook.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleRequestExchange(selectedBook.id);
                      setSelectedBook(null);
                    }}
                    disabled={!selectedBook.available || selectedBook.ownerId === currentUser?.id || !currentUser?.phone}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {selectedBook.ownerId === currentUser?.id ? 'Your Book' : (!currentUser?.phone ? 'Add Phone to Request' : 'Request Exchange')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};