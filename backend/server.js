const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { connectDB } = require('./database/db')

// Models
const User = require('./models/User');
const Task = require('./models/Task');

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).json({ error: 'User registration failed' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated token:', token); // Debugging
        res.json({ token });
    } catch (err) {
        console.error('Error in /login:', err.message);
        res.status(500).json({ error: 'Login failed' });
    }
});


// Create Task
app.post('/tasks', async (req, res) => {
    const { token, title, description, deadline, priority } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const task = new Task({ user: decoded.id, title, description, deadline, priority });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(400).json({ error: 'Task creation failed' });
    }
});

// Get Tasks
app.get('/tasks', async (req, res) => {
    const { token } = req.query;
    // console.log('Received token:', token); 
    try {
        if (!token) {
            console.log('Token is missing');
            return res.status(400).json({ error: 'Token is required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
        // console.log('Decoded token:', decoded);
        
        const tasks = await Task.find({ user: decoded.id }); // Fetch tasks for the user
        // console.log('Tasks fetched:', tasks);

        res.json(tasks); // Send tasks array as response
    } catch (err) {
        console.error('Error in /tasks:', err.message);
        res.status(400).json({ error: 'Failed to fetch tasks' });
    }
});

app.put('/tasks/:id', async (req, res) => {
    const { token, title, description, deadline, priority } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: decoded.id },
            { title, description, deadline, priority },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (err) {
        console.error('Error updating task:', err.message);
        res.status(400).json({ error: 'Failed to update task' });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    const { token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: decoded.id });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Error deleting task:', err.message);
        res.status(400).json({ error: 'Failed to delete task' });
    }
});

(async function () {
    try {
      await connectDB();
      app.listen(PORT, () =>
        console.log(`server running on http://localhost:${PORT}`)
      );
    } catch (err) {
      console.log('Error starting server:', err.message);
    }
  })();