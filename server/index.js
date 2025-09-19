const express = require("express");
const cors = require("cors");
const {connectDB , User,Book,Trade,ReadingCircle,Comment,Post,Notification,Options} = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple fetch for Node >=18
const doFetch = global.fetch ? global.fetch.bind(global) : null;

// Connect to MongoDB
connectDB();

// Seed default options if none exist
(async () => {
  try {
    const count = await Options.countDocuments();
    if (count === 0) {
      const defaultGenres = [
        'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Fantasy', 'Science Fiction',
        'Biography', 'History', 'Self-Help', 'Business', 'Psychology', 'Philosophy',
        'Poetry', 'Drama', 'Adventure', 'Horror', 'Thriller', 'Comedy', 'Crime',
        'Historical Fiction', 'Contemporary Fiction', 'Young Adult', 'Children',
        'Memoir', 'Travel', 'Health & Fitness', 'Cooking', 'Art', 'Music', 'Sports'
      ];
      const defaultLanguages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
        'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Bengali', 'Urdu',
        'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech',
        'Hungarian', 'Romanian', 'Greek', 'Turkish', 'Hebrew', 'Thai', 'Vietnamese'
      ];
      const defaultAuthors = [
        'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'William Shakespeare',
        'Jane Austen', 'Mark Twain', 'Ernest Hemingway', 'F. Scott Fitzgerald',
        'George Orwell', 'Harper Lee', 'J.R.R. Tolkien', 'Dan Brown', 'John Grisham',
        'Paulo Coelho', 'Haruki Murakami', 'Maya Angelou', 'Toni Morrison',
        'Margaret Atwood', 'Neil Gaiman', 'Gillian Flynn', 'Donna Tartt',
        'Khaled Hosseini', 'Chimamanda Ngozi Adichie', 'Yuval Noah Harari'
      ];
      await Options.create({ genres: defaultGenres, languages: defaultLanguages, authors: defaultAuthors });
      console.log('✅ Seeded default options');
    }
  } catch (err) {
    console.warn('Options seeding skipped/error:', err?.message || err);
  }
})();

// Sample Route
app.get("/", (req, res) => {
  res.send("📚 BookLoop API is running...");
});

//to signup user
app.post("/api/users/signup", async (req, res) => {
  try {
    const { name, email, password, booksowned, circlesjoined, preferences } = req.body;
    const newUser = new User({ name, email, password, booksowned, circlesjoined, preferences });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to login user
app.get("/api/users/login", async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== req.query.password) {
      return res.status(404).json({ message: "User not found or incorrect password" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to leave circle
app.delete("/api/circles/:id/leave", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const circle = await ReadingCircle.findOne({ id });
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }
    
    user.circlesjoined = user.circlesjoined.filter(circleId => circleId !== id);
    circle.members = circle.members.filter(member => member !== userId);
    circle.memberscount = Math.max(0, circle.memberscount - 1);
    
    await user.save();
    await circle.save();
    res.status(200).json({ message: "Left circle !!" });
  } catch (error) {
    console.error("Error leaving circle:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to get user by id
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to update user profile
// Update user profile
app.put("/api/users/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, location, bio, preferences } = req.body;
    
    // Find user by ID and update
    const updatedUser = await User.findOneAndUpdate(
      { id: id },
      {
        name,
        avatar,
        location,
        bio,
        preferences
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to get all books
app.get("/api/books", async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km
    
    let query = {};
    
    // If location parameters are provided, find nearby books
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);
      
      // Simple bounding box approach (for more accurate results, use MongoDB's geospatial queries)
      const latRange = radiusNum / 111; // Rough conversion: 1 degree ≈ 111 km
      const lngRange = radiusNum / (111 * Math.cos(latNum * Math.PI / 180));
      
      query = {
        'location.coordinates.lat': {
          $gte: latNum - latRange,
          $lte: latNum + latRange
        },
        'location.coordinates.lng': {
          $gte: lngNum - lngRange,
          $lte: lngNum + lngRange
        }
      };
    }
    
    const books = await Book.find(query);
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to add book
app.post("/api/addbook", async (req, res) => {
  try {
    const { 
      title, author, genre, language, ownerId, ownerName, available, rating, reviews, 
      description, cover, condition, location, price, isForSale, ownerContact 
    } = req.body;
    
    const newBook = new Book({ 
      title, author, genre, language, ownerId, ownerName, available, rating, reviews, 
      description, cover, condition, location, price, isForSale, ownerContact 
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ message: error.message });  // send actual error message back
  }
});


//to get book by id
app.get("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findOne({ id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    console.error("Error finding book:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Update book
app.put("/api/books/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedBook) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete book
app.delete("/api/books/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findOneAndDelete({ id: req.params.id });
    if (!deletedBook) return res.status(404).json({ message: "Book not found" });
    res.status(200).json({ message: "Book deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

//to get trades by user id
app.get("/api/trades/user/:userId", async (req, res) => {
  try {
    const trades = await Trade.find({ $or: [ { requesterId: req.params.userId }, { ownerId: req.params.userId } ] });
    res.status(200).json(trades);
  } catch (error) {
    console.error("Error fetching trades:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to create trade request
app.post("/api/trades", async (req, res) => {
  try {
    const { requesterId, requesterName, ownerId, ownerName, bookId, bookTitle, message, tradeDescription, requesterContact, requesterLocation } = req.body;
    const newTrade = new Trade({ requesterId, requesterName, ownerId, ownerName, bookId, bookTitle, message, tradeDescription, requesterContact, requesterLocation });
    await newTrade.save();
    
    // Create notification for book owner
    const notification = new Notification({
      userId: ownerId,
      type: 'trade',
      title: 'New Trade Request',
      message: `${requesterName} wants to trade for "${bookTitle}"`,
      actionUrl: '/trades',
      relatedId: newTrade.id
    });
    await notification.save();
    
    res.status(201).json(newTrade);
  } catch (error) {
    console.error("Error creating trade:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to update trade status
app.put("/api/trades/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const trade = await Trade.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }
    
    // Create notification for requester when trade status changes
    let notificationTitle = '';
    let notificationMessage = '';
    
    if (status === 'accepted') {
      notificationTitle = 'Trade Request Accepted';
      notificationMessage = `${trade.ownerName} accepted your request for "${trade.bookTitle}"`;
    } else if (status === 'declined') {
      notificationTitle = 'Trade Request Declined';
      notificationMessage = `${trade.ownerName} declined your request for "${trade.bookTitle}"`;
    } else if (status === 'completed') {
      notificationTitle = 'Trade Completed';
      notificationMessage = `Your trade for "${trade.bookTitle}" has been completed successfully`;
    }
    
    if (notificationTitle) {
      const notification = new Notification({
        userId: trade.requesterId,
        type: 'trade',
        title: notificationTitle,
        message: notificationMessage,
        actionUrl: '/trades',
        relatedId: trade.id
      });
      await notification.save();
    }
    
    res.status(200).json(trade);
  } catch (error) {
    console.error("Error updating trade:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Favorite endpoints
app.get('/api/users/:userId/favorites', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ favorites: user.favorites || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/:userId/favorites/:bookId', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const bookId = req.params.bookId;
    if (!user.favorites.includes(bookId)) user.favorites.push(bookId);
    await user.save();
    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/users/:userId/favorites/:bookId', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const bookId = req.params.bookId;
    user.favorites = (user.favorites || []).filter(id => id !== bookId);
    await user.save();
    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//to get all reading circles
// app.get("/api/circles", async (req, res) => {
//   try {
//     const circles = await ReadingCircle.find();
//     res.status(200).json(circles);
//   } catch (error) {
//     console.error("Error fetching circles:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });


app.get('/api/circles', async (req, res) => {
  try {
    const circles = await ReadingCircle.find().lean();

    // Step 1: Collect all post UUIDs from all circles
    const allPostIds = circles.flatMap(c => c.posts || []);

    if (allPostIds.length === 0) {
      // No posts found, return circles with empty posts arrays
      const circlesWithPosts = circles.map(circle => ({
        ...circle,
        posts: []
      }));
      return res.json(circlesWithPosts);
    }

    // Step 2: Get all posts using their UUIDs
    const posts = await Post.find({ id: { $in: allPostIds } }).lean();

    // Step 3: Collect all comment UUIDs from all posts
    const allCommentIds = posts.flatMap(p => p.comments || []);

    let comments = [];
    if (allCommentIds.length > 0) {
      // Step 4: Get all comment documents
      comments = await Comment.find({ id: { $in: allCommentIds } }).lean();
    }

    // Step 5: Group comments by postId (now this will work since we added postId to schema)
    const commentsByPostId = comments.reduce((acc, comment) => {
      if (!acc[comment.postId]) acc[comment.postId] = [];
      acc[comment.postId].push(comment);
      return acc;
    }, {});

    // Step 6: Attach comments to posts and group posts by circleId
    const postsByCircleId = {};
    for (const post of posts) {
      // Attach comments to this post
      post.comments = commentsByPostId[post.id] || [];

      // Group posts by circleId
      if (!postsByCircleId[post.circleId]) {
        postsByCircleId[post.circleId] = [];
      }
      postsByCircleId[post.circleId].push(post);
    }

    // Step 7: Attach posts to circles
    const circlesWithPosts = circles.map(circle => ({
      ...circle,
      memberCount: typeof circle.memberscount === 'number' ? circle.memberscount : (circle.members ? circle.members.length : 0),
      posts: postsByCircleId[circle.id] || []
    }));

    res.json(circlesWithPosts);
  } catch (err) {
    console.error('Error fetching circles with nested posts and comments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


//to join a circle
app.post("/api/circles/:id/join", async (req, res) => {
  const userId = req.body.userId;
  const circleId = req.params.id;

  try {
    const circle = await ReadingCircle.findOne({ id: circleId });
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    if (user.circlesjoined.includes(circleId)) {
      return res.status(400).json({ message: "Already a member" });
    }

    // Join the circle
    user.circlesjoined.push(circleId);
    circle.members.push(userId);
    circle.memberscount += 1;

    await user.save();
    await circle.save();

    // Create notification for other circle members
    const otherMembers = circle.members.filter(memberId => memberId !== userId);
    for (const memberId of otherMembers) {
      const notification = new Notification({
        userId: memberId,
        type: 'circle',
        title: 'New Member Joined',
        message: `${user.name} joined "${circle.name}"`,
        actionUrl: '/circles',
        relatedId: circleId
      });
      await notification.save();
    }

    res.status(200).json({ message: "Joined circle successfully" });
  } catch (error) {
    console.error("Error joining circle:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to create reading circle
app.post("/api/addcircles", async (req, res) => {
  try {
    const { name, description, members, currentbook, avatar, privacy } = req.body;
    const newCircle = new ReadingCircle({ 
      name, 
      description, 
      members: members || [], 
      memberscount: members ? members.length : 0, 
      currentbook, 
      avatar, 
      privacy 
    });
    await newCircle.save();
    res.status(201).json(newCircle);
  } catch (error) {
    console.error("Error creating circle:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to get circle by id
app.get("/api/circles/:id", async (req, res) => {
  try {
    const circle = await ReadingCircle.findOne({ id: req.params.id });
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Get posts for this circle
    const posts = await Post.find({ circleId: circle.id });
    
    // Get comments for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ postId: post.id });
        return {
          ...post.toObject(),
          comments: comments
        };
      })
    );

    const circleWithPosts = {
      ...circle.toObject(),
      memberCount: typeof circle.memberscount === 'number' ? circle.memberscount : (circle.members ? circle.members.length : 0),
      posts: postsWithComments
    };

    res.status(200).json(circleWithPosts);
  } catch (error) {
    console.error("Error finding circle:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to add post to circle
app.post("/api/circles/:id/posts", async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, content } = req.body;
    const circle = await ReadingCircle.findOne({ id: req.params.id });
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }
    const newPost = new Post({ authorId, authorName, authorAvatar, circleId: circle.id, content });
    await newPost.save();
    circle.posts.push(newPost.id);
    await circle.save();
    
    // Create notification for other circle members
    const otherMembers = circle.members.filter(memberId => memberId !== authorId);
    for (const memberId of otherMembers) {
      const notification = new Notification({
        userId: memberId,
        type: 'circle',
        title: 'New Discussion',
        message: `${authorName} started a discussion in "${circle.name}"`,
        actionUrl: '/circles',
        relatedId: circle.id
      });
      await notification.save();
    }
    
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Recommendation endpoints (Gemini placeholder with heuristic fallback)
app.post('/api/recommend/books', async (req, res) => {
  try {
    const { user, books, topK = 8 } = req.body || {};
    if (!user || !Array.isArray(books)) {
      return res.status(400).json({ message: 'user and books are required' });
    }

    const payload = {
      user: { id: user.id, preferences: user.preferences || {} },
      candidates: books.map(b => ({ id: b.id, title: b.title, author: b.author, genre: b.genre, language: b.language, rating: b.rating, reviews: b.reviews, available: b.available, ownerId: b.ownerId })),
      instruction: 'From the provided candidates, suggest up to topK book ids that best match the user preferences. Respond ONLY as JSON: { "bookIds": ["id1", "id2", ...] }',
      topK
    };

    let recommendedIds = [];

    if (doFetch && process.env.GEMINI_API_KEY) {
      try {
        const resp = await doFetch('https://api.google.gemini.com/v1/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data && Array.isArray(data.bookIds)) recommendedIds = data.bookIds;
      } catch (e) {
        console.warn('Gemini books recommend error, using fallback');
      }
    }

    if (recommendedIds.length === 0) {
      const prefGenres = (user.preferences?.genres || []).map(g => String(g).toLowerCase());
      const prefAuthors = (user.preferences?.authors || []).map(a => String(a).toLowerCase());
      const scored = books
        .filter(b => b.ownerId !== user.id)
        .map(b => {
          let score = 0;
          if (prefGenres.some(g => String(b.genre || '').toLowerCase().includes(g))) score += 2;
          if (prefAuthors.some(a => String(b.author || '').toLowerCase().includes(a))) score += 2;
          score += (Number(b.rating) || 0) * 0.2;
          score += (Number(b.reviews) || 0) * 0.01;
          if (b.available) score += 0.5;
          return { id: b.id, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      recommendedIds = scored.map(s => s.id);
    }

    res.json({ bookIds: recommendedIds });
  } catch (error) {
    console.error('Error in /api/recommend/books:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/recommend/circles', async (req, res) => {
  try {
    const { user, circles, topK = 6 } = req.body || {};
    if (!user || !Array.isArray(circles)) {
      return res.status(400).json({ message: 'user and circles are required' });
    }

    const payload = {
      user: { id: user.id, preferences: user.preferences || {}, joined: user.circlesjoined || [] },
      candidates: circles.map(c => ({ id: c.id, name: c.name, description: c.description, privacy: c.privacy, memberCount: c.memberCount || c.memberscount || (c.members ? c.members.length : 0) })),
      instruction: 'From the provided candidates, suggest up to topK circle ids the user should join. Respond ONLY as JSON: { "circleIds": ["id1", "id2", ...] }',
      topK
    };

    let recommendedIds = [];

    if (doFetch && process.env.GEMINI_API_KEY) {
      try {
        const resp = await doFetch('https://api.google.gemini.com/v1/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (data && Array.isArray(data.circleIds)) recommendedIds = data.circleIds;
      } catch (e) {
        console.warn('Gemini circles recommend error, using fallback');
      }
    }

    if (recommendedIds.length === 0) {
      const already = new Set(user.circlesjoined || []);
      const prefGenres = (user.preferences?.genres || []).map(g => String(g).toLowerCase());
      const scored = circles
        .filter(c => !already.has(c.id))
        .map(c => {
          let score = 0;
          const desc = String(c.description || '').toLowerCase();
          if (prefGenres.some(g => desc.includes(g))) score += 2;
          score += (Number(c.memberCount || c.memberscount || (c.members ? c.members.length : 0)) || 0) * 0.01;
          return { id: c.id, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      recommendedIds = scored.map(s => s.id);
    }

    res.json({ circleIds: recommendedIds });
  } catch (error) {
    console.error('Error in /api/recommend/circles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//to add comment to post
app.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const { authorId, authorName, authorAvatar, content } = req.body;
    const post = await Post.findOne({ id: req.params.id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Include postId when creating the comment
    const newComment = new Comment({ 
      postId: post.id, // ADD THIS LINE
      authorId, 
      authorName, 
      authorAvatar, 
      content 
    });
    await newComment.save();
    post.comments.push(newComment.id);
    await post.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Notification endpoints
// Get all notifications for a user
app.get("/api/notifications", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const notifications = await Notification.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to 50 most recent notifications
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { id: req.params.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Options endpoints
// Get current options (genres, languages, authors)
app.get('/api/options', async (req, res) => {
  try {
    let options = await Options.findOne();
    if (!options) {
      options = new Options({});
      await options.save();
    }
    res.status(200).json({
      genres: options.genres || [],
      languages: options.languages || [],
      authors: options.authors || []
    });
  } catch (error) {
    console.error('Error fetching options:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upsert options (admin/backfill)
app.put('/api/options', async (req, res) => {
  try {
    const { genres = [], languages = [], authors = [] } = req.body || {};
    const existing = await Options.findOne();
    if (existing) {
      existing.genres = Array.isArray(genres) ? genres : existing.genres;
      existing.languages = Array.isArray(languages) ? languages : existing.languages;
      existing.authors = Array.isArray(authors) ? authors : existing.authors;
      await existing.save();
      return res.status(200).json(existing);
    }
    const created = new Options({ genres, languages, authors });
    await created.save();
    res.status(201).json(created);
  } catch (error) {
    console.error('Error upserting options:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
app.put("/api/notifications/mark-all-read", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete notification
app.delete("/api/notifications/:id", async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ id: req.params.id });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});




// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
