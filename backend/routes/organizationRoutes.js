const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getOrganizations,
  createOrganization,
  addBranch,
} = require('../controllers/organizationController');

router.get('/', getOrganizations);
router.post('/', protect, authorizeRoles('admin'), createOrganization);
router.post('/:id/branches', protect, authorizeRoles('admin'), addBranch);

module.exports = router;
