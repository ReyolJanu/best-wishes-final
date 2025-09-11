const app = require("./app");
const PORT = process.env.PORT || 5000 || 4000; 

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Start the reminder scheduler
require('./controllers/reminderScheduler');
