// import { ReadingCircle, Trade, Post, Reply,} from '../App';

// export const mockUsers: User[] = [
//   {
//     id: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     name: 'Sarah Johnson',
//     email: 'sarah.johnson@email.com',
//     avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150&h=150&fit=crop&crop=face',
//     booksOwned: ['book1', 'book2', 'book3'],
//     circlesjoined: ['circle1', 'circle2'],
//     preferences: {
//       genres: ['Fiction', 'Mystery', 'Romance'],
//       languages: ['English', 'Spanish'],
//       authors: ['Agatha Christie', 'Jane Austen']
//     }
//   }
// ];

// export const mockBooks: Book[] = [
//   {
//     id: 'book1',
//     title: 'The Mystery of Blackwood Manor',
//     author: 'Eleanor Hartwell',
//     genre: 'Mystery',
//     language: 'English',
//     ownerId: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     ownerName: 'Sarah Johnson',
//     available: true,
//     rating: 4.5,
//     reviews: 127,
//     description: 'A gripping mystery set in the English countryside, where secrets from the past threaten to destroy a family\'s legacy.',
//     cover: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?w=400&h=600&fit=crop',
//     condition: 'like-new'
//   },
//   {
//     id: 'book2',
//     title: 'Digital Minimalism',
//     author: 'Cal Newport',
//     genre: 'Self-Help',
//     language: 'English',
//     ownerId: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     ownerName: 'Michael Chen',
//     available: true,
//     rating: 4.2,
//     reviews: 89,
//     description: 'A philosophy for maintaining focus and purpose in an increasingly connected world.',
//     cover: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?w=400&h=600&fit=crop',
//     condition: 'good'
//   },
//   {
//     id: 'book3',
//     title: 'The Art of French Cooking',
//     author: 'Marie Dubois',
//     genre: 'Cooking',
//     language: 'English',
//     ownerId: 'user3',
//     ownerName: 'Emma Wilson',
//     available: false,
//     rating: 4.8,
//     reviews: 203,
//     description: 'Master the fundamentals of French cuisine with this comprehensive guide to traditional techniques and recipes.',
//     cover: 'https://images.pexels.com/photos/1112048/pexels-photo-1112048.jpeg?w=400&h=600&fit=crop',
//     condition: 'new'
//   },
//   {
//     id: 'book4',
//     title: 'Quantum Physics Explained',
//     author: 'Dr. James Rodriguez',
//     genre: 'Science',
//     language: 'English',
//     ownerId: 'user4',
//     ownerName: 'David Park',
//     available: true,
//     rating: 4.1,
//     reviews: 56,
//     description: 'An accessible introduction to the fascinating world of quantum mechanics and its implications.',
//     cover: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=600&fit=crop',
//     condition: 'good'
//   },
//   {
//     id: 'book5',
//     title: 'Love in the Time of AI',
//     author: 'Sofia Martinez',
//     genre: 'Romance',
//     language: 'English',
//     ownerId: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     ownerName: 'Lisa Anderson',
//     available: true,
//     rating: 4.3,
//     reviews: 142,
//     description: 'A modern love story exploring human connection in an age of artificial intelligence.',
//     cover: 'https://images.pexels.com/photos/2067569/pexels-photo-2067569.jpeg?w=400&h=600&fit=crop',
//     condition: 'like-new'
//   },
//   {
//     id: 'book6',
//     title: 'The History of Ancient Rome',
//     author: 'Professor Marcus Aurelius',
//     genre: 'History',
//     language: 'English',
//     ownerId: 'user6',
//     ownerName: 'Robert Thompson',
//     available: true,
//     rating: 4.6,
//     reviews: 98,
//     description: 'A comprehensive look at the rise and fall of one of history\'s greatest civilizations.',
//     cover: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?w=400&h=600&fit=crop',
//     condition: 'fair'
//   },
//   {
//     id: 'book7',
//     title: 'Mindfulness for Beginners',
//     author: 'Dr. Sarah Kim',
//     genre: 'Self-Help',
//     language: 'English',
//     ownerId: 'user7',
//     ownerName: 'Jennifer Liu',
//     available: true,
//     rating: 4.4,
//     reviews: 175,
//     description: 'Learn the fundamentals of mindfulness meditation and how to incorporate it into daily life.',
//     cover: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?w=400&h=600&fit=crop',
//     condition: 'new'
//   },
//   {
//     id: 'book8',
//     title: 'The Space Explorer\'s Guide',
//     author: 'Captain Alex Turner',
//     genre: 'Science Fiction',
//     language: 'English',
//     ownerId: 'user8',
//     ownerName: 'Mark Davis',
//     available: true,
//     rating: 4.7,
//     reviews: 234,
//     description: 'Join an interstellar journey through the cosmos in this thrilling science fiction adventure.',
//     cover: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=400&h=600&fit=crop',
//     condition: 'good'
//   }
// ];

// const mockReplies: Reply[] = [
//   {
//     id: 'reply1',
//     authorId: 'user2',
//     authorName: 'Michael Chen',
//     authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=150&h=150&fit=crop&crop=face',
//     content: 'I completely agree! The character development was exceptional.',
//     timestamp: new Date('2024-01-14T15:30:00Z')
//   },
//   {
//     id: 'reply2',
//     authorId: 'user3',
//     authorName: 'Emma Wilson',
//     authorAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=150&h=150&fit=crop&crop=face',
//     content: 'Which character did you find most relatable?',
//     timestamp: new Date('2024-01-14T16:00:00Z')
//   }
// ];

// const mockPosts: Post[] = [
//   {
//     id: 'post1',
//     authorId: 'user1',
//     authorName: 'Sarah Johnson',
//     authorAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150&h=150&fit=crop&crop=face',
//     content: 'Just finished "The Seven Husbands of Evelyn Hugo" and I\'m emotionally devastated in the best way possible! The storytelling was absolutely brilliant. Has anyone else read this masterpiece?',
//     timestamp: new Date('2024-01-15T10:30:00Z'),
//     likes: 23,
//     replies: mockReplies
//   },
//   {
//     id: 'post2',
//     authorId: 'user4',
//     authorName: 'David Park',
//     authorAvatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?w=150&h=150&fit=crop&crop=face',
//     content: 'Our book club selection for March is "Educated" by Tara Westover. Looking forward to discussing themes of education and family dynamics with everyone!',
//     timestamp: new Date('2024-01-14T14:20:00Z'),
//     likes: 15,
//     replies: []
//   },
//   {
//     id: 'post3',
//     authorId: 'user5',
//     authorName: 'Lisa Anderson',
//     authorAvatar: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?w=150&h=150&fit=crop&crop=face',
//     content: 'Does anyone have recommendations for mystery novels similar to Agatha Christie? I love the classic whodunit style!',
//     timestamp: new Date('2024-01-13T18:45:00Z'),
//     likes: 31,
//     replies: []
//   }
// ];

// export const mockCircles: ReadingCircle[] = [
//   {
//     id: 'circle1',
//     name: 'Mystery Lovers United',
//     description: 'A community for mystery and thriller enthusiasts. We discuss classic detective stories, modern psychological thrillers, and everything in between. Join us for monthly book discussions and author spotlights.',
//     members: ['user1', 'user2', 'user5', 'user8'],
//     memberCount: 247,
//     posts: mockPosts,
//     currentBook: 'book1',
//     avatar: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?w=150&h=150&fit=crop',
//     privacy: 'public'
//   },
//   {
//     id: 'circle2',
//     name: 'Sci-Fi Explorers',
//     description: 'Exploring the vast universe of science fiction literature. From classic authors like Asimov and Clarke to contemporary voices, we journey through space, time, and imagination together.',
//     members: ['user1', 'user3', 'user4', 'user7'],
//     memberCount: 189,
//     posts: [mockPosts[1]],
//     currentBook: 'book8',
//     avatar: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?w=150&h=150&fit=crop',
//     privacy: 'public'
//   },
//   {
//     id: 'circle3',
//     name: 'Romance & Relationships',
//     description: 'Celebrating love stories in all their forms. We read contemporary romance, historical fiction, and explore how relationships are portrayed across different cultures and time periods.',
//     members: ['user2', 'user3', 'user5', 'user6'],
//     memberCount: 312,
//     posts: [mockPosts[2]],
//     avatar: 'https://images.pexels.com/photos/2067569/pexels-photo-2067569.jpeg?w=150&h=150&fit=crop',
//     privacy: 'public'
//   },
//   {
//     id: 'circle4',
//     name: 'Philosophy & Deep Thoughts',
//     description: 'For readers who love to contemplate life\'s big questions. We explore philosophical works, thought-provoking essays, and books that challenge our understanding of the world.',
//     members: ['user4', 'user6', 'user7', 'user8'],
//     memberCount: 156,
//     posts: [],
//     avatar: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?w=150&h=150&fit=crop',
//     privacy: 'private'
//   },
//   {
//     id: 'circle5',
//     name: 'Historical Fiction Society',
//     description: 'Journey through different eras and cultures with historical fiction. We discuss how authors bring the past to life and explore the historical accuracy of our favorite novels.',
//     members: ['user1', 'user6', 'user8'],
//     memberCount: 203,
//     posts: [],
//     avatar: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?w=150&h=150&fit=crop',
//     privacy: 'public'
//   }
// ];

// export const mockTrades: Trade[] = [
//   {
//     id: 'trade1',
//     requesterId: 'user2',
//     requesterName: 'Michael Chen',
//     ownerId: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     ownerName: 'Sarah Johnson',
//     bookId: 'book1',
//     bookTitle: 'The Mystery of Blackwood Manor',
//     status: 'pending',
//     requestDate: new Date('2024-01-15T09:00:00Z'),
//     message: 'Hi! I\'d love to read this mystery novel. I have several books to offer in exchange!'
//   },
//   {
//     id: 'trade2',
//     requesterId: 'user1',
//     requesterName: 'Sarah Johnson',
//     ownerId: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     ownerName: 'Emma Wilson',
//     bookId: 'book3',
//     bookTitle: 'The Art of French Cooking',
//     status: 'accepted',
//     requestDate: new Date('2024-01-12T14:30:00Z'),
//     message: 'This cookbook looks amazing! I\'d love to try some French recipes.'
//   },
//   {
//     id: 'trade3',
//     requesterId: 'user4',
//     requesterName: 'David Park',
//     ownerId: '5f8579d8-f880-4ede-a741-564e0c6430af',
//     ownerName: 'Sarah Johnson',
//     bookId: 'book1',
//     bookTitle: 'The Mystery of Blackwood Manor',
//     status: 'completed',
//     requestDate: new Date('2024-01-08T11:15:00Z'),
//     message: 'I\'ve been looking for a good mystery to read during my commute.'
//   },
//   {
//     id: 'trade4',
//     requesterId: 'user1',
//     requesterName: 'Sarah Johnson',
//     ownerId: 'user5',
//     ownerName: 'Lisa Anderson',
//     bookId: 'book5',
//     bookTitle: 'Love in the Time of AI',
//     status: 'pending',
//     requestDate: new Date('2024-01-14T16:45:00Z'),
//     message: 'The concept sounds fascinating! I\'d love to read about modern romance.'
//   },
//   {
//     id: 'trade5',
//     requesterId: 'user6',
//     requesterName: 'Robert Thompson',
//     ownerId: 'user1',
//     ownerName: 'Sarah Johnson',
//     bookId: 'book2',
//     bookTitle: 'Digital Minimalism',
//     status: 'declined',
//     requestDate: new Date('2024-01-10T13:20:00Z'),
//     message: 'I need to declutter my digital life. This book seems perfect for that!'
//   }
// ];