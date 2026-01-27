import express from "express";
const router = express.Router();
import organizationController from "../src/controllers/orgController"; // Route to create a new organization
router.post("/organizations", organizationController.createOrganization);

// Route to update response types within an organization
router.put("/organizations/response-types", organizationController.updateResponseTypes);
export default router;
