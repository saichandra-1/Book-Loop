const mongoose = require("mongoose");
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

const userschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  location: { 
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  bio: { type: String, default: null },
  booksowned: { type: [String], default: [] },
  circlesjoined: { type: [String], default: [] },
  favorites: { type: [String], default: [] },
  preferences: { 
    genres: { type: [String], default: [] },
    authors: { type: [String], default: [] },
    languages: { type: [String], default: [] }
  }
});

const booksschema= new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  language: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  available: { type: Boolean, default: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, default: 0 },
  description: { type: String, required: true },
  cover: { type: String, required: true },
  condition: { type: String, required: true },
  location: { 
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  price: { type: Number, default: null }, // For selling books
  isForSale: { type: Boolean, default: false }
});

const commentschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  postId: { type: String, required: true }, // ADD THIS LINE
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: null },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const postschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: null },
  circleId: { type: String, required: true }, // reference by UUID
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  comments: [{ type: String }],  // Now storing comment UUIDs as strings
  likes: { type: Number, default: 0 }
});

const readingcircleschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  name: { type: String, required: true },
  description: { type: String, required: true },
  members: { type: [String], default: [] },
  memberscount: { type: Number, default: 0 },
  posts: [{ type: String }],  // Now storing UUIDs as strings
  currentbook: { type: String, default: null },
  avatar: { type: String, default: null },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' }
});


const tradeschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  requesterId: { type: String, required: true },
  requesterName: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerName: { type: String, required: true },
  bookId: { type: String, required: true },
  bookTitle: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  requestDate: { type: Date, default: Date.now },
  message: { type: String, default: '' },
  tradeDescription: { type: String, default: '' },
  requesterContact: { type: String, default: '' },
  requesterLocation: { type: String, default: '' }
});

const notificationschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  userId: { type: String, required: true },
  type: { type: String, enum: ['trade', 'circle', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  actionUrl: { type: String, default: null },
  relatedId: { type: String, default: null } // ID of related trade, circle, etc.
});

// Global options for genres / languages / authors
const optionsschema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => uuidv4() },
  genres: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  authors: { type: [String], default: [] }
});


const User = mongoose.model("User", userschema);
const Book = mongoose.model("Book", booksschema);
const ReadingCircle = mongoose.model("ReadingCircle", readingcircleschema);
const Comment = mongoose.model('Comment', commentschema);
const Trade = mongoose.model('Trade', tradeschema);
const Post = mongoose.model('Post', postschema);
const Notification = mongoose.model('Notification', notificationschema);
const Options = mongoose.model('Options', optionsschema);

module.exports ={
  connectDB,
    User,
    Book,
    ReadingCircle,
    Comment,
    Post,
    Trade,
    Notification,
    Options
};
