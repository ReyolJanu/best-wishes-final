const mongoose = require("mongoose");
const Quote = require("./models/Quote");
require("dotenv").config();

const quotes = [
  // Birthday quotes
  {
    text: "Happy Birthday! May your day be filled with happiness and your year with joy.",
    category: "birthday",
    type: "both",
    tags: ["happy", "joy", "celebration"]
  },
  {
    text: "Another year older, another year wiser. Happy Birthday!",
    category: "birthday",
    type: "both",
    tags: ["wisdom", "age", "celebration"]
  },
  {
    text: "Wishing you a birthday that's just as wonderful as you are!",
    category: "birthday",
    type: "both",
    tags: ["wonderful", "special", "celebration"]
  },
  {
    text: "May your birthday be the start of a year filled with good luck, good health, and much happiness.",
    category: "birthday",
    type: "both",
    tags: ["luck", "health", "happiness"]
  },
  {
    text: "Happy Birthday to someone who makes every day brighter!",
    category: "birthday",
    type: "both",
    tags: ["bright", "special", "celebration"]
  },

  // Anniversary quotes
  {
    text: "Happy Anniversary! Here's to many more years of love and laughter.",
    category: "anniversary",
    type: "both",
    tags: ["love", "laughter", "years"]
  },
  {
    text: "Congratulations on another year of love, happiness, and togetherness.",
    category: "anniversary",
    type: "both",
    tags: ["love", "happiness", "together"]
  },
  {
    text: "May your love continue to grow with each passing year. Happy Anniversary!",
    category: "anniversary",
    type: "both",
    tags: ["love", "growth", "celebration"]
  },
  {
    text: "Wishing you both a lifetime of love and happiness. Happy Anniversary!",
    category: "anniversary",
    type: "both",
    tags: ["lifetime", "love", "happiness"]
  },

  // Love quotes
  {
    text: "You are my sunshine on a cloudy day.",
    category: "love",
    type: "both",
    tags: ["sunshine", "cloudy", "romantic"]
  },
  {
    text: "Every moment with you is a treasure.",
    category: "love",
    type: "both",
    tags: ["treasure", "moment", "romantic"]
  },
  {
    text: "You make my heart smile.",
    category: "love",
    type: "both",
    tags: ["heart", "smile", "romantic"]
  },

  // Friendship quotes
  {
    text: "A friend like you is a gift that keeps on giving.",
    category: "friendship",
    type: "both",
    tags: ["gift", "friend", "giving"]
  },
  {
    text: "Thank you for being such an amazing friend!",
    category: "friendship",
    type: "both",
    tags: ["amazing", "thank you", "friend"]
  },
  {
    text: "Friends like you make life beautiful.",
    category: "friendship",
    type: "both",
    tags: ["beautiful", "life", "friend"]
  },

  // Motivational quotes
  {
    text: "Believe you can and you're halfway there.",
    category: "motivational",
    type: "both",
    tags: ["believe", "halfway", "motivation"]
  },
  {
    text: "Dream big, work hard, stay focused.",
    category: "motivational",
    type: "both",
    tags: ["dream", "work", "focus"]
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    category: "motivational",
    type: "both",
    tags: ["success", "failure", "courage"]
  },

  // Funny quotes
  {
    text: "Age is merely mind over matter. If you don't mind, it doesn't matter!",
    category: "funny",
    type: "both",
    tags: ["age", "mind", "humor"]
  },
  {
    text: "You're not getting older, you're just becoming a classic!",
    category: "funny",
    type: "both",
    tags: ["older", "classic", "humor"]
  },
  {
    text: "Coffee: because adulting is hard.",
    category: "funny",
    type: "mug",
    tags: ["coffee", "adulting", "humor"]
  },

  // Congratulations quotes
  {
    text: "Congratulations on your amazing achievement!",
    category: "congratulations",
    type: "both",
    tags: ["achievement", "amazing", "success"]
  },
  {
    text: "Well done! Your hard work has paid off.",
    category: "congratulations",
    type: "both",
    tags: ["hard work", "paid off", "success"]
  },

  // Thank you quotes
  {
    text: "Thank you for being so wonderful!",
    category: "thank-you",
    type: "both",
    tags: ["wonderful", "gratitude", "appreciation"]
  },
  {
    text: "Your kindness means the world to me.",
    category: "thank-you",
    type: "both",
    tags: ["kindness", "world", "appreciation"]
  },

  // General quotes
  {
    text: "Life is beautiful, and so are you!",
    category: "general",
    type: "both",
    tags: ["life", "beautiful", "positive"]
  },
  {
    text: "Every day is a new beginning.",
    category: "general",
    type: "both",
    tags: ["day", "beginning", "positive"]
  }
];

const seedQuotes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing quotes
    await Quote.deleteMany({});
    console.log("Cleared existing quotes");

    // Insert new quotes
    await Quote.insertMany(quotes);
    console.log(`Inserted ${quotes.length} quotes successfully`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding quotes:", error);
    process.exit(1);
  }
};

seedQuotes();