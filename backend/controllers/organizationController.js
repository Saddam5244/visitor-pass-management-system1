const Organization = require('../models/Organization');

/**
 * @desc    Get all organizations
 * @route   GET /api/organizations
 * @access  Public / Protected
 */
const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({ isActive: true }).sort('name');
    return res.status(200).json({ success: true, count: orgs.length, organizations: orgs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Create new organization (Admin)
 * @route   POST /api/organizations
 * @access  Private (Admin)
 */
const createOrganization = async (req, res) => {
  try {
    const { name, code, address, contactEmail, contactPhone, branches } = req.body;

    const existing = await Organization.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Organization code already exists' });
    }

    const org = await Organization.create({
      name,
      code: code.toUpperCase(),
      address: address || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      branches: branches || [
        { name: 'Main Campus', code: 'HQ-1', address: address || '', gates: ['Gate 1', 'Gate 2'] },
      ],
    });

    return res.status(201).json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Add branch to organization (Admin)
 * @route   POST /api/organizations/:id/branches
 * @access  Private (Admin)
 */
const addBranch = async (req, res) => {
  try {
    const { name, code, address, gates } = req.body;
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    org.branches.push({
      name,
      code: code.toUpperCase(),
      address: address || '',
      gates: gates || ['Main Entrance'],
    });

    await org.save();
    return res.status(200).json({ success: true, organization: org });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getOrganizations,
  createOrganization,
  addBranch,
};
