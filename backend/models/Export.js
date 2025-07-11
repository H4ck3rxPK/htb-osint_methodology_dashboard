const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  taskId: { type: String, required: true },
  author: { type: String, default: '' },
  tags: [{ type: String }],
  date: { type: Date, default: Date.now },
  collectData: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending', 'completed'] }
});

const ExportSchema = new mongoose.Schema({
  exportId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  coreElement: { type: String, required: true },
  selectedChild: { type: String, required: true },
  connectedResources: [{ type: String }],
  tasks: [TaskSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Export', ExportSchema);
