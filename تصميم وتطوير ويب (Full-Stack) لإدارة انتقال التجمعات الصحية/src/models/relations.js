const User = require('./User');
const Task = require('./Task');
const TaskHistory = require('./TaskHistory');
const Cluster = require('./Cluster');

// تعريف العلاقات
const setupRelations = () => {
  // Cluster - User
  Cluster.hasMany(User, { foreignKey: 'clusterId', as: 'users' });
  User.belongsTo(Cluster, { foreignKey: 'clusterId', as: 'cluster' });
  
  // Cluster - Task
  Cluster.hasMany(Task, { foreignKey: 'clusterId', as: 'tasks' });
  Task.belongsTo(Cluster, { foreignKey: 'clusterId', as: 'cluster' });
  
  // User - Task (assigned)
  User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks' });
  Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedToUser' });
  
  // User - Task (created)
  User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
  Task.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
  
  // User - Task (approved)
  User.hasMany(Task, { foreignKey: 'approvedBy', as: 'approvedTasks' });
  Task.belongsTo(User, { foreignKey: 'approvedBy', as: 'approvedByUser' });
  
  // Task - TaskHistory
  Task.hasMany(TaskHistory, { foreignKey: 'taskId', as: 'history' });
  TaskHistory.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
  
  // User - TaskHistory
  User.hasMany(TaskHistory, { foreignKey: 'performedBy', as: 'actions' });
  TaskHistory.belongsTo(User, { foreignKey: 'performedBy', as: 'performedByUser' });
};

module.exports = setupRelations;