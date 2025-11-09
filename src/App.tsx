import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { CirclesPage } from './pages/CirclesPage';
import { ProfilePage } from './pages/ProfilePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CircleDiscussionPage } from './pages/CircleDiscussionPage';
import { EditProfileModal } from './components/EditProfileModal';
import { AddBook } from './components/AddBook';
import api from './api';
import { SearchResultsPage } from './pages/SearchResultsPage';

export type Page = 'home' | 'books' | 'circles' | 'profile' | 'recommendations' | 'notifications' | 'circle-discussion'|'search';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  booksOwned: string[];
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude] for MongoDB format
    address?: string;
  };
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
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude] for MongoDB format
    address?: string;
  };
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
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude] for MongoDB format
    address?: string;
  };
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in (mock check)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userId = JSON.parse(savedUser);
      const userdetails = async() => {
        const user= await api.get('users/'+userId);
        setCurrentUser({
          id: user.data.id,
          name: user.data.name,
          email: user.data.email,
          avatar: user.data.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
          phone: user.data.phone || undefined,
          location: user.data.location || undefined,
          booksOwned: user.data.booksowned || [],
          circlesjoined: user.data.circlesjoined || [],
          preferences: {
            genres: user.data.preferences?.genres || [],
            languages: user.data.preferences?.languages || ['English'],
            authors: user.data.preferences?.authors || []
          }
        });
      }

      const booksdata = async() => {
        const books= await api.get('books/');
        setBooks(books.data);
      }
      booksdata();

      const readingCirclesData = async() => {
        const circles= await api.get('circles/');
        setReadingCircles(circles.data);
      }
      readingCirclesData();

      const tradesdata = async() => {
        const trades= await api.get('trades/user/'+userId);
        setTrades(trades.data);
      }
      tradesdata();

      const notificationsdata = async() => {
        const notifications= await api.get('notifications/', { params: { userId: userId } });
        setNotifications(notifications.data);
      }
      notificationsdata();

      userdetails();
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async(email: string, password: string) => {
    // Mock login - in real app, this would call your backend API
   const user= await api.get('users/login', { params: { email, password } });
    const exitinguser: User = {
      id: user.data.id,
      name: user.data.name,
      email: user.data.email,
      avatar: user.data.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150&h=150&fit=crop&crop=face',
      phone: user.data.phone || undefined,
      location: user.data.location || undefined,
      booksOwned: user.data.booksowned || [],
      circlesjoined: user.data.circlesjoined || [],
      preferences: {
        genres: user.data.preferences?.genres || [],
        languages: user.data.preferences?.languages || ['English'],
        authors: user.data.preferences?.authors || []
      }
    };
    setCurrentUser(exitinguser);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(exitinguser.id));
    
    // Reload the page to trigger fresh data loading
    window.location.reload();
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const user= await api.post('users/signup', { name, email, password });
    const newUser: User = {
      id: user.data.id,
      name: user.data.name,
      email: user.data.email,
      avatar: user.data.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=150&h=150&fit=crop&crop=face',
      phone: user.data.phone || undefined,
      location: user.data.location || undefined,
      booksOwned: [],
      circlesjoined: [],
      preferences: {
        genres: user.data.preferences?.genres || [],
        languages: user.data.preferences?.languages || ['English'],
        authors: user.data.preferences?.authors || []
      }
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(newUser.id));
    
    // Reload the page to trigger fresh data loading
    window.location.reload();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    setCurrentPage('home');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    console.log('App - handleUpdateProfile called with:', updatedUser);
    console.log('App - Updated user location:', updatedUser.location);
    setCurrentUser(updatedUser);
    // localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowEditProfile(false);
  };

  const handlePageChange = (page: Page, circleId?: string) => {
  setCurrentPage(page);
  if (page !== 'search') setSearchQuery(null);
  if (circleId) setSelectedCircleId(circleId);
};

  const renderCurrentPage = () => {
    if (searchQuery) {
      return (
        <SearchResultsPage
          query={searchQuery}
          books={books}
          circles={readingCircles}
          onPageChange={handlePageChange}
        />
      );
    }
    switch (currentPage) {
      case 'home':
        return <HomePage currentUser={currentUser} onPageChange={setCurrentPage} books={books} readingCircles={readingCircles} trades={trades} setTrades={setTrades} />;
      case 'books':
        return <BooksPage currentUser={currentUser} books={books} />;
      case 'circles':
        return <CirclesPage currentUser={currentUser} readingCircles={readingCircles} onPageChange={handlePageChange} />;
      case 'profile':
        return <ProfilePage currentUser={currentUser} onEditProfile={() => setShowEditProfile(true)} books={books} readingCircles={readingCircles} trades={trades} setShowAddBook={setShowAddBook} setBooks={setBooks} setTrades={setTrades} onPageChange={handlePageChange} />;
      case 'recommendations':
        return <RecommendationsPage currentUser={currentUser} books={books} readingCircles={readingCircles} />;
      case 'notifications':
        return <NotificationsPage currentUser={currentUser} onPageChange={setCurrentPage} />;
      case 'circle-discussion':
        return <CircleDiscussionPage currentUser={currentUser} circleId={selectedCircleId} onPageChange={setCurrentPage} />;
      default:
        return <HomePage currentUser={currentUser} onPageChange={setCurrentPage} books={books} readingCircles={readingCircles} trades={trades} setTrades={setTrades} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthPage
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentPage={currentPage} 
        onPageChange={handlePageChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateProfile}
        onViewAllNotifications={() => handlePageChange('notifications')}
        onSearch={q => {
          setSearchQuery(q);
          setCurrentPage('search');
        }}
        notifications={notifications}
        onRefreshNotifications={async () => {
          if (currentUser?.id) {
            try {
              const notificationsResponse = await api.get('notifications/', { params: { userId: currentUser.id } });
              setNotifications(notificationsResponse.data);
            } catch (error) {
              console.error('Error refreshing notifications:', error);
            }
          }
        }}
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
            setBooks((prev: typeof books) => [...prev, book]);
            setShowAddBook(false);
          }}
        />
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowNotifications(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Notifications</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.length === 0 && <div className="text-gray-500">No notifications.</div>}
              {notifications.map((n: { id: string; title: string; message: string; timestamp: string | number | Date }) => (
                <div key={n.id} className="border-b pb-2">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm text-gray-600">{n.message}</div>
                  <div className="text-xs text-gray-400">{new Date(n.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
