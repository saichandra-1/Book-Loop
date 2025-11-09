const express = require("express");
const cors = require("cors");
const {connectDB , User,Book,Trade,ReadingCircle,Comment,Post,Notification,Favorite,Like} = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple fetch for Node >=18
const doFetch = global.fetch ? global.fetch.bind(global) : null;

// Utility function to calculate distance between two coordinates
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Reverse geocoding function to get address from coordinates
const reverseGeocode = async (lat, lng) => {
  try {
    // Try multiple geocoding services for better accuracy
    let address = null;
    
    // First try: OpenStreetMap Nominatim (more accurate for Indian locations)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        let addressParts = [];
        
        // For Indian addresses, try to get more specific information
        if (data.address.village) {
          addressParts.push(data.address.village);
        } else if (data.address.town) {
          addressParts.push(data.address.town);
        } else if (data.address.city) {
          addressParts.push(data.address.city);
        } else if (data.address.suburb) {
          addressParts.push(data.address.suburb);
        }
        
        if (data.address.county) {
          addressParts.push(data.address.county);
        } else if (data.address.state) {
          addressParts.push(data.address.state);
        }
        
        if (data.address.country) {
          addressParts.push(data.address.country);
        }
        
        if (addressParts.length > 0) {
          address = addressParts.join(', ');
        }
      }
    } catch (error) {
      console.log('Nominatim geocoding failed, trying backup service...');
    }
    
    // Fallback: BigDataCloud if Nominatim fails
    if (!address) {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();
        
        let addressParts = [];
        
        // Add locality/village/town first (most specific)
        if (data.locality) {
          addressParts.push(data.locality);
        } else if (data.city) {
          addressParts.push(data.city);
        }
        
        // Add administrative area (district/state)
        if (data.principalSubdivision) {
          addressParts.push(data.principalSubdivision);
        }
        
        // Add country
        if (data.countryName) {
          addressParts.push(data.countryName);
        }
        
        // If we have specific parts, join them
        if (addressParts.length > 0) {
          address = addressParts.join(', ');
        }
      } catch (error) {
        console.log('BigDataCloud geocoding also failed');
      }
    }
    
    // Final fallback to coordinates
    return address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// Connect to MongoDB
connectDB();

// Sample Route
app.get("/", (req, res) => {
  res.send("📚 BookLoop API is running...");
});

//to signup user
app.post("/api/users/signup", async (req, res) => {
  try {
    const { name, email, password, phone, booksowned, circlesjoined, preferences } = req.body;
    const newUser = new User({ name, email, password, phone, booksowned, circlesjoined, preferences });
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
    const { name, avatar, phone, location, bio, preferences } = req.body;
    
    let locationData = location;
    
    // If location has coordinates, format it properly for MongoDB
    if (location && location.coordinates && location.coordinates.lat && location.coordinates.lng) {
      const address = location.address || await reverseGeocode(location.coordinates.lat, location.coordinates.lng);
      locationData = {
        type: "Point",
        coordinates: [location.coordinates.lng, location.coordinates.lat], // MongoDB uses [lng, lat]
        address: address
      };
    }
    
    // Find user by ID and update
    const updatedUser = await User.findOneAndUpdate(
      { id: id },
      {
        name,
        avatar,
        phone,
        location: locationData,
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
    const { lat, lng, radius = 5000, excludeUserId } = req.query; // radius in meters, default 5km

    // If no location provided, return all books
    if (!lat || !lng) {
      const books = await Book.find({});
      return res.status(200).json(books);
    }     

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);
    const geometry = {
      type: "Point",
      coordinates: [lngNum, latNum] // MongoDB uses [longitude, latitude]
    };

    // 1) Books that have their own location near
    const booksByLocation = await Book.find({
      location: {
        $near: {
          $geometry: geometry,
          $maxDistance: radiusNum
        }
      }
    }).lean();

    // 2) Books whose owners are near (using user profile location)
    const nearUsers = await User.find({
      location: {
        $near: {
          $geometry: geometry,
          $maxDistance: radiusNum
        }
      }
    }, { id: 1 }).lean();
    const userIdsNear = new Set(nearUsers.map(u => u.id));

    let booksByOwner = [];
    if (userIdsNear.size > 0) {
      booksByOwner = await Book.find({ ownerId: { $in: Array.from(userIdsNear) } }).lean();
    }

    // 3) Merge and de-duplicate
    const map = new Map();
    for (const b of [...booksByLocation, ...booksByOwner]) {
      map.set(b.id, b);
    }
    let merged = Array.from(map.values());

    // 4) Exclude books owned by the requesting user
    if (excludeUserId) {
      merged = merged.filter(book => book.ownerId !== excludeUserId);
    }

    return res.status(200).json(merged);
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
      description, cover, condition, location, price, isForSale 
    } = req.body;
    
    let locationData = location;
    
    // If location has coordinates, format it properly for MongoDB
    if (location && location.coordinates && location.coordinates.lat && location.coordinates.lng) {
      const address = location.address || await reverseGeocode(location.coordinates.lat, location.coordinates.lng);
      locationData = {
        type: "Point",
        coordinates: [location.coordinates.lng, location.coordinates.lat], // MongoDB uses [lng, lat]
        address: address
      };
    }
    
    const newBook = new Book({ 
      title, author, genre, language, ownerId, ownerName, available, rating, reviews, 
      description, cover, condition, location: locationData, price, isForSale 
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
    const { requesterId, requesterName, ownerId, ownerName, bookId, bookTitle, message } = req.body;
    // Require requester to have a phone number before creating a trade request
    const requester = await User.findOne({ id: requesterId });
    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }
    if (!requester.phone || String(requester.phone).trim() === "") {
      return res.status(400).json({ message: "Phone number required to send trade requests" });
    }
    const newTrade = new Trade({ requesterId, requesterName, ownerId, ownerName, bookId, bookTitle, message });
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
    const { lat, lng, radius = 5000 } = req.query; // radius in meters, default 5km
    
    let query = {};
    
    // If location parameters are provided, use MongoDB geospatial query
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);
      
      query = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lngNum, latNum] // Note: MongoDB uses [longitude, latitude]
            },
            $maxDistance: radiusNum
          }
        }
      };
    }
    
    let circles = await ReadingCircle.find(query).lean();

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

// Recommendation endpoints (Placeholder with heuristic fallback)
app.post('/api/recommend/books', async (req, res) => {
  try {
    const { user, books, topK = 8 } = req.body || {};
    if (!user || !Array.isArray(books)) {
      return res.status(400).json({ message: 'user and books are required' });
    }

    const userDoc = await User.findOne({ id: user.id }).lean();
    if (!userDoc) return res.status(404).json({ message: 'User not found' });
    const ownedBooks = await Book.find({ ownerId: user.id }).select('id title genre language').lean();
    const joinedCircleIds = Array.isArray(userDoc.circlesjoined) ? userDoc.circlesjoined : [];
    const joinedCircles = joinedCircleIds.length
      ? await ReadingCircle.find({ id: { $in: joinedCircleIds } }).select('id name description privacy').lean()
      : [];

    const prefsSignature = JSON.stringify({
      bio: userDoc.bio || '',
      preferences: userDoc.preferences || {},
      ownedBooks: ownedBooks.map(b => ({ id: b.id, title: b.title, genre: b.genre, language: b.language })),
      joined: joinedCircles.map(c => ({ id: c.id, name: c.name }))
    });

    const cache = (globalThis.__recoCache = globalThis.__recoCache || { books: new Map(), circles: new Map() });
    const cached = cache.books.get(user.id);
    if (cached && cached.prefsSignature === prefsSignature && Array.isArray(cached.ids) && cached.ids.length > 0) {
      console.log(`[LLM] books: cache hit user=${user.id} ids=${cached.ids.length}`);
      return res.json({ bookIds: cached.ids.slice(0, topK) });
    }

    const candidates = books
      .filter(b => b.ownerId !== user.id)
      .map(b => ({ id: b.id, title: b.title, author: b.author, genre: b.genre, language: b.language, rating: b.rating, reviews: b.reviews, available: b.available }));

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_SITE = process.env.OPENROUTER_SITE_URL || 'http://localhost';
    const OPENROUTER_TITLE = process.env.OPENROUTER_APP_TITLE || 'BookLoop';
    const MODEL = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';

    let recommendedIds = [];

    if (OPENROUTER_API_KEY && global.fetch) {
      try {
        console.log(`[LLM] books: request sent user=${user.id} candidates=${candidates.length} topK=${topK}`);
        const systemPrompt = `You are a recommendation engine for a book sharing app (BookLoop).

REQUIREMENTS:
1. Respond with VALID JSON ONLY. No prose, no markdown.
2. Use the EXACT keys defined in the schema.
3. Return up to "topK" items in ranking order.
4. Only include ids that exist in "candidates".
5. Never include the current user's own items.

JSON SCHEMA:
{
  "bookIds": ["<book-id-1>", "<book-id-2>", "..."]
}`;
        const userPayload = {
          instruction: 'From the candidates, return up to topK book ids that best match the user. Respond strictly as { "bookIds": ["id1", ...] }',
          topK,
          user: {
            id: user.id,
            bio: userDoc.bio || '',
            preferences: userDoc.preferences || {},
            ownedBooks: ownedBooks.map(b => ({ id: b.id, title: b.title, genre: b.genre, language: b.language })),
            joinedCircles: joinedCircles.map(c => ({ id: c.id, name: c.name }))
          },
          candidates
        };
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': OPENROUTER_SITE,
            'X-Title': OPENROUTER_TITLE,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: JSON.stringify(userPayload) }
            ],
            temperature: 0.2
          })
        });
        console.log(`[LLM] books: response received status=${resp.status}`);
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || '';
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const parsed = JSON.parse(content.slice(start, end + 1));
          if (parsed && Array.isArray(parsed.bookIds)) {
            recommendedIds = parsed.bookIds.filter(id => typeof id === 'string');
          }
        }
        if (!Array.isArray(recommendedIds) || recommendedIds.length === 0) {
          console.warn('[LLM] books: empty recommendation list from model');
          return res.status(502).json({ message: 'LLM failed to produce recommendations' });
        }
        console.log(`[LLM] books: parsed ids=${recommendedIds.length}`);
      } catch (e) {
        console.error('[LLM] books: call failed', e);
        return res.status(502).json({ message: 'LLM error: unable to get recommendations' });
      }
    } else {
      console.log('[LLM] books: skipping LLM (no API key); using heuristic fallback');
      const prefGenres = (userDoc.preferences?.genres || []).map(g => String(g).toLowerCase());
      const prefAuthors = (userDoc.preferences?.authors || []).map(a => String(a).toLowerCase());
      const scored = candidates
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

    cache.books.set(user.id, { prefsSignature, ids: recommendedIds, updatedAt: Date.now() });
    console.log(`[LLM] books: cache store user=${user.id} ids=${recommendedIds.length}`);
    return res.json({ bookIds: recommendedIds.slice(0, topK) });
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

    const userDoc = await User.findOne({ id: user.id }).lean();
    if (!userDoc) return res.status(404).json({ message: 'User not found' });
    const ownedBooks = await Book.find({ ownerId: user.id }).select('id title genre language').lean();
    const joinedCircleIds = Array.isArray(userDoc.circlesjoined) ? userDoc.circlesjoined : [];
    const joinedCircles = joinedCircleIds.length
      ? await ReadingCircle.find({ id: { $in: joinedCircleIds } }).select('id name description privacy').lean()
      : [];

    const prefsSignature = JSON.stringify({
      bio: userDoc.bio || '',
      preferences: userDoc.preferences || {},
      ownedBooks: ownedBooks.map(b => ({ id: b.id, title: b.title, genre: b.genre, language: b.language })),
      joined: joinedCircles.map(c => ({ id: c.id, name: c.name }))
    });

    const cache = (globalThis.__recoCache = globalThis.__recoCache || { books: new Map(), circles: new Map() });
    const cached = cache.circles.get(user.id);
    if (cached && cached.prefsSignature === prefsSignature && Array.isArray(cached.ids) && cached.ids.length > 0) {
      console.log(`[LLM] circles: cache hit user=${user.id} ids=${cached.ids.length}`);
      return res.json({ circleIds: cached.ids.slice(0, topK) });
    }

    const already = new Set(joinedCircleIds);
    const candidates = circles
      .filter(c => !already.has(c.id))
      .map(c => ({ id: c.id, name: c.name, description: c.description, privacy: c.privacy, memberCount: c.memberCount || c.memberscount || (c.members ? c.members.length : 0) }));

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_SITE = process.env.OPENROUTER_SITE_URL || 'http://localhost';
    const OPENROUTER_TITLE = process.env.OPENROUTER_APP_TITLE || 'BookLoop';
    const MODEL = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';

    let recommendedIds = [];

    if (OPENROUTER_API_KEY && global.fetch) {
      try {
        console.log(`[LLM] circles: request sent user=${user.id} candidates=${candidates.length} topK=${topK}`);
        const systemPrompt = `You are a recommendation engine for reading circles in BookLoop.

REQUIREMENTS:
1. Respond with VALID JSON ONLY. No prose, no markdown.
2. Use the EXACT keys defined in the schema.
3. Return up to "topK" items in ranking order.
4. Only include ids that exist in "candidates".
5. Never include circles the user already joined.

JSON SCHEMA:
{
  "circleIds": ["<circle-id-1>", "<circle-id-2>", "..."]
}`;
        const userPayload = {
          instruction: 'From the candidate circles, return up to topK circle ids the user should join. Respond strictly as { "circleIds": ["id1", ...] }',
          topK,
          user: {
            id: user.id,
            bio: userDoc.bio || '',
            preferences: userDoc.preferences || {},
            ownedBooks: ownedBooks.map(b => ({ id: b.id, title: b.title, genre: b.genre, language: b.language })),
            joinedCircles: joinedCircles.map(c => ({ id: c.id, name: c.name }))
          },
          candidates
        };
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': OPENROUTER_SITE,
            'X-Title': OPENROUTER_TITLE,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: JSON.stringify(userPayload) }
            ],
            temperature: 0.2
          })
        });
        console.log(`[LLM] circles: response received status=${resp.status}`);
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || '';
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const parsed = JSON.parse(content.slice(start, end + 1));
          if (parsed && Array.isArray(parsed.circleIds)) {
            recommendedIds = parsed.circleIds.filter(id => typeof id === 'string');
          }
        }
        if (!Array.isArray(recommendedIds) || recommendedIds.length === 0) {
          console.warn('[LLM] circles: empty recommendation list from model');
          return res.status(502).json({ message: 'LLM failed to produce recommendations' });
        }
        console.log(`[LLM] circles: parsed ids=${recommendedIds.length}`);
      } catch (e) {
        console.error('[LLM] circles: call failed', e);
        return res.status(502).json({ message: 'LLM error: unable to get recommendations' });
      }
    } else {
      console.log('[LLM] circles: skipping LLM (no API key); using heuristic fallback');
      const prefGenres = (userDoc.preferences?.genres || []).map(g => String(g).toLowerCase());
      const scored = candidates
        .map(c => {
          let score = 0;
          const desc = String(c.description || '').toLowerCase();
          if (prefGenres.some(g => desc.includes(g))) score += 2;
          score += (Number(c.memberCount) || 0) * 0.01;
          return { id: c.id, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      recommendedIds = scored.map(s => s.id);
    }

    cache.circles.set(user.id, { prefsSignature, ids: recommendedIds, updatedAt: Date.now() });
    console.log(`[LLM] circles: cache store user=${user.id} ids=${recommendedIds.length}`);
    return res.json({ circleIds: recommendedIds.slice(0, topK) });
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

// Favorite/Unfavorite book
app.post("/api/books/:bookId/favorite", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId } = req.body;
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, bookId });
    if (existingFavorite) {
      return res.status(400).json({ message: "Book already favorited" });
    }
    
    const favorite = new Favorite({ userId, bookId });
    await favorite.save();
    res.status(201).json({ message: "Book favorited successfully" });
  } catch (error) {
    console.error("Error favoriting book:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/books/:bookId/favorite", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId } = req.body;
    
    const favorite = await Favorite.findOneAndDelete({ userId, bookId });
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }
    
    res.status(200).json({ message: "Book unfavorited successfully" });
  } catch (error) {
    console.error("Error unfavoriting book:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's favorite books
app.get("/api/users/:userId/favorites", async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ userId }).populate('bookId');
    res.status(200).json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Like/Unlike post
app.post("/api/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    // Check if already liked
    const existingLike = await Like.findOne({ userId, postId });
    if (existingLike) {
      return res.status(400).json({ message: "Post already liked" });
    }
    
    const like = new Like({ userId, postId });
    await like.save();
    
    // Update post likes count
    await Post.findOneAndUpdate({ id: postId }, { $inc: { likes: 1 } });
    
    res.status(201).json({ message: "Post liked successfully" });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/posts/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    const like = await Like.findOneAndDelete({ userId, postId });
    if (!like) {
      return res.status(404).json({ message: "Like not found" });
    }
    
    // Update post likes count
    await Post.findOneAndUpdate({ id: postId }, { $inc: { likes: -1 } });
    
    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if user has liked a post
app.get("/api/posts/:postId/like-status", async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;
    
    const like = await Like.findOne({ userId, postId });
    res.status(200).json({ liked: !!like });
  } catch (error) {
    console.error("Error checking like status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if user has favorited a book
app.get("/api/books/:bookId/favorite-status", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId } = req.query;
    
    const favorite = await Favorite.findOne({ userId, bookId });
    res.status(200).json({ favorited: !!favorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
