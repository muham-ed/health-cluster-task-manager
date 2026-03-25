const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const sequelize = require('./src/config/database');
const setupRelations = require('./src/models/relations');
const taskRoutes = require('./src/routes/tasks');
const clusterRoutes = require('./src/routes/clusters');
const authRoutes = require('./src/routes/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات الأمان
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تحديد معدل الطلبات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// مسارات API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/clusters', clusterRoutes);

// مسار الصحة
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// بدء الخادم
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    // إعداد العلاقات
    setupRelations();
    
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Models synchronized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();