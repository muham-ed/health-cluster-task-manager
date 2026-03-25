const Cluster = require('../models/Cluster');
const WorkflowService = require('../services/workflowService');

class ClusterController {
  
  // إنشاء تجمع صحي جديد
  static async createCluster(req, res) {
    try {
      const cluster = await Cluster.create(req.body);
      
      res.status(201).json({
        success: true,
        data: cluster,
        message: 'Cluster created successfully'
      });
      
    } catch (error) {
      console.error('Error creating cluster:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating cluster',
        error: error.message
      });
    }
  }
  
  // الحصول على جميع التجمعات
  static async getAllClusters(req, res) {
    try {
      const clusters = await Cluster.findAll({
        where: req.user.level === 'CLUSTER' ? { id: req.user.clusterId } : {},
        include: ['users']
      });
      
      res.json({
        success: true,
        data: clusters
      });
      
    } catch (error) {
      console.error('Error fetching clusters:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching clusters',
        error: error.message
      });
    }
  }
  
  // الحصول على إحصائيات تجمع معين
  static async getClusterStats(req, res) {
    try {
      const cluster = await Cluster.findByPk(req.params.id);
      
      if (!cluster) {
        return res.status(404).json({
          success: false,
          message: 'Cluster not found'
        });
      }
      
      const stats = await WorkflowService.getClusterStats(cluster.id);
      
      res.json({
        success: true,
        data: {
          cluster,
          stats
        }
      });
      
    } catch (error) {
      console.error('Error fetching cluster stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cluster stats',
        error: error.message
      });
    }
  }
  
  // تحديث معلومات التجمع
  static async updateCluster(req, res) {
    try {
      const cluster = await Cluster.findByPk(req.params.id);
      
      if (!cluster) {
        return res.status(404).json({
          success: false,
          message: 'Cluster not found'
        });
      }
      
      await cluster.update(req.body);
      
      res.json({
        success: true,
        data: cluster,
        message: 'Cluster updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating cluster:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating cluster',
        error: error.message
      });
    }
  }
}

module.exports = ClusterController;