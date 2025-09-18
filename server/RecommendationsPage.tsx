import { useState, useEffect } from 'react';
import { Book, Circle, Loader2 } from 'lucide-react';

// Mock data - replace with actual data fetching from your backend
const mockBooks = [
  { id: 'book1', title: 'The Great Gatsby' },
  { id: 'book2', title: 'To Kill a Mockingbird' },
  { id: 'book3', title: '1984' },
];

const mockCircles = [
  { id: 'circle1', name: 'Classic Literature Fans' },
  { id: 'circle2', name: 'Dystopian Futures' },
  { id: 'circle3', name: 'Modern Classics' },
];

// Mock API call to our backend, which would then call Gemini
const getRecommendations = async (books: typeof mockBooks, circles: typeof mockCircles) => {
  // In a real implementation, this would be a POST request to your backend
  // e.g., await fetch('/api/recommendations', { method: 'POST', body: JSON.stringify({ books, circles }) });
  console.log('Sending to backend for Gemini recommendations:', { books, circles });

  // Simulate network delay and a mock response from Gemini
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        recommendedBookId: 'book3', // e.g., Gemini suggests '1984'
        recommendedCircleId: 'circle2', // e.g., Gemini suggests 'Dystopian Futures'
      });
    }, 2000);
  });
};

const RecommendationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [recommendedBook, setRecommendedBook] = useState(null);
  const [recommendedCircle, setRecommendedCircle] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Here you would fetch the user's books and circles
        const userBooks = mockBooks;
        const userCircles = mockCircles;
        
        const result: any = await getRecommendations(userBooks, userCircles);

        const book = userBooks.find(b => b.id === result.recommendedBookId);
        const circle = userCircles.find(c => c.id === result.recommendedCircleId);

        setRecommendedBook(book ? { id: book.id, title: book.title } : null);
        setRecommendedCircle(circle ? { id: circle.id, name: circle.name } : null);
      } catch (error) {
        console.error('Failed to get recommendations:', error);
        // Handle error state in UI
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">AI Recommendations</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="ml-4 text-lg text-gray-600">Generating recommendations for you...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 flex items-center"><Book className="mr-2" /> Recommended Book</h2>
            {recommendedBook ? (
              <p className="text-lg">{recommendedBook.title}</p>
            ) : (
              <p className="text-gray-500">No book recommendation available.</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 flex items-center"><Circle className="mr-2" /> Recommended Circle</h2>
            {recommendedCircle ? (
              <p className="text-lg">{recommendedCircle.name}</p>
            ) : (
              <p className="text-gray-500">No circle recommendation available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;