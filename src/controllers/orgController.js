const Organization = require('../../mongoModel/orgModel');

// Create a new Organization
exports.createOrganization = async (req, res) => {
    try {
        const { title, description } = req.body;
        const newOrg = new Organization({
            title,
            description,
            meta: {
                responseTypes: new Map()  // Initially empty
            }
        });
        const savedOrg = await newOrg.save();
        res.status(201).json(savedOrg);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create organization', error: error.message });
    }
};

// Update Response Types in an Organization
exports.updateResponseTypes = async (req, res) => {
    const { orgId, gridId, responseType } = req.body;
    try {
        const updateData = {
            [`meta.responseTypes.${gridId}`]: responseType
        };
        const updatedOrg = await Organization.findByIdAndUpdate(
            orgId,
            { $set: updateData },
            { new: true }
        );
        if (!updatedOrg) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.json(updatedOrg);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update response types', error: error.message });
    }
};
