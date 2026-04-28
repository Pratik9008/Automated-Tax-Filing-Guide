const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expense');
const taxRoutes = require('./routes/tax');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/indian_tax_advisor';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend'), {
  setHeaders(res, filePath) {
    if (/\.(html|css|js)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Automated Tax Filing Guide API'
  });
});

app.use('/api', authRoutes);
app.use('/api', incomeRoutes);
app.use('/api', expenseRoutes);
app.use('/api', taxRoutes);
app.use('/api', aiRoutes);
app.use('/api', chatRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();
