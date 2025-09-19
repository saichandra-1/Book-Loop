import React from 'react';
import { Book, ReadingCircle, Page } from '../App';
import { BookOpen, Users, Star, MapPin } from 'lucide-react';

interface SearchResultsPageProps {
  query: string;
  books: Book[];
  circles: ReadingCircle[];
  onPageChange: (page: Page, circleId?: string) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  query, books, circles, onPageChange
}) => {
  const q = query.toLowerCase();
  const bookResults = books.filter(
    b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
  );
  const circleResults = circles.filter(
    c => 
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );

  const totalResults = bookResults.length + circleResults.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="flex justify-between items-center mb-6">
          <button
            className="flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            onClick={() => onPageChange('home')}
          >
            ← Back to Home
          </button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} 
            ({bookResults.length} book{bookResults.length !== 1 ? 's' : ''}, {circleResults.length} circle{circleResults.length !== 1 ? 's' : ''})
          </p>
        </div>

        {/* Books Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <BookOpen className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Books</h2>
            <span className="ml-2 text-sm text-gray-500">({bookResults.length})</span>
          </div>
          
          {bookResults.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No books found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bookResults.map(book => (
                <div key={book.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {book.genre}
                      </span>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{book.rating}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Owner: {book.ownerName}
                    </div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                      book.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.available ? 'Available' : 'Not Available'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Circles Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Reading Circles</h2>
            <span className="ml-2 text-sm text-gray-500">({circleResults.length})</span>
          </div>
          
          {circleResults.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No circles found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {circleResults.map(circle => (
                <div key={circle.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={circle.avatar} 
                      alt={circle.name} 
                      className="w-16 h-16 object-cover rounded-full mr-4" 
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{circle.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {circle.memberCount} members
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {circle.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      circle.privacy === 'public' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {circle.privacy === 'public' ? 'Public' : 'Private'}
                    </span>
                    <button
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      onClick={() => onPageChange('circle-discussion', circle.id)}
                    >
                      Join Circle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No Results Message */}
        {totalResults === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              Try searching with different keywords or check your spelling.
            </p>
            <button
              onClick={() => onPageChange('home')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Books & Circles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};