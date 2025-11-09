import React from 'react';
import { Book, ReadingCircle,Page } from '../App';

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
      b.author.toLowerCase().includes(q)
  );
  const circleResults = circles.filter(
    c => c.name.toLowerCase().includes(q)
  );

  return (
    <div>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 flex justify-end">
          <button
            className="mb-4 text-blue-600 hover:underline"
            onClick={() => onPageChange('home')}
          >
            ← Back to Home
          </button>
       </div>
      <div className="max-w-5xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-6">Search Results for "{query}"</h2>
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Books</h3>
          {bookResults.length === 0 && <div className="text-gray-500">No books found.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {bookResults.map(book => (
            <div key={book.id} className="bg-white rounded shadow p-4">
              <img src={book.cover} alt={book.title} className="h-40 w-full object-cover rounded mb-2" />
              <div className="font-bold">{book.title}</div>
              <div className="text-sm text-gray-600">by {book.author}</div>
              <div className="text-xs text-gray-400">{book.genre}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Circles</h3>
        {circleResults.length === 0 && <div className="text-gray-500">No circles found.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {circleResults.map(circle => (
            <div key={circle.id} className="bg-white rounded shadow p-4">
              <img src={circle.avatar} alt={circle.name} className="h-20 w-20 object-cover rounded-full mb-2 mx-auto" />
              <div className="font-bold text-center">{circle.name}</div>
              <div className="text-sm text-gray-600 text-center">{circle.description}</div>
              <button
                className="mt-2 w-full bg-blue-600 text-white py-1 rounded"
                onClick={() => onPageChange('circle-discussion', circle.id)}
              >
                View Circle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};