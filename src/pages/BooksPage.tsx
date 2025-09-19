import React, { useEffect, useState } from 'react';
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
  const [selectedBook, setSelectedBook] = useState<Book | null>(null); // <-- Add this
  const [showTradeConfirm, setShowTradeConfirm] = useState(false);
  const [tradeDescription, setTradeDescription] = useState('');
  const [tradeContact, setTradeContact] = useState('');
  const [tradeLocation, setTradeLocation] = useState('');
  const [requestedBookIds, setRequestedBookIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(currentUser?.favorites || []));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get('options');
        if (mounted && resp.status === 200) {
          const genArr = Array.isArray(resp.data?.genres) ? resp.data.genres : [];
          const langArr = Array.isArray(resp.data?.languages) ? resp.data.languages : [];
          setAvailableGenres(genArr);
          setAvailableLanguages(langArr);
        }
      } catch (e) {
        // fallback: infer from books
        const inferredGenres = Array.from(new Set(books.map(b => b.genre)));
        const inferredLangs = Array.from(new Set(books.map(b => b.language)));
        setAvailableGenres(inferredGenres);
        setAvailableLanguages(inferredLangs);
      }
    })();
    return () => { mounted = false; };
  }, [books]);

  // Sync local favorites state if current user changes
  useEffect(() => {
    setFavoriteIds(new Set(currentUser?.favorites || []));
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentUser) return;
      try {
        const res = await api.get(`trades/user/${currentUser.id}`);
        if (mounted && res.status === 200 && Array.isArray(res.data)) {
          const pending = res.data.filter((t: any) => t.status === 'pending' && t.requesterId === currentUser.id);
          setRequestedBookIds(new Set(pending.map((t: any) => t.bookId)));
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [currentUser]);

  const genres = ['all', ...availableGenres];
  const conditions = ['all', 'new', 'like-new', 'good', 'fair'];
  const languages = ['all', ...availableLanguages];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
    const matchesCondition = selectedCondition === 'all' || book.condition === selectedCondition;
    const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage;
    const matchesFavorites = !showFavoritesOnly || favoriteIds.has(book.id);
    return matchesSearch && matchesGenre && matchesCondition && matchesLanguage && matchesFavorites;
  });

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
        message: `Hi ${book.ownerName}, I'm interested in trading for "${book.title}".`,
        tradeDescription,
        requesterContact: tradeContact,
        requesterLocation: tradeLocation
      };
      const res = await api.post('trades', payload);
      if (res.status === 201) {
        alert('Trade request sent to owner.');
        setShowTradeConfirm(false);
        setTradeDescription('');
        setTradeContact('');
        setTradeLocation('');
        setRequestedBookIds(prev => new Set([...Array.from(prev), book.id]));
      }
    } catch (e) {
      alert('Failed to send trade request');
    }
  };

  const toggleFavorite = async (bookId: string) => {
    if (!currentUser) return;
    const wasFav = favoriteIds.has(bookId);
    // Optimistic UI update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(bookId); else next.add(bookId);
      return next;
    });

    try {
      if (wasFav) {
        await api.delete(`users/${currentUser.id}/favorites/${bookId}`);
      } else {
        await api.post(`users/${currentUser.id}/favorites/${bookId}`);
      }
    } catch (e) {
      // Revert on failure
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFav) next.add(bookId); else next.delete(bookId);
        return next;
      });
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

              {/* Favorites Only Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(prev => !prev)}
                className={`px-4 py-3 rounded-lg border transition-colors ${showFavoritesOnly ? 'bg-red-100 border-red-200 text-red-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                title="Show only favorite books"
              >
                <span className="inline-flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'text-red-600 fill-current' : ''}`} />
                  {showFavoritesOnly ? 'Favorites only' : 'All books'}
                </span>
              </button>
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

                {/* Favorites Only Toggle - Mobile */}
                <button
                  onClick={() => setShowFavoritesOnly(prev => !prev)}
                  className={`px-4 py-3 rounded-lg border transition-colors ${showFavoritesOnly ? 'bg-red-100 border-red-200 text-red-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  title="Show only favorite books"
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'text-red-600 fill-current' : ''}`} />
                    {showFavoritesOnly ? 'Favorites only' : 'All books'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {sortedBooks.length} book{sortedBooks.length !== 1 ? 's' : ''} found
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
                  <button className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-colors" onClick={(e) => { e.stopPropagation(); toggleFavorite(book.id); }}>
                    <Heart className={`w-4 h-4 ${favoriteIds.has(book.id) ? 'text-red-500 fill-current' : 'text-gray-600'} transition-colors`} />
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
                </div>
                {typeof (book as any).price === 'number' && (book as any).price !== null && (
                  <div className="mb-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">₹{(book as any).price}</span>
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{book.description}</p>

                <div className="flex space-x-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedBook(book);
                      setShowTradeConfirm(true);
                    }}
                    disabled={!book.available || book.ownerId === currentUser?.id || requestedBookIds.has(book.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {book.ownerId === currentUser?.id ? 'Your Book' : requestedBookIds.has(book.id) ? 'Requested' : 'Request'}
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
        {sortedBooks.length === 0 && (
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
                {(selectedBook as any).price !== undefined && (selectedBook as any).price !== null && (
                  <div className="mb-2">
                    <span className="font-medium">Price:</span> ₹{(selectedBook as any).price}
                  </div>
                )}
                <div className="mb-2">
                  <span className="font-medium">Condition:</span> {selectedBook.condition.charAt(0).toUpperCase() + selectedBook.condition.slice(1)}
                </div>
                <div className="mb-2">
                  <span className="font-medium">Owner:</span> {selectedBook.ownerName}
                </div>
                {((selectedBook as any).location?.pincode || (selectedBook as any).location?.address) && (
                  <div className="mb-2 text-sm text-gray-700">
                    <span className="font-medium">Pickup Location:</span> {(selectedBook as any).location?.pincode || ''} {(selectedBook as any).location?.address ? `• ${(selectedBook as any).location.address}` : ''}
                  </div>
                )}
                {(selectedBook as any).ownerContact && (
                  <div className="mb-2 text-sm text-gray-700">
                    <span className="font-medium">Seller Contact:</span> {(selectedBook as any).ownerContact}
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
                    disabled={!selectedBook.available || selectedBook.ownerId === currentUser?.id}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {selectedBook.ownerId === currentUser?.id ? 'Your Book' : 'Request Exchange'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Confirm Modal */}
      {showTradeConfirm && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowTradeConfirm(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Confirm Trade Request</h2>
            <div className="space-y-3 mb-4">
              <div className="text-sm text-gray-700"><span className="font-medium">Book:</span> {selectedBook.title} by {selectedBook.author}</div>
              <div className="text-sm text-gray-700"><span className="font-medium">Owner:</span> {selectedBook.ownerName}</div>
              <div className="text-sm text-gray-700"><span className="font-medium">Condition:</span> {selectedBook.condition}</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Details</label>
                <textarea value={tradeDescription} onChange={e => setTradeDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Describe your offer, availability, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                <input value={tradeContact} onChange={e => setTradeContact(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Email or phone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Location</label>
                <input value={tradeLocation} onChange={e => setTradeLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="City, State" />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                onClick={() => setShowTradeConfirm(false)}
              >
                Back
              </button>
              <button
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => handleRequestExchange(selectedBook.id)}
                disabled={!tradeContact.trim()}
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};