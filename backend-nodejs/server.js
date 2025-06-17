/**
 * ChessMentor Node.js API server
 * Handles authentication and OpenAI integration
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Store API keys temporarily (in production, use Redis or secure session store)
const userSessions = new Map();

// Routes
// Returns application status
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ChessMentor Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// OpenAI API Key management
// Validates user key and stores in memory
app.post('/api/auth/openai', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Validate API key with a simple test call
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey });
    
    try {
      await openai.models.list();
      
      // Generate session ID
      const sessionId = Math.random().toString(36).substring(2, 15);
      
      // Store API key temporarily
      userSessions.set(sessionId, {
        apiKey,
        timestamp: Date.now()
      });
      
      // Clean up old sessions (older than 1 hour)
      const oneHour = 60 * 60 * 1000;
      for (const [id, session] of userSessions.entries()) {
        if (Date.now() - session.timestamp > oneHour) {
          userSessions.delete(id);
        }
      }
      
      res.json({ 
        success: true, 
        sessionId,
        message: 'API key validated successfully' 
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid OpenAI API key' });
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chess GPT Coach endpoint
// Sends chat messages to OpenAI for analysis
app.post('/api/chess/coach', async (req, res) => {
  try {
    const { sessionId, message, gameState, analysisType } = req.body;
    
    if (!sessionId || !userSessions.has(sessionId)) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    const session = userSessions.get(sessionId);
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: session.apiKey });
    
    // Construct GPT prompt based on analysis type
    let systemPrompt = `You are ChessMentor, an expert chess coach and teacher. You provide clear, helpful advice to chess players of all levels.`;
    
    switch (analysisType) {
      case 'position':
        systemPrompt += ` Analyze the current chess position and provide strategic insights.`;
        break;
      case 'move':
        systemPrompt += ` Evaluate the chess move and suggest improvements or alternatives.`;
        break;
      case 'general':
        systemPrompt += ` Answer general chess questions and provide educational content.`;
        break;
      default:
        systemPrompt += ` Provide helpful chess coaching based on the context.`;
    }
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Game State (FEN): ${gameState}\n\nQuestion: ${message}` }
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7
    });
    
    res.json({
      success: true,
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from chess coach' });
  }
});

// Game state management
// Receives player moves and returns new board state
app.post('/api/chess/move', (req, res) => {
  try {
    const { move, gameState } = req.body;
    
    // Here you can add game validation logic
    // For now, we'll just echo back the move
    res.json({
      success: true,
      move,
      newGameState: gameState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing move:', error);
    res.status(500).json({ error: 'Failed to process move' });
  }
});

// Logout endpoint
// Clears session from memory
app.post('/api/auth/logout', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessionId && userSessions.has(sessionId)) {
      userSessions.delete(sessionId);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Error handling middleware
// Catch-all for unexpected errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
// Handles unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 ChessMentor Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
