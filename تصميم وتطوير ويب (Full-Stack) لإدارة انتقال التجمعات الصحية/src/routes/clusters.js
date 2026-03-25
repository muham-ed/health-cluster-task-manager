const express = require('express');
const router = express.Router();
const ClusterController = require('../controllers/clusterController');
const { authMiddleware, checkRole } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', ClusterController.getAllClusters);
router.get('/:id/stats', ClusterController.getClusterStats);
router.post('/', checkRole(['super_admin']), ClusterController.createCluster);
router.put('/:id', checkRole(['super_admin', 'hq_admin']), ClusterController.updateCluster);

module.exports = router;