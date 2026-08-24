require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(express.json());
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true }, 
  position: { type: String, required: true },
  salary: { type: Number, required: true }
});
const Employee = mongoose.model('Employee', employeeSchema);

const validateEmployee = (req, res, next) => {
  const { name, mobile, email, position, salary } = req.body;
  if (!name || !mobile || !email || !position || !salary) {
    return res.status(400).json({ error: 'All fields are required!' });
  }
  next(); 
};

// AUTHENTICATION LOGIC
const SECRET_KEY = process.env.SECRET_KEY;
// Login Route (Generates the token)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Hardcoded simple login for demonstration
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Auth Middleware (Checks the token)
const verifyAuth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Access denied. No token provided.' });
  
  try {
    jwt.verify(token, SECRET_KEY);
    next(); // Token is valid, proceed!
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// CRUD ROUTES (Now protected by verifyAuth)
// Notice how verifyAuth is added before the routes execute
app.post('/employees', verifyAuth, validateEmployee, async (req, res, next) => {
  try {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (error) { next(error); }
});

app.get('/employees', verifyAuth, async (req, res, next) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) { next(error); }
});

app.put('/employees/:id', verifyAuth, validateEmployee, async (req, res, next) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedEmployee);
  } catch (error) { next(error); }
});

app.delete('/employees/:id', verifyAuth, async (req, res, next) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) { next(error); }
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));