const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 導入路由
const exportRoutes = require('./routes/exports');

// 中間件
app.use(cors({
   origin: ['http://localhost:3000', 'http://192.168.3.121:3000'],
   credentials: true
}));
app.use(express.json());

// MongoDB 連接
mongoose.connect('mongodb://localhost:27017/osint-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB 連接成功'))
.catch(err => console.error('MongoDB 連接失敗:', err));

// 路由
app.use('/api/exports', exportRoutes);

// 基本路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'OSINT Backend API 運行中',
    endpoints: [
      'GET /api/exports - 獲取所有導出',
      'POST /api/exports - 創建新導出',
      'GET /api/exports/:exportId - 獲取特定導出',
      'PUT /api/exports/:exportId/tasks - 更新任務'
    ]
  });
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
  console.log('可用的 API 端點:');
  console.log('- GET /api/exports');
  console.log('- POST /api/exports');
  console.log('- GET /api/exports/:exportId');
  console.log('- PUT /api/exports/:exportId/tasks');
});
