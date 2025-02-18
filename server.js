const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./server/database");
const User = require("./server/userModel");
const Course = require("./server/courseModel");
const Order = require("./server/orderModel");

const path = require("path");
const session = require("express-session");


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
// Ensure correct MIME type for JavaScript files
app.use((req, res, next) => {
    if (req.url.endsWith(".js")) {
        res.type("application/javascript");
    }
    next();
});

// Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "about.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/introduction", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "introduction.html"));
});
app.get("/order", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "order.html"));
});

// ✅ Session Configuration
app.use(session({
    secret: "40a81b959c462abb98f3304c849429d7c0e09bd417994989fec8f23d0c12b97bd609079571d2741ca1f303251b896bcbbc062316a7341995893b2c74c1a296e24fc7b0e842c11197071578b2cf3e51180e221e8c6088632ceaf15803865f06f70c039dfba0b73e3de47bd1f398dd027b9e736e97a1ee84561da7689af931ed139c46e51a57f48147a891d15c973349905942e864bb8cb4bccce10f44fa5ad68eca42eed8fff5b4c88689a06be9f3e26b80e6a355333e64cc56f933def7e3906432fd76ccee6a27399d2fdc5901cd826cbd401fd201be25577833e5bf40369276bcfe224ef6a2b96fc84946dc746f6ec6870c99b044931320f3f1aa493b154f4a", 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true } // ✅ Set secure: false for development
}));

// Connect to Database
connectDB();

// Validation Regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9]{3,15}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;



// 🟢 Register Endpoint
app.post("/register", async (req, res) => {

    const { username, email, password, address } = req.body;
    // Validate Input
    if (!username || !email || !password || !address) {
        return res.status(400).json({ success: false, message: "All fields are required!" });
    }
    if (!emailRegex.test(email)) return res.json({ message: "Invalid email format!" });
    if (!usernameRegex.test(username)) return res.json({ message: "Username must be 3-15 alphanumeric characters!" });
    if (!passwordRegex.test(password)) return res.json({ message: "Password must have at least 6 characters, 1 uppercase, and 1 digit!" });

    try {
        let existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already exists!" });
        let existingEmail = await User.findOne({email});
        if (existingEmail) return res.status(400).json({ message: "Email already exists!" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, username, password: hashedPassword ,address});

        await newUser.save();
        res.json({ success: true, message: "Registration successful!" });

    } catch (error) {
        res.status(500).json({ message: "Server Error: Unable to register" });
    }
});

// ✅ Login Route

// ✅ Login API Endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
        return res.json({ success: false, message: "Username and password are required!" });
    }

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) return res.json({ success: false, message: "User not found!" });

        // Compare hashed password with entered password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid credentials!" });

        // ✅ Store User Session
        req.session.user = { id: user._id.toString(), username: user.username };
        console.log("🟢 User logged in:", req.session.user); // ✅ Debugging log
        res.json({ success: true, message: "Login successful!", username: user.username });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error: Unable to login" });
    }
});

app.get("/api/user", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, username: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// ✅ API to Insert New Course
app.post("/api/courses", async (req, res) => {
    try {
        const { title, description, price, image ,category} = req.body;

        // Validate Input
        if (!title || !description || !price || !image) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        const newCourse = new Course({ title, description, price, image ,category});
        await newCourse.save();

        res.json({ success: true, message: "Course added successfully!", course: newCourse });
    } catch (error) {
        console.error("Error adding course:", error);
        res.status(500).json({ success: false, message: "Server Error: Unable to add course" });
    }
});


app.get("/api/courses", async (req, res) => {
    try {
        const category = req.query.category || "all";
        let courses;

        if (category === "all") {
            courses = await Course.find();
        } else {
            courses = await Course.find({ category: category });
        }

        // ✅ Convert `_id` to `id` for frontend compatibility
        courses = courses.map(course => ({
            id: course._id.toString(), // ✅ Convert `_id` to string
            title: course.title,
            description: course.description,
            price: course.price,
            image: course.image,
            category: course.category
        }));

        console.log("🟢 API sending courses:", courses); // ✅ Debugging log
        res.json(courses);
    } catch (error) {
        console.error("🔴 Error fetching courses:", error);
        res.status(500).json({ success: false, message: "Server Error: Unable to fetch courses" });
    }
});
//Check out API
app.post("/checkout", async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ success: false, message: "Unauthorized: Please log in to checkout" });
    }

    try {
        const { items, totalPrice } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty" });
        }

        // ✅ Get user ID from session
        const userId = req.session.user.id;
        console.log("🟢 Checkout User ID:", userId); // ✅ Debugging log

        // ✅ Save order with userId
        const newOrder = new Order({
            userId,  // ✅ Ensure userId is stored
            items,
            totalPrice,
            createdAt: new Date(),
        });

        await newOrder.save();

        console.log("🟢 Order saved successfully:", newOrder); // ✅ Debugging log

        res.json({ success: true, message: "Checkout successful!", orderId: newOrder._id });
    } catch (error) {
        console.error("🔴 Checkout Error:", error);
        res.status(500).json({ success: false, message: "Server Error: Unable to process checkout" });
    }
});


app.get("/api/orders", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized: Please log in to view orders" });
    }

    try {
        const userId = req.session.user.id; // ✅ Get the logged-in user ID

        if (!userId) {
            console.error("❌ Error: No user ID in session!");
            return res.status(500).json({ success: false, message: "Server Error: User session missing" });
        }

        const orders = await Order.find({ userId }).sort({ createdAt: -1 }); // ✅ Fetch only this user's orders

        console.log("🟢 Retrieved orders for user:", userId, orders); // ✅ Debugging log
        res.json({ success: true, orders });
    } catch (error) {
        console.error("🔴 Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Server Error: Unable to fetch orders" });
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Logout failed!" });
        res.redirect("/");
    });
});

app.get("/getUserSession", (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user.username });
    } else {
        res.json({ username: null });
    }
});
app.get("/getUserDetails", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Format date as ddMMyyyy
        const registeredDate = new Date(user.createdAt);
        const formattedDate = `${String(registeredDate.getDate()).padStart(2, '0')}${String(registeredDate.getMonth() + 1).padStart(2, '0')}${registeredDate.getFullYear()}`;

        res.json({
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture || "/default-profile.png",
            registeredAt: formattedDate // Send formatted date
        });
    } catch (error) {
        res.status(500).json({ message: "Server error fetching user details" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));