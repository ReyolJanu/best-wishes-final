const Product = require("../models/Product");
const Category = require("../models/Category");

// Chatbot conversation states
const CONVERSATION_STATES = {
  START: 'start',
  OCCASION: 'occasion',
  RECIPIENT: 'recipient',
  BUDGET: 'budget',
  CATEGORY: 'category',
  STYLE: 'style',
  FINAL_SUGGESTIONS: 'final_suggestions'
};

// Predefined options for each question
const CHATBOT_OPTIONS = {
  occasions: [
    'Birthday', 'Anniversary', 'Wedding', 'Valentine\'s Day', 'Christmas', 
    'Mother\'s Day', 'Father\'s Day', 'Graduation', 'Baby Shower', 'Just Because'
  ],
  recipients: [
    'Partner/Spouse', 'Mother', 'Father', 'Friend', 'Sibling', 
    'Colleague', 'Child', 'Grandparent', 'Teacher', 'Boss'
  ],
  budgets: [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: 'Over $200', min: 200, max: 10000 }
  ],
  styles: [
    'Modern', 'Classic', 'Romantic', 'Funny', 'Elegant', 
    'Casual', 'Luxury', 'Personalized', 'Practical', 'Unique'
  ]
};

// Mapping occasions to relevant categories and tags
const OCCASION_MAPPING = {
  'Birthday': {
    categories: ['gifts', 'cards', 'customizable'],
    tags: ['birthday', 'celebration', 'party', 'cake', 'candle'],
    keywords: ['birthday', 'celebrate', 'party', 'gift', 'card']
  },
  'Anniversary': {
    categories: ['gifts', 'cards', 'jewelry', 'customizable'],
    tags: ['anniversary', 'love', 'romantic', 'couple', 'memory'],
    keywords: ['anniversary', 'love', 'romantic', 'together', 'memory']
  },
  'Wedding': {
    categories: ['gifts', 'jewelry', 'home-decor'],
    tags: ['wedding', 'marriage', 'couple', 'celebration', 'elegant'],
    keywords: ['wedding', 'marriage', 'bride', 'groom', 'couple']
  },
  'Valentine\'s Day': {
    categories: ['gifts', 'jewelry', 'cards', 'flowers'],
    tags: ['valentine', 'love', 'romantic', 'heart', 'couple'],
    keywords: ['valentine', 'love', 'romantic', 'heart', 'red']
  },
  'Christmas': {
    categories: ['gifts', 'decorations', 'cards'],
    tags: ['christmas', 'holiday', 'festive', 'winter', 'family'],
    keywords: ['christmas', 'holiday', 'festive', 'santa', 'winter']
  }
};

// Recipient preferences
const RECIPIENT_MAPPING = {
  'Partner/Spouse': {
    categories: ['jewelry', 'gifts', 'cards', 'customizable'],
    tags: ['romantic', 'love', 'couple', 'personal', 'intimate'],
    pricePreference: 'higher'
  },
  'Mother': {
    categories: ['gifts', 'cards', 'jewelry', 'home-decor'],
    tags: ['mom', 'mother', 'family', 'love', 'care'],
    pricePreference: 'medium'
  },
  'Father': {
    categories: ['gifts', 'accessories', 'cards'],
    tags: ['dad', 'father', 'family', 'practical', 'tools'],
    pricePreference: 'medium'
  },
  'Friend': {
    categories: ['gifts', 'cards', 'accessories'],
    tags: ['friendship', 'fun', 'casual', 'thoughtful', 'share'],
    pricePreference: 'lower'
  }
};

class ChatbotController {
  // Initialize a new conversation
  async startConversation(req, res) {
    try {
      console.log('Starting chatbot conversation...');
      
      const welcomeMessage = {
        message: "Hi! I'm here to help you find the perfect gift! 🎁 Let's start with a few questions to understand what you're looking for.",
        state: CONVERSATION_STATES.OCCASION,
        question: "What's the occasion?",
        options: CHATBOT_OPTIONS.occasions,
        allowCustomInput: true
      };

      console.log('Sending welcome message:', welcomeMessage);

      res.json({
        success: true,
        data: welcomeMessage
      });
    } catch (error) {
      console.error('Error in startConversation:', error);
      res.status(500).json({
        success: false,
        message: "Error starting conversation",
        error: error.message
      });
    }
  }

  // Process user input and return next question or suggestions
  async processUserInput(req, res) {
    try {
      console.log('Processing user input:', req.body);
      
      const { userInput, currentState, conversationData = {} } = req.body;

      if (!userInput || !currentState) {
        console.log('Missing required fields:', { userInput, currentState });
        return res.status(400).json({
          success: false,
          message: "User input and current state are required"
        });
      }

      // Update conversation data with user input
      const updatedData = { ...conversationData };

      console.log('Current state:', currentState);
      console.log('User input:', userInput);
      console.log('Updated conversation data:', updatedData);

      switch (currentState) {
        case CONVERSATION_STATES.OCCASION:
          updatedData.occasion = userInput;
          return this.askRecipient(res, updatedData);
          
        case CONVERSATION_STATES.RECIPIENT:
          updatedData.recipient = userInput;
          return this.askBudget(res, updatedData);
          
        case CONVERSATION_STATES.BUDGET:
          updatedData.budget = userInput;
          return await this.askCategory(res, updatedData);
          
        case CONVERSATION_STATES.CATEGORY:
          updatedData.preferredCategory = userInput;
          return this.askStyle(res, updatedData);
          
        case CONVERSATION_STATES.STYLE:
          updatedData.style = userInput;
          return await this.generateSuggestions(res, updatedData);
          
        default:
          console.log('Invalid conversation state:', currentState);
          return res.status(400).json({
            success: false,
            message: "Invalid conversation state"
          });
      }
    } catch (error) {
      console.error("Error processing user input:", error);
      res.status(500).json({
        success: false,
        message: "Error processing user input",
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Helper method for asking about recipient
  askRecipient(res, conversationData) {
    const response = {
      message: `Great! A gift for ${conversationData.occasion}. 🎉`,
      state: CONVERSATION_STATES.RECIPIENT,
      question: "Who is this gift for?",
      options: CHATBOT_OPTIONS.recipients,
      allowCustomInput: true,
      conversationData
    };

    return res.json({ success: true, data: response });
  }

  // Helper method for asking about budget
  askBudget(res, conversationData) {
    const response = {
      message: `Perfect! A ${conversationData.occasion} gift for your ${conversationData.recipient}. 💝`,
      state: CONVERSATION_STATES.BUDGET,
      question: "What's your budget range?",
      options: CHATBOT_OPTIONS.budgets,
      conversationData
    };

    return res.json({ success: true, data: response });
  }

  // Helper method for asking about category
  async askCategory(res, conversationData) {
    try {
      console.log('Asking about category...');
      
      // Get available categories from database
      const categories = await Category.find({ isActive: true }).select('name key');
      console.log('Found categories:', categories);
      
      const categoryOptions = categories.map(cat => cat.name);

      const response = {
        message: `Budget set! Now let's narrow it down. 🎯`,
        state: CONVERSATION_STATES.CATEGORY,
        question: "Any specific product category in mind?",
        options: [...categoryOptions, "No preference"],
        allowCustomInput: true,
        conversationData
      };

      console.log('Category response:', response);

      return res.json({ success: true, data: response });
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to predefined categories
      const response = {
        message: `Budget set! Now let's narrow it down. 🎯`,
        state: CONVERSATION_STATES.CATEGORY,
        question: "Any specific product category in mind?",
        options: ["Gifts", "Cards", "Jewelry", "Accessories", "Home & Decor", "No preference"],
        allowCustomInput: true,
        conversationData
      };

      console.log('Using fallback categories:', response);

      return res.json({ success: true, data: response });
    }
  }

  // Helper method for asking about style
  askStyle(res, conversationData) {
    const response = {
      message: `Almost there! Just one more question. ✨`,
      state: CONVERSATION_STATES.STYLE,
      question: "What style are you looking for?",
      options: CHATBOT_OPTIONS.styles,
      allowCustomInput: true,
      conversationData
    };

    return res.json({ success: true, data: response });
  }

  // Generate final product suggestions
  async generateSuggestions(res, conversationData) {
    try {
      console.log('Generating suggestions for conversation data:', conversationData);
      
      const { occasion, recipient, budget, preferredCategory, style } = conversationData;

      // Build search query based on conversation data
      const searchQuery = this.buildSearchQuery(conversationData);
      console.log("Generated search query:", JSON.stringify(searchQuery, null, 2));

      // Search for products
      let products = await Product.find(searchQuery)
        .sort({ rating: -1, createdAt: -1 })
        .limit(20);

      console.log(`Found ${products.length} products with main query`);

      // If no products found, try fallback search
      if (products.length === 0) {
        console.log('No products found, trying fallback search...');
        products = await this.fallbackSearch(conversationData);
        console.log(`Fallback search found ${products.length} products`);
      }

      // If still no products, show popular items
      if (products.length === 0) {
        console.log('Still no products, getting popular items...');
        products = await Product.find({ status: 'active' })
          .sort({ rating: -1, featured: -1 })
          .limit(10);
        console.log(`Popular items fallback: ${products.length} products`);
      }

      // Filter by budget if specified
      if (budget && typeof budget === 'object' && budget.min !== undefined) {
        console.log('Filtering by budget:', budget);
        const originalCount = products.length;
        products = products.filter(product => {
          const price = product.salePrice > 0 ? product.salePrice : product.retailPrice;
          return price >= budget.min && price <= budget.max;
        });
        console.log(`Budget filtered from ${originalCount} to ${products.length} products`);
      }

      // Limit to top 8 suggestions
      const suggestions = products.slice(0, 8);
      console.log(`Final suggestions count: ${suggestions.length}`);

      // Generate alternative suggestions for "no match" scenario
      console.log('Generating alternatives...');
      const alternatives = await this.generateAlternatives(conversationData);
      console.log(`Generated ${alternatives.length} alternatives`);

      const response = {
        message: this.generateSuggestionMessage(conversationData, suggestions.length),
        state: CONVERSATION_STATES.FINAL_SUGGESTIONS,
        suggestions: suggestions.map(product => ({
          id: product._id,
          name: product.name,
          shortDescription: product.shortDescription,
          price: product.salePrice > 0 ? product.salePrice : product.retailPrice,
          originalPrice: product.retailPrice,
          images: product.images || [],
          rating: product.rating,
          category: product.mainCategory,
          tags: product.tags || []
        })),
        alternatives: alternatives.map(product => ({
          id: product._id,
          name: product.name,
          shortDescription: product.shortDescription,
          price: product.salePrice > 0 ? product.salePrice : product.retailPrice,
          images: product.images || [],
          category: product.mainCategory
        })),
        searchSummary: {
          occasion,
          recipient,
          budget: budget?.label || budget,
          category: preferredCategory,
          style,
          totalFound: suggestions.length
        },
        conversationData
      };

      console.log('Final response prepared, sending to client...');

      return res.json({ success: true, data: response });

    } catch (error) {
      console.error("Error generating suggestions:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Error generating product suggestions",
        error: error.message,
        stack: error.stack
      });
    }
  }

  // Build MongoDB query based on conversation data
  buildSearchQuery(conversationData) {
    try {
      console.log('Building search query for:', conversationData);
      
      const { occasion, recipient, preferredCategory, style } = conversationData;
      
      const query = { status: 'active' };
      const orConditions = [];
      
      console.log('Initial query:', query);
      
      // Category matching
      if (preferredCategory && preferredCategory !== "No preference") {
        query.mainCategory = { $regex: preferredCategory, $options: 'i' };
        console.log('Added category filter:', query.mainCategory);
      }

      // Occasion-based matching
      if (occasion && OCCASION_MAPPING[occasion]) {
        console.log('Processing occasion:', occasion);
        const mapping = OCCASION_MAPPING[occasion];
        
        // Add category conditions
        if (mapping.categories) {
          const categoryCondition = {
            mainCategory: { $in: mapping.categories.map(cat => new RegExp(cat, 'i')) }
          };
          orConditions.push(categoryCondition);
          console.log('Added occasion category condition:', categoryCondition);
        }

        // Add tag conditions
        if (mapping.tags) {
          const tagCondition = {
            tags: { $in: mapping.tags.map(tag => new RegExp(tag, 'i')) }
          };
          orConditions.push(tagCondition);
          console.log('Added tag condition:', tagCondition);
        }

        // Add keyword search in name and description
        if (mapping.keywords) {
          const keywordRegex = mapping.keywords.map(keyword => new RegExp(keyword, 'i'));
          const keywordCondition = {
            $or: [
              { name: { $in: keywordRegex } },
              { shortDescription: { $in: keywordRegex } },
              { detailedDescription: { $in: keywordRegex } }
            ]
          };
          orConditions.push(keywordCondition);
          console.log('Added keyword condition:', keywordCondition);
        }
      } else if (occasion) {
        console.log('Occasion not found in mapping:', occasion);
      }

      // Recipient-based matching
      if (recipient && RECIPIENT_MAPPING[recipient]) {
        console.log('Processing recipient:', recipient);
        const mapping = RECIPIENT_MAPPING[recipient];
        
        if (mapping.tags) {
          const recipientTagCondition = {
            tags: { $in: mapping.tags.map(tag => new RegExp(tag, 'i')) }
          };
          orConditions.push(recipientTagCondition);
          console.log('Added recipient tag condition:', recipientTagCondition);
        }
      } else if (recipient) {
        console.log('Recipient not found in mapping:', recipient);
      }

      // Style-based matching
      if (style && style !== "No preference") {
        console.log('Processing style:', style);
        const styleCondition = {
          $or: [
            { tags: { $regex: style, $options: 'i' } },
            { name: { $regex: style, $options: 'i' } },
            { shortDescription: { $regex: style, $options: 'i' } }
          ]
        };
        orConditions.push(styleCondition);
        console.log('Added style condition:', styleCondition);
      }

      // Combine conditions
      if (orConditions.length > 0) {
        query.$or = orConditions;
        console.log('Final query with OR conditions:', JSON.stringify(query, null, 2));
      } else {
        console.log('No OR conditions added, using basic query:', query);
      }

      return query;
    } catch (error) {
      console.error('Error in buildSearchQuery:', error);
      // Return a safe fallback query
      return { status: 'active' };
    }
  }

  // Fallback search when no products match
  async fallbackSearch(conversationData) {
    const { occasion, recipient, preferredCategory } = conversationData;
    
    // Try broader category search
    if (preferredCategory && preferredCategory !== "No preference") {
      const products = await Product.find({
        status: 'active',
        mainCategory: { $regex: preferredCategory.split(' ')[0], $options: 'i' }
      }).limit(10);
      
      if (products.length > 0) return products;
    }

    // Try occasion-based broad search
    if (occasion) {
      const searchTerms = [occasion.toLowerCase(), 'gift', 'present'];
      const products = await Product.find({
        status: 'active',
        $or: [
          { tags: { $in: searchTerms.map(term => new RegExp(term, 'i')) } },
          { name: { $in: searchTerms.map(term => new RegExp(term, 'i')) } }
        ]
      }).limit(10);
      
      if (products.length > 0) return products;
    }

    // Return popular products as final fallback
    return await Product.find({ status: 'active' })
      .sort({ rating: -1, featured: -1 })
      .limit(10);
  }

  // Generate alternative product suggestions
  async generateAlternatives(conversationData) {
    try {
      // Get popular products from different categories
      const alternatives = await Product.find({ 
        status: 'active',
        featured: true 
      })
      .sort({ rating: -1 })
      .limit(4);

      return alternatives;
    } catch (error) {
      console.error("Error generating alternatives:", error);
      return [];
    }
  }

  // Generate a personalized message for suggestions
  generateSuggestionMessage(conversationData, productCount) {
    const { occasion, recipient } = conversationData;
    
    if (productCount === 0) {
      return `I couldn't find exact matches for your ${occasion} gift for ${recipient}, but here are some popular alternatives that might work! 🎁`;
    }
    
    if (productCount === 1) {
      return `Perfect! I found a great ${occasion} gift for your ${recipient}! ✨`;
    }
    
    return `Excellent! I found ${productCount} perfect ${occasion} gifts for your ${recipient}! Here are my top recommendations: 🎉`;
  }

  // Get conversation state for frontend
  async getConversationState(req, res) {
    try {
      // This could be enhanced to store conversation state in database/session
      // For now, return the available options for each state
      const response = {
        states: CONVERSATION_STATES,
        options: CHATBOT_OPTIONS,
        success: true
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching conversation state",
        error: error.message
      });
    }
  }

  // Reset conversation
  async resetConversation(req, res) {
    try {
      const response = await this.startConversation(req, res);
      return response;
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error resetting conversation",
        error: error.message
      });
    }
  }
}

// Create instance and bind methods to maintain 'this' context
const chatbotController = new ChatbotController();

// Bind all methods to the instance
const boundController = {
  startConversation: chatbotController.startConversation.bind(chatbotController),
  processUserInput: chatbotController.processUserInput.bind(chatbotController),
  getConversationState: chatbotController.getConversationState.bind(chatbotController),
  resetConversation: chatbotController.resetConversation.bind(chatbotController)
};

module.exports = boundController;