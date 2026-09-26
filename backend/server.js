const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`================================================`);
    console.log(`🚀 Kabi Notes Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`🌐 Server listening on http://localhost:${PORT}`);
    console.log(`================================================`);
  });
}).catch((err) => {
  console.error('Failed to start server due to DB connection error:', err);
});
