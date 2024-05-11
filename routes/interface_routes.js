import express from 'express';
import {
  createInterface,
  deleteActions,
  deleteByInterfaceId,
  deleteComponent,
  getAllInterfacesByProjectId,
  updateInterfaceDetails,
  updateInterfaces,
  updateInterfacesAction,
} from '../src/controllers/interfaceController.js';
import { decodeToken } from '../middleware/auth.js';
import userOrgAccessCheck from '../middleware/userOrgAccessMiddleware.js';

const routes = express.Router();

routes.route('/:projectId/interfaces').post(decodeToken, userOrgAccessCheck, createInterface);
routes.route('/:projectId/interfaces/getAllInterfaces').get(decodeToken, userOrgAccessCheck, getAllInterfacesByProjectId);
routes.route('/:projectId/interfaces/:interfaceId/update').put(decodeToken, userOrgAccessCheck, updateInterfaces);
routes.route('/:projectId/interfaces/:interfaceId/updateAction').put(decodeToken, userOrgAccessCheck, updateInterfacesAction);
routes.route('/:projectId/interfaces/:interfaceId/updateInterfaceDetails').put(decodeToken, userOrgAccessCheck, updateInterfaceDetails);
routes.route('/:projectId/interfaces/:interfaceId').delete(decodeToken, userOrgAccessCheck, deleteByInterfaceId);
routes.route('/:projectId/interfaces/:interfaceId/grid/:gridId').delete(decodeToken, userOrgAccessCheck, deleteComponent);
routes.route('/:projectId/interfaces/:interfaceId/component/:componentId/action').put(decodeToken, userOrgAccessCheck, deleteActions);

export default routes;
