const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { validationResult } = require('express-validator');

class AuthController {
  
  // تسجيل الدخول
  static async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({
        where: { email, isActive: true },
        include: ['cluster']
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      await user.update({ lastLogin: new Date() });
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, level: user.level },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );
      
      const userData = user.toJSON();
      delete userData.password;
      
      res.json({
        success: true,
        data: { user: userData, token },
        message: 'Login successful'
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login',
        error: error.message
      });
    }
  }
  
  // الحصول على المستخدم الحالي
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: ['cluster']
      });
      
      res.json({ success: true, data: user });
      
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user data',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;