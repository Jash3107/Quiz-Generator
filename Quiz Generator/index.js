import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true },
  quizSubmissions: [
    {
      score: { type: Number },
      percentile: { type: Number },
      createdAt: { type: Date, default: Date.now },
      quizId: { type: String },
    }
  ],
  leaderboard: [
    {
      score: { type: Number },
      percentile: { type: Number },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Quiz schema and model
const quizSchema = new mongoose.Schema({
  quizId: { type: String, unique: true, required: true },
  topic: { type: String, required: true },
  subtopics: [{ type: String }],
  generated_at: { type: Date, required: true },
  question_count: { type: Number, required: true },
  questions: [
    {
      type: { type: String, required: true },
      question: { type: String, required: true },
      difficulty: { type: String, required: true },
      tags: [{ type: String }],
      points: { type: Number, required: true },
      explanation: { type: String, required: true },
      options: [{ type: String }], // For mcq
      answer: { type: mongoose.Schema.Types.Mixed }, // Can be string, boolean, number
      pairs: { type: mongoose.Schema.Types.Mixed }, // For matching
      items: [{ type: String }], // For ordering
      correct_order: [{ type: String }], // For ordering
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);

// Input validation function for user
function validateUserInput({ username, password, name, email }) {
  const errors = [];
  
  if (!username || username.length < 3 || username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!name || name.length < 2 || name.length > 50) {
    errors.push('Name must be between 2 and 50 characters');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  }
  
  return errors;
}

// Input validation function for quiz generation
function validateQuizInput({ topic }) {
  const errors = [];
  
  if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
    errors.push('Topic must be a string with at least 3 characters');
  }
  
  return errors;
}

// Function to parse quiz data using regex
function parseQuizWithRegex(rawString) {
  const parsed = {};

  // Top-level fields
  parsed.topic = rawString.match(/"topic"\s*:\s*"([^"]+)"/)?.[1];
  parsed.generated_at = rawString.match(/"generated_at"\s*:\s*"([^"]+)"/)?.[1];
  parsed.question_count = parseInt(rawString.match(/"question_count"\s*:\s*(\d+)/)?.[1]);

  const subtopicsMatch = rawString.match(/"subtopics"\s*:\s*\[(.*?)\]/s);
  if (subtopicsMatch) {
    parsed.subtopics = subtopicsMatch[1]
      .split(",")
      .map(x => x.replace(/"/g, "").trim());
  }

  // Questions array using RegEx to capture blocks of question objects
  const questionRegex = /{[\s\S]*?"type"\s*:\s*"(.*?)"[\s\S]*?"question"\s*:\s*"(.*?)"[\s\S]*?"difficulty"\s*:\s*"(.*?)"[\s\S]*?"tags"\s*:\s*\[(.*?)\][\s\S]*?"points"\s*:\s*(\d+)[\s\S]*?"explanation"\s*:\s*"(.*?)"[\s\S]*?}(?=,?\s*{|\s*\])?/g;

  const questions = [];
  let match;
  while ((match = questionRegex.exec(rawString)) !== null) {
    const type = match[1];
    const question = match[2];
    const difficulty = match[3];
    const tags = match[4].split(",").map(tag => tag.replace(/"/g, "").trim());
    const points = parseInt(match[5]);
    const explanation = match[6];

    const questionBlock = { type, question, difficulty, tags, points, explanation };

    // Add type-specific fields
    if (type === "mcq") {
      const options = match[0].match(/"options"\s*:\s*\[(.*?)\]/s)?.[1]
        .split(",").map(o => o.replace(/"/g, "").trim());
      const answer = match[0].match(/"answer"\s*:\s*"([^"]+)"/)?.[1];
      questionBlock.options = options;
      questionBlock.answer = answer;
    } else if (type === "true_false") {
      const answer = /"answer"\s*:\s*(true|false)/.exec(match[0])?.[1] === "true";
      questionBlock.answer = answer;
    } else if (type === "numeric") {
      const answer = parseFloat(match[0].match(/"answer"\s*:\s*(\d+)/)?.[1]);
      questionBlock.answer = answer;
    } else if (type === "fill_blank") {
      const answer = match[0].match(/"answer"\s*:\s*"([^"]+)"/)?.[1];
      questionBlock.answer = answer;
    } else if (type === "matching") {
      const pairsMatch = match[0].match(/"pairs"\s*:\s*{(.*?)}/s);
      const pairs = {};
      if (pairsMatch) {
        const pairLines = pairsMatch[1].match(/"([^"]+)"\s*:\s*"([^"]+)"/g) || [];
        for (const line of pairLines) {
          const [key, value] = line.replace(/"/g, "").split(":").map(s => s.trim());
          pairs[key] = value;
        }
        questionBlock.pairs = pairs;
      }
    } else if (type === "ordering") {
      const itemsMatch = match[0].match(/"items"\s*:\s*\[(.*?)\]/s)?.[1];
      const correctOrderMatch = match[0].match(/"correct_order"\s*:\s*\[(.*?)\]/s)?.[1];
      questionBlock.items = itemsMatch?.split(",").map(i => i.replace(/"/g, "").trim());
      questionBlock.correct_order = correctOrderMatch?.split(",").map(i => i.replace(/"/g, "").trim());
    }

    questions.push(questionBlock);
  }

  parsed.questions = questions;
  return parsed;
}

// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    // Validate input
    const validationErrors = validateUserInput({ username, password, name, email });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username ? 
               'Username already exists' : 
               'Email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      name,
      email,
      quizSubmissions: [],
      leaderboard: []
    });

    // Save user to database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, username }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User authentication and login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Generate quiz route
app.post('/generate-quiz',authenticateToken,async (req, res) => {
  try {
    const { topic } = req.body;

    // Validate input
    const validationErrors = validateQuizInput({ topic });
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Generate unique quiz ID
    const quizId = uuidv4();

    // Spawn Python process to generate quiz
    const pythonProcess = spawn('python', ['generate_quiz.py']);

    let quizData = '';
    let errorData = '';

    // Send topic to Python script via stdin
    pythonProcess.stdin.write(topic);
    pythonProcess.stdin.end();

    // Capture stdout
    pythonProcess.stdout.on('data', (data) => {
      quizData += data.toString();
    });

    // Capture stderr
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Handle process exit
    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorData);
        return res.status(500).json({ error: 'Failed to generate quiz' });
      }

      try {
        // Parse quiz data
        const parsedQuiz = parseQuizWithRegex(quizData);

        if (!parsedQuiz.topic || !parsedQuiz.questions || parsedQuiz.questions.length < 20) {
          return res.status(500).json({ error: 'Invalid quiz data generated' });
        }

        // Convert generated_at to Date object
        const generatedAt = new Date(parsedQuiz.generated_at);

        // Create new quiz document
        const newQuiz = new Quiz({
          quizId,
          topic: parsedQuiz.topic,
          subtopics: parsedQuiz.subtopics || [],
          generated_at: generatedAt,
          question_count: parsedQuiz.question_count,
          questions: parsedQuiz.questions,
          createdBy: req.user.id
        });

        // Save quiz to database
        await newQuiz.save();

        // Return quiz data
        res.json({
          quizId,
          topic: parsedQuiz.topic,
          subtopics: parsedQuiz.subtopics,
          generated_at: parsedQuiz.generated_at,
          question_count: parsedQuiz.question_count,
          questions: parsedQuiz.questions
        });
      } catch (error) {
        console.error('Quiz parsing/storage error:', error);
        res.status(500).json({ error: 'Failed to process quiz data' });
      }
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Route to submit quiz answers and calculate percentile


import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/submit-quiz', authenticateToken, async (req, res) => {
  try {
    const { answers, questions } = req.body;

    if (!Array.isArray(answers) || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid quiz data submitted.' });
    }

    // Calculate score
    let userScore = 0;
    answers.forEach((answer, index) => {
      const correctAnswer = questions[index]?.answer;
      if (answer === correctAnswer) {
        userScore++;
      }
    });

    // Send score email to Jash
    try {
        await resend.emails.send({
            from: 'TeamVyom <support@teamtarang.co.in>',
            to: ['jashbarot05@gmail.com'],
            subject: '🎉 Your Quiz Results Are In! | TeamVyom',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Quiz Results</title>
                <style>
                  body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                  }
                  .header {
                    text-align: center;
                    padding: 20px 0;
                    border-bottom: 1px solid #eaeaea;
                  }
                  .logo {
                    max-width: 150px;
                    margin-bottom: 15px;
                  }
                  .content {
                    padding: 30px 20px;
                  }
                  h1 {
                    color: #3f51b5;
                    margin-top: 0;
                    font-size: 28px;
                  }
                  .result-box {
                    background-color: #f2f7ff;
                    border-left: 4px solid #3f51b5;
                    padding: 20px;
                    margin: 25px 0;
                    border-radius: 4px;
                  }
                  .score {
                    font-size: 42px;
                    font-weight: bold;
                    color: #3f51b5;
                    text-align: center;
                    margin: 10px 0;
                  }
                  .cta-button {
                    display: inline-block;
                    background-color: #3f51b5;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 12px 25px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin: 15px 0;
                    text-align: center;
                  }
                  .footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #eaeaea;
                    color: #999;
                    font-size: 12px;
                  }
                  .social-links {
                    margin: 15px 0;
                  }
                  .social-icon {
                    margin: 0 5px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <img class="logo" src="https://teamtarang.co.in/logo.png" alt="TeamVyom Logo">
                    <h1>Quiz Results</h1>
                  </div>
                  
                  <div class="content">
                    <p>Hello <strong>Jash</strong>,</p>
                    
                    <p>Congratulations on completing the TeamVyom quiz! Here are your results:</p>
                    
                    <div class="result-box">
                      <p style="text-align: center; margin-bottom: 5px;">Your Score</p>
                      <div class="score">${userScore}</div>
                    </div>
                    
                    <p>We hope you enjoyed the challenge! Keep learning and growing with TeamVyom.</p>
                    
                    <p style="text-align: center;">
                      <a href="https://teamtarang.co.in/dashboard" class="cta-button">View Your Dashboard</a>
                    </p>
                    
                    <p>Want to improve your score? Check out our <a href="https://teamtarang.co.in/resources" style="color: #3f51b5; text-decoration: none;">learning resources</a> or try another quiz from our collection.</p>
                  </div>
                  
                  <div class="footer">
                    <div class="social-links">
                      <a href="https://facebook.com/teamvyom" class="social-icon">Facebook</a> |
                      <a href="https://instagram.com/teamvyom" class="social-icon">Instagram</a> |
                      <a href="https://twitter.com/teamvyom" class="social-icon">Twitter</a>
                    </div>
                    <p>© 2025 TeamVyom. All rights reserved.</p>
                    <p>If you have any questions, please contact us at <a href="mailto:support@teamtarang.co.in">support@teamtarang.co.in</a></p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
    } catch (emailError) {
      console.error('Error sending score email:', emailError);
    }

    res.json({ userScore });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});