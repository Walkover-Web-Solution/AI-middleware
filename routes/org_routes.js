const express = require('express');
const router = express.Router();
const organizationController = require('../src/controllers/orgController');

// Route to create a new organization
router.post('/organizations', organizationController.createOrganization);

// Route to update response types within an organization
router.put('/organizations/response-types', organizationController.updateResponseTypes);

module.exports = router;
