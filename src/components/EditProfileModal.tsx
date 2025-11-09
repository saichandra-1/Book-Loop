import React, { useState, useRef } from 'react';
import { X, Camera, Save, User, Mail, MapPin, Plus, Phone } from 'lucide-react';
import api from '../api';
import { User as UserType } from '../App';
 

interface EditProfileModalProps {
  user: UserType;
  onSave: (updatedUser: UserType) => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone || '',
    location: user.location?.address || '',
    bio: user.bio || 'Passionate reader and book enthusiast. Love discovering new stories and connecting with fellow readers.',
    preferences: {
      genres: [...user.preferences.genres],
      languages: [...user.preferences.languages],
      authors: [...user.preferences.authors]
    }
  });
  
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(
    user.location?.coordinates && user.location.coordinates.length === 2 
      ? { lat: user.location.coordinates[1], lng: user.location.coordinates[0] }
      : null
  );
  
  const [newGenre, setNewGenre] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Predefined lists
  const availableGenres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Fantasy', 'Science Fiction',
    'Biography', 'History', 'Self-Help', 'Business', 'Psychology', 'Philosophy',
    'Poetry', 'Drama', 'Adventure', 'Horror', 'Thriller', 'Comedy', 'Crime',
    'Historical Fiction', 'Contemporary Fiction', 'Young Adult', 'Children',
    'Memoir', 'Travel', 'Health & Fitness', 'Cooking', 'Art', 'Music', 'Sports'
  ];
  
  const availableLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Bengali', 'Urdu',
    'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech',
    'Hungarian', 'Romanian', 'Greek', 'Turkish', 'Hebrew', 'Thai', 'Vietnamese'
  ];
  
  const availableAuthors = [
    'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'William Shakespeare',
    'Jane Austen', 'Mark Twain', 'Ernest Hemingway', 'F. Scott Fitzgerald',
    'George Orwell', 'Harper Lee', 'J.R.R. Tolkien', 'Dan Brown', 'John Grisham',
    'Paulo Coelho', 'Haruki Murakami', 'Maya Angelou', 'Toni Morrison',
    'Margaret Atwood', 'Neil Gaiman', 'Gillian Flynn', 'Donna Tartt',
    'Khaled Hosseini', 'Chimamanda Ngozi Adichie', 'Yuval Noah Harari'
  ];
  
  const getCurrentLocation = async () => {
    // Use forward geocoding from the typed address in the input (formData.location)
    const query = (formData.location || '').trim();
    if (!query) {
      alert('Please enter your village/town/city to search.');
      return;
    }
    setIsGettingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'BookLoop/1.0 (support@example.com)' } as any }
      );
      if (!response.ok) {
        if (response.status === 429) {
          alert('Rate limit reached. Please try again later.');
        } else {
          alert('Error searching location. Please try again.');
        }
        return;
      }
      const data: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        alert('No results. Check spelling or try a nearby place.');
        return;
      }
      const first = data[0];
      const coords = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
      setLocationCoords(coords);
      setLocationAccuracy(null);
      setFormData(prev => ({ ...prev, location: first.display_name }));
    } catch (e) {
      alert('Failed to search location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Submitting form data:', formData);
    console.log('User ID:', user.id);
    
    try {
      // Prepare location data
      const locationData = locationCoords ? {
        coordinates: locationCoords,
        address: formData.location
      } : null;
      
      // API call to update user profile
      const response = await api.put(`users/${user.id}/profile`, {
        name: formData.name,
        avatar: formData.avatar,
        phone: formData.phone,
        location: locationData,
        bio: formData.bio,
        preferences: formData.preferences
      });
      
      if (response.status === 200) {
        // Use the response data from the server
        console.log('EditProfileModal - Profile updated successfully:', response.data);
        console.log('EditProfileModal - Location data in response:', response.data.location);
        onSave(response.data);
        onClose();
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // File upload handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type (PNG only)
    if (file.type !== 'image/png') {
      alert('Please select a PNG file only.');
      event.target.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB.');
      event.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormData(prev => ({
          ...prev,
          avatar: e.target!.result as string
        }));
      }
    };
    reader.onerror = () => {
      alert('Error reading the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };
  
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };
  
  const addPreference = (type: 'genres' | 'languages' | 'authors', value: string) => {
    if (value.trim() && !formData.preferences[type].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [type]: [...prev.preferences[type], value.trim()]
        }
      }));
      
      if (type === 'genres') setNewGenre('');
      if (type === 'languages') setNewLanguage('');
      if (type === 'authors') setNewAuthor('');
    }
  };
  
  const addFromPredefined = (type: 'genres' | 'languages' | 'authors', value: string) => {
    if (!formData.preferences[type].includes(value)) {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [type]: [...prev.preferences[type], value]
        }
      }));
    }
  };
  
  const removePreference = (type: 'genres' | 'languages' | 'authors', value: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: prev.preferences[type].filter(item => item !== value)
      }
    }));
  };
  
  const getFilteredList = (type: 'genres' | 'languages' | 'authors') => {
    const lists = {
      genres: availableGenres,
      languages: availableLanguages,
      authors: availableAuthors
    };
    return lists[type].filter(item => !formData.preferences[type].includes(item));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Section with File Upload */}
          <div className="flex items-center space-x-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".png,image/png"
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            
            <div className="relative">
              <img
                src={formData.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={handleCameraClick}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                title="Upload PNG image"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
              <p className="text-gray-600 text-sm">
                Click the camera icon to upload a PNG image (max 5MB)
              </p>
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your location (e.g., San Francisco, CA)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{isGettingLocation ? 'Searching...' : 'Search Location'}</span>
                </button>
                {locationCoords && (
                  <span className="text-sm text-gray-600">
                    Coordinates: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                    {locationAccuracy !== null && ` (±${Math.round(locationAccuracy)}m)`}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about yourself and your reading interests..."
            />
          </div>
          
          {/* Reading Preferences */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Reading Preferences</h3>
            
            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Genres
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.preferences.genres.map((genre, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {genre}
                    <button
                      type="button"
                      onClick={() => removePreference('genres', genre)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  placeholder="Add a custom genre"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreference('genres', newGenre))}
                />
                <button
                  type="button"
                  onClick={() => addPreference('genres', newGenre)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Popular Genres */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Popular genres:</p>
                <div className="flex flex-wrap gap-2">
                  {getFilteredList('genres').slice(0, 10).map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => addFromPredefined('genres', genre)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      + {genre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.preferences.languages.map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                  >
                    {language}
                    <button
                      type="button"
                      onClick={() => removePreference('languages', language)}
                      className="ml-2 text-green-500 hover:text-green-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a custom language"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreference('languages', newLanguage))}
                />
                <button
                  type="button"
                  onClick={() => addPreference('languages', newLanguage)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Popular Languages */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Popular languages:</p>
                <div className="flex flex-wrap gap-2">
                  {getFilteredList('languages').slice(0, 8).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => addFromPredefined('languages', language)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
                    >
                      + {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Authors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Authors
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.preferences.authors.map((author, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                  >
                    {author}
                    <button
                      type="button"
                      onClick={() => removePreference('authors', author)}
                      className="ml-2 text-purple-500 hover:text-purple-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Add a custom author"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPreference('authors', newAuthor))}
                />
                <button
                  type="button"
                  onClick={() => addPreference('authors', newAuthor)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Popular Authors */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Popular authors:</p>
                <div className="flex flex-wrap gap-2">
                  {getFilteredList('authors').slice(0, 8).map((author) => (
                    <button
                      key={author}
                      type="button"
                      onClick={() => addFromPredefined('authors', author)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                    >
                      + {author}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};