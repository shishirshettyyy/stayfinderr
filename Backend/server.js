require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Or whatever port your React app runs on
    credentials: true
  }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImagePath: { type: String, default: '' },
  wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  isOwner: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  phoneNumber: { type: String },
  about: { type: String }
}, { timestamps: true });

const AmenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String }
});

const ListingSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  propertyType: { 
    type: String, 
    required: true,
    enum: ['Entire Home', 'Private Room', 'Shared Room', 'PG', 'Co-Living', 'Hotel', 'Apartment', 'Villa']
  },
  category: { 
    type: String,
    enum: ['House', 'Apartment', 'Hotel', 'Villa', 'Cabin', 'Beach House', 'Countryside', 'Unique stays'],
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  bedrooms: { type: Number, required: true },
  bathrooms: { type: Number, required: true },
  guests: { type: Number, required: true },
  beds: { type: Number, required: true },
  amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Amenity' }],
  images: [{ type: String, required: true }],
  rules: [{ type: String }],
  availability: {
    startDate: { type: Date },
    endDate: { type: Date }
  },
  isApproved: { type: Boolean, default: true }, // Changed to default true
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guests: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentMethod: { type: String },
  transactionId: { type: String }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  response: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Amenity = mongoose.model('Amenity', AmenitySchema);
const Listing = mongoose.model('Listing', ListingSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Review = mongoose.model('Review', ReviewSchema);

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, 'public', 'uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true }); // Create directory if it doesn't exist
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
  });
  
  const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

// Admin Middleware
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Initialize Amenities
const initializeAmenities = async () => {
  const amenities = [
    { name: 'WiFi', icon: 'fa-wifi' },
    { name: 'Kitchen', icon: 'fa-utensils' },
    { name: 'Washer', icon: 'fa-washing-machine' },
    { name: 'Dryer', icon: 'fa-wind' },
    { name: 'Air conditioning', icon: 'fa-snowflake' },
    { name: 'Heating', icon: 'fa-temperature-high' },
    { name: 'TV', icon: 'fa-tv' },
    { name: 'Parking', icon: 'fa-parking' },
    { name: 'Pool', icon: 'fa-swimming-pool' },
    { name: 'Hot tub', icon: 'fa-hot-tub' },
    { name: 'Gym', icon: 'fa-dumbbell' },
    { name: 'Elevator', icon: 'fa-elevator' },
    { name: 'Workspace', icon: 'fa-laptop' },
    { name: 'Breakfast', icon: 'fa-coffee' },
    { name: 'Fireplace', icon: 'fa-fire' },
    { name: 'Smoke alarm', icon: 'fa-smoking-ban' },
    { name: 'First aid kit', icon: 'fa-first-aid' },
    { name: 'Fire extinguisher', icon: 'fa-fire-extinguisher' }
  ];

  const count = await Amenity.countDocuments();
  if (count === 0) {
    await Amenity.insertMany(amenities);
    console.log('Amenities initialized');
  }
};

// Routes

// Auth Routes
app.post('/api/auth/register', upload.single('profileImage'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, isOwner, phoneNumber } = req.body;
    
    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = req.file ? `/uploads/${req.file.filename}` : '';

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profileImagePath,
      isOwner: isOwner === 'true',
      phoneNumber
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, user, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User Routes
app.get('/api/user', authenticate, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/user', authenticate, upload.single('profileImage'), async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, about } = req.body;
    const updates = { firstName, lastName, phoneNumber, about };

    if (req.file) {
      updates.profileImagePath = `/uploads/${req.file.filename}`;
      // Delete old profile image if exists
      if (req.user.profileImagePath) {
        const oldImagePath = path.join(__dirname, 'public', req.user.profileImagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Listings Routes
app.get('/api/listings/user/:userId', authenticate, async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Ensure the requesting user is the same as the userId or an admin
      if (req.user._id.toString() !== userId && !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
  
      const listings = await Listing.find({ creator: userId })
        .populate('creator')
        .populate('amenities')
        .sort({ createdAt: -1 });
  
      res.json({ success: true, listings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

app.get('/api/listings', async (req, res) => {
  try {
    const { location, propertyType, minPrice, maxPrice, guests, bedrooms, amenities } = req.query;
    
    // Base query - approved listings OR listings created by the current user (if logged in)
    const query = {
      $or: [
        { isApproved: true }
      ]
    };

    // If user is logged in, include their own listings regardless of approval status
    if (req.user) {
      query.$or.push({ creator: req.user._id });
    }

    // Add search filters
    if (location) {
      query['address.city'] = new RegExp(location, 'i');
    }
    if (propertyType) {
      query.propertyType = propertyType;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (guests) {
      query.guests = { $gte: Number(guests) };
    }
    if (bedrooms) {
      query.bedrooms = { $gte: Number(bedrooms) };
    }
    if (amenities) {
      query.amenities = { $all: amenities.split(',') };
    }

    const listings = await Listing.find(query)
      .populate('creator')
      .populate('amenities')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/listings/:id', async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // For non-owners, only show approved listings
    if (!req.user || !req.user.isOwner) {
      query.isApproved = true;
    }

    const listing = await Listing.findOne(query)
      .populate('creator')
      .populate('amenities')
      .populate('reviews');
      
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/listings', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const { 
      title, description, propertyType, category, 
      street, city, state, country, zipCode, lat, lng,
      price, discount, bedrooms, bathrooms, guests, beds,
      amenities, rules
    } = req.body;

    if (!title || !description || !propertyType || !category || 
        !street || !city || !country || !price || !bedrooms || 
        !bathrooms || !guests || !beds) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const listing = new Listing({
      creator: req.user._id,
      title,
      description,
      propertyType,
      category,
      address: {
        street,
        city,
        state,
        country,
        zipCode,
        coordinates: {
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined
        }
      },
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      guests: parseInt(guests),
      beds: parseInt(beds),
      amenities: amenities ? amenities.split(',') : [],
      rules: rules ? rules.split(',').map(rule => rule.trim()) : [],
      images: req.files ? req.files.map(file => `uploads/${file.filename}`) : [],
      isApproved: req.user.isOwner // Automatically approve if user is owner
    });

    await listing.save();
    res.status(201).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/listings/:id', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    const { 
      title, description, propertyType, category, 
      street, city, state, country, zipCode, lat, lng,
      price, discount, bedrooms, bathrooms, guests, beds,
      amenities, rules, existingImages
    } = req.body;

    // Check if listing exists and user is the creator
    const existingListing = await Listing.findById(req.params.id);
    if (!existingListing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (existingListing.creator.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = {
      title,
      description,
      propertyType,
      category,
      address: {
        street,
        city,
        state,
        country,
        zipCode,
        coordinates: {
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined
        }
      },
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),
      guests: parseInt(guests),
      beds: parseInt(beds),
      amenities: amenities ? amenities.split(',') : [],
      rules: rules ? rules.split(',').map(rule => rule.trim()) : [],
      isApproved: req.user.isOwner // Keep approved if user is owner
    };

    // Handle images
    if (existingImages) {
      updates.images = existingImages.split(',');
    }
    if (req.files) {
      updates.images = [...updates.images, ...req.files.map(file => `/uploads/${file.filename}`)];
    }

    const listing = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/listings/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.creator.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Routes
app.get('/api/admin/listings', authenticate, isAdmin, async (req, res) => {
  try {
    const listings = await Listing.find().populate('creator');
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/listings/:id/approve', authenticate, isAdmin, async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Booking Routes
app.post('/api/bookings', authenticate, async (req, res) => {
  try {
    const { listingId, startDate, endDate, guests, paymentMethod } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check if listing is available for the selected dates
    const conflictingBookings = await Booking.find({
      listing: listingId,
      $or: [
        { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } }
      ],
      status: { $ne: 'cancelled' }
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ success: false, message: 'Listing not available for selected dates' });
    }

    // Calculate total price
    const nights = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * listing.price * (1 - (listing.discount / 100));

    const booking = new Booking({
      customer: req.user._id,
      listing: listingId,
      startDate,
      endDate,
      guests,
      totalPrice,
      paymentMethod,
      status: 'pending'
    });

    await booking.save();
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/bookings/user', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('listing')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/bookings/host', authenticate, async (req, res) => {
  try {
    if (!req.user.isOwner) {
      return res.status(403).json({ success: false, message: 'Only owners can view host bookings' });
    }

    // Find all listings owned by the user
    const listings = await Listing.find({ creator: req.user._id });
    const listingIds = listings.map(listing => listing._id);

    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate('listing')
      .populate('customer')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/bookings/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('listing');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is the host of the listing
    if (booking.listing.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Review Routes
app.post('/api/reviews', authenticate, async (req, res) => {
  try {
    const { listingId, rating, comment } = req.body;

    // Check if user has a completed booking for this listing
    const booking = await Booking.findOne({
      customer: req.user._id,
      listing: listingId,
      status: 'completed',
      endDate: { $lt: new Date() }
    });

    if (!booking) {
      return res.status(400).json({ success: false, message: 'You can only review listings you have stayed at' });
    }

    // Check if user has already reviewed this listing
    const existingReview = await Review.findOne({
      user: req.user._id,
      listing: listingId
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this listing' });
    }

    const review = new Review({
      user: req.user._id,
      listing: listingId,
      rating,
      comment
    });

    await review.save();

    // Add review to listing
    await Listing.findByIdAndUpdate(listingId, {
      $push: { reviews: review._id }
    });

    // Update listing rating
    const reviews = await Review.find({ listing: listingId });
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    await Listing.findByIdAndUpdate(listingId, { rating: averageRating });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Amenity Routes
app.get('/api/amenities', async (req, res) => {
  try {
    const amenities = await Amenity.find();
    res.json({ success: true, amenities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Wishlist Routes
app.post('/api/wishlist', authenticate, async (req, res) => {
  try {
    const { listingId } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check if listing is already in wishlist
    if (req.user.wishList.includes(listingId)) {
      return res.status(400).json({ success: false, message: 'Listing already in wishlist' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { wishList: listingId } },
      { new: true }
    ).populate('wishList');

    res.json({ success: true, wishList: user.wishList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/wishlist/:listingId', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishList: req.params.listingId } },
      { new: true }
    ).populate('wishList');

    res.json({ success: true, wishList: user.wishList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/wishlist', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishList');
    res.json({ success: true, wishList: user.wishList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Initialize amenities on server start
initializeAmenities();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});