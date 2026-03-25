const { body, param, validationResult } = require('express-validator');

// التحقق من صحة إنشاء مهمة
const validateTask = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('clusterId').isUUID().withMessage('Invalid cluster ID'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('type').optional().isIn(['request', 'assignment', 'report', 'inspection', 'other']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assignedTo').optional().isUUID().withMessage('Invalid user ID'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// التحقق من صحة تحديث حالة المهمة
const validateStatusUpdate = [
  param('id').isUUID().withMessage('Invalid task ID'),
  body('status').isIn(['started', 'in_progress', 'delivered', 'reviewed', 'approved', 'rejected'])
    .withMessage('Invalid status'),
  body('comment').optional().isString(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// التحقق من صحة إنشاء مستخدم
const validateUser = [
  body('username').notEmpty().isLength({ min: 3, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty(),
  body('role').isIn(['super_admin', 'hq_admin', 'cluster_manager', 'worker']),
  body('level').isIn(['HQ', 'CLUSTER']),
  body('clusterId').custom((value, { req }) => {
    if (req.body.level === 'CLUSTER' && !value) {
      throw new Error('Cluster ID is required for CLUSTER level users');
    }
    return true;
  }),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateTask,
  validateStatusUpdate,
  validateUser
};