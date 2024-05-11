import InterfaceModel from '../../mongoModel/interface.js';
import ActionModel from '../mongoModels/ActionModel.js';

// create interfaces db service
async function create(data) {
  const response = await InterfaceModel.create({
    ...data,
  });
  return response;
}

async function getAllInterfaceByProjectId(project_id) {
  const data = await InterfaceModel.find({
    projectId: project_id,
  }).select({ title: 1, _id: 1, orgId: 1, projectId: 1 });
  return data;
}

async function getInterfaceById(identifier, viewOnly) {
  const result = await InterfaceModel.findById({ _id: identifier })
    .populate(viewOnly ? [] : 'actions.actionIdMapping')
    .lean();

  return result;
}

async function updateInterfaceRenderingJson(
  interfaceId,
  componentJson,
  coordinatesJson,
  componentId,
  gridId,
) {
  const valuesToUpdate = {};
  if (componentJson && componentId) {
    valuesToUpdate[`components.${gridId}.${componentId}`] = componentJson;
  }
  if (coordinatesJson && componentId) {
    valuesToUpdate[`coordinates.${gridId}.${componentId}`] = coordinatesJson;
  }
  if (!componentId && coordinatesJson && componentJson) {
    valuesToUpdate[`components.${gridId}`] = componentJson;
    valuesToUpdate[`coordinates.${gridId}`] = coordinatesJson;
  }

  const updateInterface = await InterfaceModel.findByIdAndUpdate(
    interfaceId,
    { $set: valuesToUpdate },
    { new: true },
  );

  return updateInterface;
}

async function updateInterfaceActionRenderingJson(
  interfaceId,
  componentId,
  gridId,
  actionId,
  actionsArr,
  responseArr,
  frontendActionJson,
  frontendActionId,
  bridge,
) {
  let response = null;
  const valuesToUpdate = {};
  const valuesToPush = {};

  if (componentId && frontendActionJson) {
    valuesToUpdate[
      `frontendActions.${gridId}.${componentId}.${frontendActionId}`
    ] = frontendActionJson;
  }

  if (actionId) {
    const jsonToSend = {};
    if (actionsArr) jsonToSend.actionsArr = actionsArr;
    if (responseArr) jsonToSend.responseArr = responseArr;
    if (bridge) jsonToSend.bridge = bridge;

    response = await ActionModel.findByIdAndUpdate(
      actionId,
      { $set: jsonToSend },
      { new: true },
    );
  } else if (responseArr || actionsArr) {
    const actionData = { interfaceId, componentId, gridId };

    if (responseArr) actionData.responseArr = responseArr;
    if (actionsArr) actionData.actionsArr = actionsArr;

    response = await ActionModel.create(actionData);

    valuesToPush.actions = {
      actionId: response._id,
      actionIdMapping: response._id,
      componentId,
      gridId,
    };
  }

  const updateInterface = await InterfaceModel.findByIdAndUpdate(
    interfaceId,
    { $set: valuesToUpdate, $push: valuesToPush },
    { new: true },
  );

  return response || updateInterface;
}

async function updateInterfaceDetailsInDb(interfaceId, data) {
  return await InterfaceModel.findByIdAndUpdate(
    {
      _id: interfaceId,
    },
    {
      $set: data,
    },
    {
      new: true,
    },
  );
}

// delete interfaces db service
async function deleteById(identifier) {
  return await InterfaceModel.deleteOne({
    _id: identifier,
  });
}

// delete interfaces db service
async function delByProjectId(project_id) {
  return await InterfaceModel.deleteMany({
    projectId: project_id,
  });
}

async function deleteComponent(interfaceId, componentId, gridId) {
  const componentsToDelete = {};
  const actionsToDelete = {};
  const frontendActionsToDelete = {};
  componentsToDelete[`components.${componentId}`] = 1;
  componentsToDelete[`coordinates.${componentId}`] = 1;

  componentsToDelete[`components.${gridId}.${componentId}`] = 1;
  componentsToDelete[`coordinates.${gridId}.${componentId}`] = 1;

  actionsToDelete.actions = { gridId: componentId };
  actionsToDelete.actions = { componentId };

  frontendActionsToDelete[`frontendActions.${componentId}`] = 1;
  frontendActionsToDelete[`frontendActions.${gridId}.${componentId}`] = 1;

  await ActionModel.deleteMany({
    $or: [
      { gridId: componentId },
      { componentId },
    ],
  });

  return await InterfaceModel.findByIdAndUpdate({
    _id: interfaceId,
  }, {
    $unset: { ...componentsToDelete, ...frontendActionsToDelete },
    $pull: actionsToDelete,
  }, {
    new: true,
  });
}

async function deleteAction(gridId, interfaceId, componentId, frontendActionId) {
  // const actionsToDelete = {};
  // const actionsToDelete = {};
  const frontendActionsToDelete = {};
  if (frontendActionId) {
    frontendActionsToDelete[`frontendActions.${gridId}.${componentId}.${frontendActionId}`] = 1;
  }
  return await InterfaceModel.findByIdAndUpdate({
    _id: interfaceId,
  }, {
    $unset: frontendActionsToDelete,
  }, {
    new: true,
  });
}

async function getActionsofComponent(actionId) {
  const data = await ActionModel.findOne(
    {
      _id: actionId,
    },
  );

  return data;
}

async function getInterfaceConfig(interfaceId) {
  return await InterfaceModel.findById({ _id: interfaceId }).select('config');
}

export default {
  create,
  getAllInterfaceByProjectId,
  getInterfaceById,
  updateInterfaceRenderingJson,
  updateInterfaceActionRenderingJson,
  deleteById,
  delByProjectId,
  deleteComponent,
  getActionsofComponent,
  deleteAction,
  getInterfaceConfig,
  updateInterfaceDetailsInDb,
};
