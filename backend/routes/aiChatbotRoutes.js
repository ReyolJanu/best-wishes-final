const express = require('express');
const router = express.Router();
const aiChatbotController = require('../controllers/aiChatbotController');

// @route   POST /api/chatbot/start
// @desc    Initialize a new chatbot conversation
// @access  Public
router.post('/start', aiChatbotController.startConversation);

// @route   POST /api/chatbot/process
// @desc    Process user input and return next question or suggestions
// @access  Public
router.post('/process', aiChatbotController.processUserInput);

// @route   GET /api/chatbot/state
// @desc    Get conversation state and available options
// @access  Public
router.get('/state', aiChatbotController.getConversationState);

// @route   POST /api/chatbot/reset
// @desc    Reset the conversation
// @access  Public
router.post('/reset', aiChatbotController.resetConversation);

module.exports = router;