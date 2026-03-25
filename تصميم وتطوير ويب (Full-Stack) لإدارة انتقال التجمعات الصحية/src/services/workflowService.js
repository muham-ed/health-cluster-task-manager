const { Op } = require('sequelize');
const Task = require('../models/Task');
const TaskHistory = require('../models/TaskHistory');
const { WORKFLOW_STATES, VALID_TRANSITIONS } = require('../utils/constants');

class WorkflowService {
  
  // تحديث حالة المهمة مع التحقق من صحة الانتقال
  static async updateTaskStatus(taskId, newStatus, userId, comment = '', ipAddress = null) {
    const transaction = await Task.sequelize.transaction();
    
    try {
      const task = await Task.findByPk(taskId, { transaction });
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      const currentStatus = task.status;
      
      // التحقق من صحة الانتقال
      if (!this.isValidTransition(currentStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }
      
      // تحديث وقت الحالة
      const updateData = {
        status: newStatus,
        [`${newStatus}At`]: new Date()
      };
      
      // تحديث حالات خاصة
      if (newStatus === 'approved') {
        updateData.approvedBy = userId;
      }
      
      await task.update(updateData, { transaction });
      
      // تسجيل التغيير في السجل
      await TaskHistory.create({
        taskId: task.id,
        action: 'status_changed',
        fromStatus: currentStatus,
        toStatus: newStatus,
        changes: { from: currentStatus, to: newStatus },
        comment,
        performedBy: userId,
        ipAddress
      }, { transaction });
      
      await transaction.commit();
      
      return task;
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // التحقق من صحة انتقال الحالة
  static isValidTransition(from, to) {
    const validTransitions = VALID_TRANSITIONS[from];
    return validTransitions ? validTransitions.includes(to) : false;
  }
  
  // الحصول على تاريخ المهمة
  static async getTaskHistory(taskId) {
    return await TaskHistory.findAll({
      where: { taskId },
      order: [['createdAt', 'DESC']],
      include: ['performedBy']
    });
  }
  
  // الحصول على إحصائيات المهام للتجمع
  static async getClusterStats(clusterId) {
    const tasks = await Task.findAll({
      where: { clusterId }
    });
    
    const stats = {
      total: tasks.length,
      byStatus: {},
      byPriority: {},
      overdue: 0
    };
    
    const now = new Date();
    
    tasks.forEach(task => {
      // إحصاءات الحالات
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      
      // إحصاءات الأولويات
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      
      // المهام المتأخرة
      if (task.dueDate && task.dueDate < now && task.status !== 'approved') {
        stats.overdue++;
      }
    });
    
    return stats;
  }
  
  // الحصول على المهام حسب مستوى الصلاحية
  static async getTasksByUserLevel(user) {
    let where = {};
    
    if (user.level === 'CLUSTER') {
      where.clusterId = user.clusterId;
      where.assignedTo = user.id;
    } else if (user.level === 'HQ') {
      // يمكن رؤية جميع المهام
      where = {};
    }
    
    return await Task.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: ['cluster', 'assignedTo', 'createdBy']
    });
  }
  
  // تسجيل حركة جديدة
  static async logAction(taskId, action, userId, changes, comment = '') {
    return await TaskHistory.create({
      taskId,
      action,
      changes,
      comment,
      performedBy: userId
    });
  }
}

module.exports = WorkflowService;