import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, MessageCircle, Gift, Clock, Check, X } from 'lucide-react';
import { Notification, User, Page } from '../App';
import api from '../api';

interface NotificationsPageProps {
  currentUser: User | null;
  onPageChange: (page: Page) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser, onPageChange }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'trade' | 'circle' | 'system'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      if (currentUser?.id) {
        const response = await api.get('notifications/', { params: { userId: currentUser.id } });
        setNotifications(response.data || []);
      } else {
        setNotifications(getMockNotifications());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data if API fails
      setNotifications(getMockNotifications());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => [
    {
      id: 'notif1',
      type: 'trade',
      title: 'Trade Request Accepted',
      message: 'Michael Chen accepted your request for "Digital Minimalism"',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      read: false,
      actionUrl: '/trades'
    },
    {
      id: 'notif2',
      type: 'circle',
      title: 'New Discussion in Mystery Lovers',
      message: 'Sarah started a discussion about "The Thursday Murder Club"',
      timestamp: new Date('2024-01-15T09:15:00Z'),
      read: false,
      actionUrl: '/circles'
    },
    {
      id: 'notif3',
      type: 'trade',
      title: 'New Trade Request',
      message: 'Emma Wilson wants to exchange "The Art of French Cooking"',
      timestamp: new Date('2024-01-14T16:45:00Z'),
      read: true,
      actionUrl: '/trades'
    },
    {
      id: 'notif4',
      type: 'system',
      title: 'Weekly Recommendations Ready',
      message: 'We found 5 new books you might love based on your reading history',
      timestamp: new Date('2024-01-14T08:00:00Z'),
      read: true,
      actionUrl: '/recommendations'
    },
    {
      id: 'notif5',
      type: 'circle',
      title: 'Circle Invitation',
      message: 'You\'ve been invited to join "Philosophy & Deep Thoughts"',
      timestamp: new Date('2024-01-13T14:20:00Z'),
      read: true,
      actionUrl: '/circles'
    },
    {
      id: 'notif6',
      type: 'trade',
      title: 'Trade Completed',
      message: 'Your trade for "Atomic Habits" has been completed successfully',
      timestamp: new Date('2024-01-12T11:30:00Z'),
      read: true,
      actionUrl: '/trades'
    },
    {
      id: 'notif7',
      type: 'circle',
      title: 'New Member Joined',
      message: 'Alex joined your "Science Fiction Enthusiasts" circle',
      timestamp: new Date('2024-01-11T15:45:00Z'),
      read: true,
      actionUrl: '/circles'
    },
    {
      id: 'notif8',
      type: 'system',
      title: 'Account Security',
      message: 'Your password was changed successfully',
      timestamp: new Date('2024-01-10T09:20:00Z'),
      read: true,
      actionUrl: '/profile'
    }
  ];

  const markAsRead = async (id: string) => {
    try {
      await api.put(`notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      if (currentUser?.id) {
        await api.put('notifications/mark-all-read', { userId: currentUser.id });
      }
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Fallback to local update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Fallback to local update
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <Gift className="w-5 h-5 text-green-600" />;
      case 'circle':
        return <MessageCircle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const toDate = (value: any): Date => {
    if (value instanceof Date) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatTimeAgo = (timestamp: any) => {
    const now = new Date();
    const ts = toDate(timestamp);
    const diff = now.getTime() - ts.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // Navigate to the relevant page
      const page = notification.actionUrl.replace('/', '') as any;
      if (page && ['home', 'books', 'circles', 'profile', 'recommendations'].includes(page)) {
        onPageChange(page);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onPageChange('home')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isMarkingAll ? 'Marking...' : 'Mark all read'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'trade', label: 'Trades' },
              { key: 'circle', label: 'Circles' },
              { key: 'system', label: 'System' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'You\'ll see notifications about trades, circles, and updates here.'
                  : `You don't have any ${filter} notifications at the moment.`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                  !notification.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(notification.timestamp)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {notification.actionUrl && (
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View details →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Load more notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
