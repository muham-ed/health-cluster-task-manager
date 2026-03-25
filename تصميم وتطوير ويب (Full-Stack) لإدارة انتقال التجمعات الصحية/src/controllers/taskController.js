const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const WorkflowService = require('../services/workflowService');
const { validationResult } = require('express-validator');

class TaskController {
  
  // إنشاء مهمة جديدة
  static async createTask(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const transaction = await Task.sequelize.transaction();
    
    try {
      const taskData = {
        ...req.body,
        createdBy: req.user.id,
        status: 'started',
        startedAt: new Date()
      };
      
      const task = await Task.create(taskData, { transaction });
      
      // تسجيل إنشاء المهمة
      await TaskHistory.create({
        taskId: task.id,
        action: 'created',
        changes: taskData,
        performedBy: req.user.id,
        ipAddress: req.ip
      }, { transaction });
      
      await transaction.commit();
      
      res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully'
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating task',
        error: error.message
      });
    }
  }
  
  // الحصول على جميع المهام
  static async getAllTasks(req, res) {
    try {
      const { status, clusterId, priority, page = 1, limit = 10 } = req.query;
      let where = {};
      
      if (status) where.status = status;
      if (clusterId) where.clusterId = clusterId;
      if (priority) where.priority = priority;
      
      // تصفية حسب مستوى المستخدم
      if (req.user.level === 'CLUSTER') {
        where.clusterId = req.user.clusterId;
      }
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Task.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: ['cluster', 'assignedTo', 'createdBy', 'approvedBy']
      });
      
      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tasks',
        error: error.message
      });
    }
  }
  
  // الحصول على مهمة محددة
  static async getTaskById(req, res) {
    try {
      const task = await Task.findByPk(req.params.id, {
        include: ['cluster', 'assignedTo', 'createdBy', 'approvedBy']
      });
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      // التحقق من الصلاحيات
      if (req.user.level === 'CLUSTER' && task.clusterId !== req.user.clusterId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const history = await WorkflowService.getTaskHistory(task.id);
      
      res.json({
        success: true,
        data: task,
        history
      });
      
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching task',
        error: error.message
      });
    }
  }
  
  // تحديث حالة المهمة
  static async updateTaskStatus(req, res) {
    try {
      const { status, comment } = req.body;
      
      const task = await Task.findByPk(req.params.id);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
      
      const updatedTask = await WorkflowService.updateTaskStatus(
        req.params.id,
        status,
        req.user.id,
        comment,
        req.ip
      );
      
      res.json({
        success: true,
        data: updatedTask,
        message: `Task status updated to ${status}`
      });
      
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // تعيين مهمة لمستخدم
  static async assignTask(req, res) {
    const transaction = await Task.sequelize.transaction();
    
    try {
      const { assignedTo } = req.body;
      const task = await Task.findByPk(req.params.id, { transaction });
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      await task.update({ assignedTo }, { transaction });
      
      await TaskHistory.create({
        taskId: task.id,
        action: 'assigned',
        changes: { assignedTo },
        performedBy: req.user.id,
        ipAddress: req.ip
      }, { transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        data: task,
        message: 'Task assigned successfully'
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error assigning task:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // إضافة تعليق على المهمة
  static async addComment(req, res) {
    try {
      const { comment } = req.body;
      
      await WorkflowService.logAction(
        req.params.id,
        'commented',
        req.user.id,
        { comment },
        comment
      );
      
      res.json({
        success: true,
        message: 'Comment added successfully'
      });
      
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // الحصول على مهام تجمع معين (للمشرفين)
  static async getTasksByCluster(req, res) {
    try {
      const { clusterId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;
      
      let where = { clusterId };
      if (status) where.status = status;
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Task.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: ['assignedToUser', 'createdByUser', 'approvedByUser']
      });
      
      const stats = await WorkflowService.getClusterStats(clusterId);
      
      res.json({
        success: true,
        data: rows,
        stats,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching cluster tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cluster tasks',
        error: error.message
      });
    }
  }
}

module.exports = TaskController;