const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authMiddleware, checkRole } = require('../middleware/auth');
const { validateTask } = require('../middleware/validation');

// جميع المسارات تتطلب توثيق
router.use(authMiddleware);

// مسارات المهام
router.get('/', TaskController.getAllTasks);
router.get('/:id', TaskController.getTaskById);
router.post('/', validateTask, TaskController.createTask);
router.put('/:id/status', TaskController.updateTaskStatus);
router.put('/:id/assign', TaskController.assignTask);
router.post('/:id/comments', TaskController.addComment);

// مسارات إضافية
router.get('/stats/cluster/:clusterId', checkRole(['hq_admin', 'super_admin']), TaskController.getTasksByCluster);

module.exports = router;