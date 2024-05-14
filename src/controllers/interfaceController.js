import interfaceDbService from '../db_services/InterfaceDbService.js';
import {
  createInterfaceSchema, deleteActionsInterfaceSchema, deleteComponentInterfaceSchema, getAllInterfaceSchema, getOneActionInterfaceSchema, getOneInterfaceSchema, updateInterfaceDetailsSchema, updateInterfaceSchema,
} from '../../validation/joi_validation/interfaces.js';
import { BadRequestError } from '../errors/index.js';
import { StatusCodes } from 'http-status-codes';
import axios from '../middleware/axios.js';
import { getToken } from '../services/utils/usersServices.js';
import { generateIdentifier } from '../services/utils/utilityService.js';

const createInterface = async (req, res, next) => {
  const { org_id, project_id, title } = req.body;
  const dataToSend = {
    orgId: org_id,
    projectId: project_id,
    title,
    createdBy: req?.profile?.userId,
    updatedBy: req?.profile?.userId,
    coordinates: {},
    components: {},
    accessType: 'Public',
  };
  try {
    await createInterfaceSchema.validateAsync({ org_id, project_id, title, created_by: dataToSend.createdBy, updated_by: dataToSend.updatedBy });
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.create(dataToSend);
    res.locals.responseData = { statusCode: StatusCodes.CREATED, data, message: 'Successfully created Interface' };
    next();
  } catch (err) {
    console.error(err);
    throw new BadRequestError('interface creation failed!', { err });
    // res.status(400).json(prepareErrorResponse({ message: 'Some Error on Server', data: { err } }));
  }
};
const getInterfaceById = async (req, res, next) => {
  const identifier = req.params?.interfaceId;
  const { viewOnly } = req.profile;

  try {
    await getOneInterfaceSchema.validateAsync({ identifier });
  } catch (err) {
    throw new BadRequestError('Invalid InterfaceId', err?.details);
  }
  try {
    const data = await interfaceDbService.getInterfaceById(identifier, viewOnly);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: `Successfully Find Flow with Id: ${identifier}` };
    next();
    // res.status(200).json(prepareSuccessResponse({ data, message: 'Successfully Find Script' }));
  } catch (err) {
    console.error(err);
    throw new BadRequestError('can\'t get requested interface', { err });
    // res.status(400).json(prepareErrorResponse({ message: 'Some Error on Server', data: { err } }));
  }
};
const getAllInterfacesByProjectId = async (req, res, next) => {
  const project_id = req.params?.projectId;
  try {
    await getAllInterfaceSchema.validateAsync({ project_id });
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.getAllInterfaceByProjectId(project_id);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully Find all Interfaces' };
    next();
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('Can\'t get all requested interfaces', { err });
  }
};
const updateInterfaces = async (req, res, next) => {
  const identifier = req.params?.interfaceId;
  const { components, coordinates, componentId, gridId } = req.body;
  try {
    await updateInterfaceSchema.validateAsync({ gridId, identifier, componentId });
  } catch (err) {
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.updateInterfaceRenderingJson(identifier, components, coordinates, componentId, gridId);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully update  Interfaces' };
    next();
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('Can\'t get all requested interfaces', { err });
  }
};
const updateInterfacesAction = async (req, res, next) => {
  const identifier = req.params?.interfaceId;
  const { componentId, gridId, actionId, actionsArr, responseArr, frontendActions, frontendActionId, bridge } = req.body;
  try {
    await updateInterfaceSchema.validateAsync({ gridId, identifier, componentId });
  } catch (err) {
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.updateInterfaceActionRenderingJson(identifier, componentId, gridId, actionId, actionsArr, responseArr, frontendActions, frontendActionId, bridge);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully update Interface Action' };
    next();
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('Can\'t update Interface action', { err });
  }
};
const updateInterfaceDetails = async (req, res, next) => {
  const identifier = req.params?.interfaceId;
  const dataToSend = { ...req.body };

  try {
    await updateInterfaceDetailsSchema.validateAsync({ identifier, ...dataToSend });
  } catch (err) {
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.updateInterfaceDetailsInDb(identifier, dataToSend);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully update  Interfaces' };
    next();
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('Can\'t get all requested interfaces', { err });
  }
};
const deleteByInterfaceId = async (req, res, next) => {
  const identifier = req.params?.interfaceId;
  try {
    await getOneInterfaceSchema.validateAsync({ identifier });
  } catch (err) {
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.deleteById(identifier);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully deleted' };
    next();
  } catch (err) {
    console.error('error', err);
    throw new BadRequestError('Can\'t delete requested interfaces', { err });
  }
};
const deleteComponent = async (req, res, next) => {
  const interfaceId = req?.params?.interfaceId;
  const gridId = req?.params?.gridId;
  const { componentId } = req?.body;
  try {
    await deleteComponentInterfaceSchema.validateAsync({ interfaceId, gridId });
  } catch (err) {
    throw new BadRequestError('All attributes are mandatory', err?.details);
  }
  try {
    const data = await interfaceDbService.deleteComponent(interfaceId, componentId, gridId);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully deleted' };
    next();
  } catch (error) {
    throw new BadRequestError('Invalid InterfaceId', error?.details);
  }
};
const sendDataToAction = async (req, res, next) => {
  try {
    const { message, threadId: initialThreadId, bridgeName: initialBridgeName = 'root' } = req.body;
    const { actionId } = req.params;
    const { userId } = req.profile;
    const bridgeName = initialBridgeName.trim() || 'root';
    let threadId = initialThreadId;

    try {
      await getOneActionInterfaceSchema.validateAsync({ actionId });
    } catch (err) {
      throw new BadRequestError('Invalid InterfaceId', err?.details);
    }

    let actionData;
    try {
      actionData = await interfaceDbService.getActionsofComponent(actionId);
    } catch (error) {
      console.error('Failed to fetch action data:', error);
      throw new BadRequestError('Failed to fetch action data', error);
    }
    const { responseArr, actionsArr, bridge, interfaceId } = actionData;
    if (threadId?.trim()) { threadId = interfaceId + threadId; } else { threadId = interfaceId + userId; }

    const { bridgeId, authKey } = {
      bridgeId: bridge.bridgeMapping.get(bridgeName)?.bridgeId || bridge.bridgeMapping.get('root')?.bridgeId,
      authKey: bridge.authKey,
    };

    let responseTypes = '';
    if (responseArr) {
      responseArr?.forEach((response, i) => {
        responseTypes += ` ${i + 1}. responseId = ${response.responseId}, description=${response.description}, json for response=${JSON.stringify(response.components)}, `;
      });
    }

    actionsArr?.forEach(async (action) => {
      if (action.type === 'chatbot') {
        const apiDataToSend = {
          bridge_id: bridgeId,
          service: 'openai',
          user: message,
          thread_id: threadId,
          variables: { ...req.body.interfaceContextData, responseTypes, message },
          rtlOptions: {
            channel: threadId,
            ttl: 1,
          },
        };
        const apiURL = `${process.env.AI_MIDDLEWARE_INITIAL_URL}/api/v1/model/chat/completion`;
        try {
          axios.post(apiURL, apiDataToSend, { headers: { pauthkey: authKey } });
        } catch (error) {
          console.error('API request failed:', error);
          throw error; // Rethrowing the error to be caught by Promise.all
        }
      }
      if (action?.scriptId) {
        const url = `${process.env.VM2_SERVER_URL}/func/${action?.scriptId}`;
        const { payload } = req.body;
        axios.post(url, payload).catch((e) => {
          console.log(e);
        });
      }
    });
    res.locals.responseData = { statusCode: StatusCodes.OK, data: { success: true }, message: 'Successfully send data ' };
    next();
  } catch (error) {
    console.log(error, 'err');
    throw new BadRequestError('some error on server', error);
  }
};

const loginInterfaceUser = async (req, res, next) => {
  try {
    let { user_id } = req.Interface;
    const { interface_id, project_id } = req.Interface;
    let interfaceConfig = {};
    if (req.body?.isAnonymousUser) {
      user_id = generateIdentifier(15);
    }
    if (interface_id) interfaceConfig = await interfaceDbService.getInterfaceConfig(interface_id);
    const dataToSend = {
      config: interfaceConfig.config,
      userId: user_id,
      token: `Bearer ${getToken({ userId: user_id })}`,
      interface_id,
      project_id,
    };
    res.locals.responseData = { statusCode: StatusCodes.OK, data: dataToSend, message: 'Successfully login ' };
    next();
  } catch (error) {
    throw new BadRequestError('Invalid InterfaceId', error?.message);
  }
};
const deleteActions = async (req, res, next) => {
  try {
    const { componentId, interfaceId } = req?.params;
    try {
      await deleteActionsInterfaceSchema.validateAsync({ componentId, interfaceId });
    } catch (err) {
      console.error('error', err);
      throw new BadRequestError('Invalid InterfaceId', err?.details);
    }
    const { frontendActionId, gridId } = req?.body;
    const data = await interfaceDbService.deleteAction(gridId, interfaceId, componentId, frontendActionId);
    res.locals.responseData = { statusCode: StatusCodes.OK, data, message: 'Successfully deleted' };
    next();
  } catch (error) {
    throw new BadRequestError('Unable to delete action', error?.message);
  }
};
const loadThirdPartyData = async (req, res, next) => {
  try {
    const { interfaceId } = req.params;
    const { bridgeName, actionId } = req.query;
    const { userId } = req.profile;
    const threadId = req.query.threadId?.trim() ? interfaceId + req.query.threadId : interfaceId + userId;
    try {
      await getOneInterfaceSchema.validateAsync({ identifier: interfaceId });
    } catch (err) {
      console.error('error', err);
      throw new BadRequestError('Invalid InterfaceId', err?.details);
    }

    const actionData = await interfaceDbService.getActionsofComponent(actionId);
    const { bridge } = actionData;

    const { bridgeId, authKey } = {
      bridgeId: bridge.bridgeMapping.get(bridgeName)?.bridgeId,
      authKey: bridge.authKey,
    };
    if (!bridgeId || !authKey) {
      throw new BadRequestError('Invalid BridgeId or AuthKey');
    }

    const apiUrl = `${process.env.AI_MIDDLEWARE_INITIAL_URL}/api/v1/config/gethistory/${threadId}/${bridgeId}`;
    const chats = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        pauthkey: authKey,
      },
    });

    res.locals.responseData = { statusCode: StatusCodes.OK, data: { chats: chats.data, defaultQuestions: actionData?.bridge.bridgeMapping.get(bridgeName)?.defaultQuestions }, message: 'Successfully get Data' };
    next();
  } catch (error) {
    throw new BadRequestError('Invalid InterfaceId', error?.message);
  }
};

export {
  createInterface,
  getInterfaceById,
  getAllInterfacesByProjectId,
  updateInterfaces,
  updateInterfacesAction,
  deleteByInterfaceId,
  deleteComponent,
  sendDataToAction,
  loginInterfaceUser,
  deleteActions,
  loadThirdPartyData,
  updateInterfaceDetails,
};
