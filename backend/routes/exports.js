const express = require('express');
const router = express.Router();
const Export = require('../models/Export');

// 創建新的導出
router.post('/', async (req, res) => {
  console.log(`創建新導出:`, req.body);
  try {
    const newExport = new Export({
      exportId: req.body.exportId,
      coreElement: req.body.coreElement,
      selectedChild: req.body.selectedChild,
      connectedResources: req.body.connectedResources,
      tasks: [{
        taskId: Date.now().toString(),
        tags: req.body.connectedResources,
        date: new Date()
      }]
    });
    
    const savedExport = await newExport.save();
    console.log(`新導出已保存:`, savedExport.exportId);
    res.json(savedExport);
  } catch (error) {
    console.error(`創建錯誤:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取所有導出
router.get('/', async (req, res) => {
  console.log(`獲取所有導出`);
  try {
    const exports = await Export.find().sort({ createdAt: -1 });
    console.log(`找到 ${exports.length} 個導出`);
    res.json(exports);
  } catch (error) {
    console.error(`獲取錯誤:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 根據ID獲取特定導出
router.get('/:exportId', async (req, res) => {
  console.log(`🔍 查詢 exportId: ${req.params.exportId}`);
  try {
    const exportData = await Export.findOne({ exportId: req.params.exportId });
    if (!exportData) {
      console.log(`未找到 exportId: ${req.params.exportId}`);
      return res.status(404).json({ error: '找不到該導出記錄' });
    }
    console.log(`找到數據:`, exportData.exportId, '任務數量:', exportData.tasks.length);
    res.json(exportData);
  } catch (error) {
    console.error(`查詢錯誤:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 更新任務
router.put('/:exportId/tasks', async (req, res) => {
  console.log(`更新任務 exportId: ${req.params.exportId}`, req.body.tasks.length, '個任務');
  try {
    const exportData = await Export.findOne({ exportId: req.params.exportId });
    if (!exportData) {
      console.log(`更新失敗，未找到 exportId: ${req.params.exportId}`);
      return res.status(404).json({ error: '找不到該導出記錄' });
    }
    
    exportData.tasks = req.body.tasks;
    exportData.updatedAt = new Date();
    
    const updatedExport = await exportData.save();
    console.log(`任務已更新:`, exportData.exportId);
    res.json(updatedExport);
  } catch (error) {
    console.error(`更新錯誤:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
