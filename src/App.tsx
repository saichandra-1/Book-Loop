import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { CirclesPage } from './pages/CirclesPage';
import { ProfilePage } from './pages/ProfilePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { EditProfileModal } from './components/EditProfileModal';
import { AddBook } from './components/AddBook';
import axios from 'axios';

export type Page = 'home' | 'books' | 'circles' | 'profile' | 'recommendations';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  booksOwned: string[];
  location?: string;
  bio?: string;
  circlesjoined: string[];
  preferences: {
    genres: string[];
    languages: string[];
    authors: string[];
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  language: string;
  ownerId: string;
  ownerName: string;
  available: boolean;
  rating: number;
  reviews: number;
  description: string;
  cover: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
}

export interface ReadingCircle {
  id: string;
  name: string;
  description: string;
  members: string[];
  memberCount: number;
  posts: Post[];
  currentBook?: string;
  avatar: string;
  privacy: 'public' | 'private';
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
}

export interface Trade {
  id: string;
  requesterId: string;
  requesterName: string;
  ownerId: string;
  ownerName: string;
  bookId: string;
  bookTitle: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  requestDate: Date;
  message: string;
}

export interface Notification {
  id: string;
  type: 'trade' | 'circle' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [readingCircles, setReadingCircles] = useState<ReadingCircle[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showAddBook, setShowAddBook] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Check if user is logged in (mock check)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userId = JSON.parse(savedUser);
      const userdetails = async() => {
        const user= await axios.get('http://localhost:5000/api/users/'+userId);
        setCurrentUser({
          id: user.data.id,
          name: user.data.name,
          email: user.data.email,
          avatar: user.data.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150&h=150&fit=crop&crop=face',
          booksOwned: user.data.booksowned || [],
          circlesjoined: user.data.circlesjoined || [],
          preferences: {
            genres: user.data.preferences?.genres || [],
            languages: ['English'],
            authors: user.data.preferences?.authors || []
          }
        });
      }

      const booksdata = async() => {
        const books= await axios.get('http://localhost:5000/api/books/');
        setBooks(books.data);
      }
      booksdata();

      const readingCirclesData = async() => {
        const circles= await axios.get('http://localhost:5000/api/circles/');
        setReadingCircles(circles.data);
      }
      readingCirclesData();

      const tradesdata = async() => {
        const trades= await axios.get('http://localhost:5000/api/trades/user/'+userId);
        setTrades(trades.data);
      }
      tradesdata();

      const notificationsdata = async() => {
        const notifications= await axios.get('http://localhost:5000/api/notifications/');
        setNotifications(notifications.data);
      }
      notificationsdata();

      userdetails();
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async(email: string, password: string) => {
    // Mock login - in real app, this would call your backend API
   const user= await axios.get('http://localhost:5000/api/users/login', { params: { email, password } });
    const exitinguser: User = {
      id: user.data.id,
      name: user.data.name,
      email: user.data.email,
      avatar: user.data.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150&h=150&fit=crop&crop=face',
      booksOwned: user.data.booksowned || [],
      circlesjoined: user.data.circlesjoined || [],
      preferences: {
        genres: user.data.preferences?.genres || [],
        languages: ['English'],
        authors: user.data.preferences?.authors || []
      }
    };
    setCurrentUser(exitinguser);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(exitinguser.id));
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const user= await axios.post('http://localhost:5000/api/users/signup', { name, email, password });
    const newUser: User = {
      id: user.data.id,
      name: user.data.name,
      email: user.data.email,
      avatar: user.data.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150&h=150&fit=crop&crop=face',
      booksOwned: [],
      circlesjoined: [],
      preferences: {
        genres: [],
        languages: ['English'],
        authors: []
      }
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(newUser.id));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    setCurrentPage('home');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    // localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowEditProfile(false);
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} onSignup={handleSignup} />;
  }
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage currentUser={currentUser} onPageChange={setCurrentPage} books={books} readingCircles={readingCircles} trades={trades} />;
      case 'books':
        return <BooksPage currentUser={currentUser} books={books} />;
      case 'circles':
        return <CirclesPage currentUser={currentUser} readingCircles={readingCircles} />;
      case 'profile':
        return <ProfilePage currentUser={currentUser} onEditProfile={() => setShowEditProfile(true)} books={books} readingCircles={readingCircles} trades={trades} setShowAddBook={setShowAddBook} setBooks={setBooks} />;
      case 'recommendations':
        return <RecommendationsPage currentUser={currentUser} books={books} readingCircles={readingCircles} />;
      default:
        return <HomePage currentUser={currentUser} onPageChange={setCurrentPage} books={books} readingCircles={readingCircles} trades={trades} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="pt-16">
        {renderCurrentPage()}
      </main>
      
      {showEditProfile && currentUser && (
        <EditProfileModal
          user={currentUser}
          onSave={handleUpdateProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {showAddBook && currentUser && (
  <AddBook
    owner={currentUser}
    onClose={() => setShowAddBook(false)}
    onBookAdded={(book) => {
      setBooks(prev => [...prev, book]);
      setShowAddBook(false);
    }}
  />
)}
    </div>
  );
}

export default App;