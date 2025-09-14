const express = require("express");
const cors = require("cors");
const {connectDB , User,Book,Trade,ReadingCircle,Comment,Post} = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

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
    user.circlesjoined = user.circlesjoined.filter(circleId => circleId !== id);
    await user.save();
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });

    }
    circle.members = circle.members.filter(member => member !== userId);
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
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//to add book
app.post("/api/addbook", async (req, res) => {
  try {
    const { title, author, genre, language, ownerId, ownerName, available, rating, reviews ,description ,cover,  condition } = req.body;
    const newBook = new Book({ title, author, genre, language, ownerId, ownerName, available, rating, reviews ,description ,cover,  condition });
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
    const newTrade = new Trade({ requesterId, requesterName, ownerId, ownerName, bookId, bookTitle, message });
    await newTrade.save();
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
    circle.memberscount += 1;

    await user.save();
    await circle.save();

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
    const newCircle = new ReadingCircle({ name, description, members, memberscount: members.length, currentbook, avatar, privacy });
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
    const circle = await ReadingCircle.findOne({ id: req.params.id }).populate('posts');
    if (!circle) {
      return res.status(404).json({ message: "Circle not found" });
    }
    res.status(200).json(circle);
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
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ message: "Server error" });
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




// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
