// server/server.js

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Define Mongoose Schemas and Models ---

// User Schema: Defines the structure for a user with role-based access
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  registeredAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);

// MenuItem Schema: Defines the structure for a single menu item
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  img: { type: String, default: 'https://images.unsplash.com/photo-1546069901-d5bfd2c0b6f1' },
  price: { type: Number, required: true },
  type: { type: String, required: true },
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// OrderItem Schema (sub-document for Order)
const orderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

// Order Schema - ADDED new fields for Table Number and Estimated Time
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tableNumber: { type: String }, // New field for table number
  items: [orderItemSchema],
  total: { type: Number, required: true },
  placedAt: { type: Date, default: Date.now },
  cancellable: { type: Boolean, default: true },
  cancellationWindowEnd: { type: Date, required: true },
  status: { type: String, default: 'Pending' }, // 'Pending', 'Cancelled', 'Preparing', 'Completed'
  estimatedPrepTime: { type: Number, default: 0 }, // New field for estimated preparation time in minutes
});
const Order = mongoose.model('Order', orderSchema);


// Middleware
app.use(cors());
app.use(express.json());

// --- JWT Authentication Middleware ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
  process.exit(1);
}

const authenticateUser = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: You do not have administrator access' });
  }
};

// --- API Endpoints ---

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ email, password: hashedPassword });
    await user.save();
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- Menu Routes ---
// GET /api/menu - Get all menu items with optional search and filter
app.get('/api/menu', async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }
    const menuItems = await MenuItem.find(query);
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
  }
});

// POST /api/menu - Add a new menu item (Admin Only)
app.post('/api/menu', authenticateUser, authorizeAdmin, async (req, res) => {
  const { name, img, price, type } = req.body;
  try {
    const newItem = new MenuItem({ name, img, price, type });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Failed to add menu item', error: error.message });
  }
});

// PUT /api/menu/:id - Update an existing menu item (Admin Only)
app.put('/api/menu/:id', authenticateUser, authorizeAdmin, async (req, res) => {
  const { name, img, price, type } = req.body;
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, img, price, type },
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Failed to update menu item', error: error.message });
  }
});

// DELETE /api/menu/:id - Delete a menu item (Admin Only)
app.delete('/api/menu/:id', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item', error: error.message });
  }
});

// --- Order Routes ---
// POST /api/orders - Place a new order (Authenticated User)
app.post('/api/orders', authenticateUser, async (req, res) => {
  try {
    const { items, total, tableNumber } = req.body; // Added tableNumber
    const userId = req.user.id;

    if (!items || items.length === 0 || total === undefined) {
      return res.status(400).json({ message: 'Missing order details (items or total)' });
    }

    // UPDATED: Changed cancellation time from 5 minutes to 1 minute
    const cancellationWindowEnd = new Date(Date.now() + (1 * 60 * 1000));

    const newOrder = new Order({
      userId: userId,
      tableNumber: tableNumber, // Assign table number
      items: items,
      total: total,
      placedAt: new Date(),
      cancellable: true,
      cancellationWindowEnd: cancellationWindowEnd,
      status: 'Pending',
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', orderId: savedOrder._id });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

// GET /api/orders/user - Get orders for the authenticated user
app.get('/api/orders/user', authenticateUser, async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const userOrders = await Order.find({ userId: authenticatedUserId }).sort({ placedAt: -1 });

    const ordersWithTimeRemaining = userOrders.map(order => {
      let timeRemaining = 0;
      let cancellable = order.cancellable;

      if (order.cancellable && order.cancellationWindowEnd) {
        const remainingMs = order.cancellationWindowEnd.getTime() - Date.now();
        timeRemaining = Math.max(0, Math.floor(remainingMs / 1000));
        if (timeRemaining === 0) {
          cancellable = false;
        }
      }

      return {
        id: order._id,
        ...order.toObject(),
        placedAt: order.placedAt.toISOString(),
        timeRemaining: timeRemaining,
        cancellable: cancellable
      };
    });
    res.status(200).json(ordersWithTimeRemaining);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Failed to fetch user orders', error: error.message });
  }
});

// POST /api/orders/:id/cancel - Cancel an existing order (Authenticated User)
app.post('/api/orders/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own orders' });
    }

    const currentTime = Date.now();
    if (!order.cancellable || currentTime > order.cancellationWindowEnd.getTime()) {
      return res.status(400).json({ message: 'Order cannot be cancelled. Cancellation window has closed or order is already processed.' });
    }

    order.status = 'Cancelled';
    order.cancellable = false;
    await order.save();

    res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// GET /api/orders - Get all orders (Admin Only)
app.get('/api/orders', authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const allOrders = await Order.find({}).sort({ placedAt: -1 });
    res.status(200).json(allOrders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Failed to fetch all orders', error: error.message });
  }
});

// PUT /api/orders/:id/status - Update order status and prep time (Admin Only)
app.put('/api/orders/:id/status', authenticateUser, authorizeAdmin, async (req, res) => {
  const { status, estimatedPrepTime } = req.body; // Added estimatedPrepTime
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // A simple validation for status
    if (!['Pending', 'Preparing', 'Completed', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }

    order.status = status;
    if (status !== 'Pending') {
      order.cancellable = false;
    }
    // Update prep time only if provided
    if (estimatedPrepTime !== undefined) {
      order.estimatedPrepTime = estimatedPrepTime;
    }
    await order.save();
    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

// GET /api/user/profile - Get user profile info (Authenticated User)
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Ensure MongoDB server is running and accessible.');
  populateInitialMenu();
});

// --- Initial Data Population Function with Corrected URLs ---
async function populateInitialMenu() {
  const initialMenuItems = [
    { name: 'Classic Burger', img: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 250.00, type: 'Main Course' },
    { name: 'Margherita Pizza', img: 'https://images.pexels.com/photos/2085376/pexels-photo-2085376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 380.00, type: 'Main Course' },
    { name: 'French Fries', img: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 120.00, type: 'Side Dish' },
    { name: 'Coca-Cola', img: 'https://images.pexels.com/photos/1479836/pexels-photo-1479836.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 80.00, type: 'Beverage' },
    { name: 'Chocolate Lava Cake', img: 'https://images.pexels.com/photos/4528143/pexels-photo-4528143.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 180.00, type: 'Dessert' },
    { name: 'Chicken Biryani', img: 'https://images.pexels.com/photos/12586733/pexels-photo-12586733.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 450.00, type: 'Main Course' },
    { name: 'Paneer Tikka', img: 'https://images.pexels.com/photos/16381615/pexels-photo-16381615/free-photo-of-paneer-tikka.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 320.00, type: 'Appetizer' },
    { name: 'Fresh Lime Soda', img: 'https://images.pexels.com/photos/4038827/pexels-photo-4038827.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 100.00, type: 'Beverage' },
    { name: 'Veggie Wrap', img: 'https://images.pexels.com/photos/18970860/pexels-photo-18970860/free-photo-of-a-close-up-of-a-veggie-wrap-on-a-white-plate.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 210.00, type: 'Main Course' },
    { name: 'Iced Coffee', img: 'https://images.pexels.com/photos/5431630/pexels-photo-5431630.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 150.00, type: 'Beverage' },
    { name: 'Onion Rings', img: 'https://images.pexels.com/photos/1484516/pexels-photo-1484516.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 130.00, type: 'Side Dish' },
    { name: 'Fish and Chips', img: 'https://images.pexels.com/photos/16892589/pexels-photo-16892589/free-photo-of-fish-and-chips.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 420.00, type: 'Main Course' },
    { name: 'Gulab Jamun', img: 'https://images.pexels.com/photos/12300078/pexels-photo-12300078.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 110.00, type: 'Dessert' },
    { name: 'Grilled Salmon', img: 'https://images.pexels.com/photos/4623910/pexels-photo-4623910.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 550.00, type: 'Main Course' },
    { name: 'Tandoori Chicken', img: 'https://images.pexels.com/photos/10103233/pexels-photo-10103233.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 480.00, type: 'Main Course' },
    { name: 'Samosa', img: 'https://images.pexels.com/photos/7404285/pexels-photo-7404285.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 90.00, type: 'Appetizer' },
    { name: 'Masala Dosa', img: 'https://images.pexels.com/photos/12711681/pexels-photo-12711681/free-photo-of-masala-dosa-on-a-plate.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 170.00, type: 'Main Course' },
    { name: 'Chole Bhature', img: 'https://images.pexels.com/photos/11195657/pexels-photo-11195657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 220.00, type: 'Main Course' },
    { name: 'Tea', img: 'https://images.pexels.com/photos/4145749/pexels-photo-4145749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 60.00, type: 'Beverage' },
    { name: 'Coffee', img: 'https://images.pexels.com/photos/16918854/pexels-photo-16918854/free-photo-of-coffee-in-a-cup.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 75.00, type: 'Beverage' },
    { name: 'Mojito', img: 'https://images.pexels.com/photos/10899450/pexels-photo-10899450.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 160.00, type: 'Beverage' },
    { name: 'Fruit Salad', img: 'https://images.pexels.com/photos/1572074/pexels-photo-1572074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 140.00, type: 'Dessert' },
    { name: 'Spring Rolls', img: 'https://images.pexels.com/photos/8916320/pexels-photo-8916320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 150.00, type: 'Appetizer' },
    { name: 'Nachos with Cheese', img: 'https://images.pexels.com/photos/2085376/pexels-photo-2085376.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 200.00, type: 'Appetizer' },
    { name: 'Caesar Salad', img: 'https://images.pexels.com/photos/21150531/pexels-photo-21150531/free-photo-of-close-up-of-a-caesar-salad.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 280.00, type: 'Main Course' },
    { name: 'Hot Dog', img: 'https://images.pexels.com/photos/1592391/pexels-photo-1592391.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 190.00, type: 'Main Course' },
    { name: 'Cheesecake', img: 'https://images.pexels.com/photos/2034057/pexels-photo-2034057.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 220.00, type: 'Dessert' },
    { name: 'Pancakes', img: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 180.00, type: 'Dessert' },
    { name: 'Garlic Bread', img: 'https://images.pexels.com/photos/1070562/pexels-photo-1070562.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 100.00, type: 'Side Dish' },
    { name: 'Chicken Wings', img: 'https://images.pexels.com/photos/236712/pexels-photo-236712.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', price: 300.00, type: 'Appetizer' },
  ];

  try {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('Populating initial menu items...');
      await MenuItem.insertMany(initialMenuItems);
      console.log('Initial menu items populated.');
    } else {
      console.log('Clearing existing menu items...');
      await MenuItem.deleteMany({}); // Clears the entire collection
      console.log('Populating initial menu items...');
      await MenuItem.insertMany(initialMenuItems);
      console.log('Initial menu items populated.');
    }
  } catch (error) {
    console.error('Error populating initial menu:', error);
  }
}