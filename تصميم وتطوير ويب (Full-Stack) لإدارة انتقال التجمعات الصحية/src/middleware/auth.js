const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// مصادقة JWT
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || !user.isActive) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Please authenticate'
    });
  }
};

// التحقق من الصلاحيات
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }
    
    next();
  };
};

// التحقق من المستوى (HQ/CLUSTER)
const checkLevel = (allowedLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedLevels.includes(req.user.level)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid user level'
      });
    }
    
    next();
  };
};

module.exports = { authMiddleware, checkRole, checkLevel };