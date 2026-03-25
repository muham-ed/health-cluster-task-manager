const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskHistory = sequelize.define('TaskHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM(
      'created',
      'assigned',
      'status_changed',
      'updated',
      'commented',
      'approved',
      'rejected'
    ),
    allowNull: false
  },
  fromStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  toStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  changes: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  performedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true
  }
}, {
  tableName: 'task_histories',
  timestamps: true,
  indexes: [
    { fields: ['taskId'] },
    { fields: ['performedBy'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = TaskHistory;