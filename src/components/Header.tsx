import React, { useState } from 'react';
import { BookOpen, Home, Users, User, Sparkles, Search, LogOut, Settings } from 'lucide-react';
import { Page, User as UserType } from '../App';
import { NotificationDropdown } from './NotificationDropdown';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  currentPage: Page;
   onPageChange: (page: Page, circleId?: string) => void;
  currentUser: UserType | null;
  onLogout: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
  onViewAllNotifications?: () => void;
  onSearch: (searchTerm: string) => void;
  notifications?: any[];
  onRefreshNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange, currentUser, onLogout, onUpdateUser, onViewAllNotifications, onSearch, notifications, onRefreshNotifications }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navItems = [
    { key: 'home' as Page, label: 'Home', icon: Home },
    { key: 'books' as Page, label: 'Books', icon: BookOpen },
    { key: 'circles' as Page, label: 'Circles', icon: Users },
    { key: 'recommendations' as Page, label: 'Discover', icon: Sparkles },
    { key: 'profile' as Page, label: 'Profile', icon: User },
  ];

  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSearchTerm('');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => window.location.reload()}
              aria-label="Reload BookCircle"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">BookCircle</h1>
            </button>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books, authors, or circles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch(e);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onPageChange(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-3 ml-4">
            <NotificationDropdown 
              onViewAll={onViewAllNotifications} 
              currentUser={currentUser}
              notifications={notifications}
              onRefreshNotifications={onRefreshNotifications}
            />
            
            {currentUser && (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {currentUser.name}
                  </span>
                </button>
                
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={() => onPageChange('profile')}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search books, authors, or circles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch(e);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && currentUser && (
        <SettingsModal
          user={currentUser}
          onClose={() => setShowSettings(false)}
          onUpdateUser={onUpdateUser}
        />
      )}
    </header>
  );
};