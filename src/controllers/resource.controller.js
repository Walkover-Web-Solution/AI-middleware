import resourceService from '../services/resource.service.js';
import logger from '../logger.js';

/**
 * Add resource to a collection
 * POST /resource
 * Body: { collectionId, orgId, title, ownerId, description? }
 * File: multipart form data (file)
 */
export const addResource = async (req, res, next) => {
  try {
    const { collectionId, title, ownerId, description, url } = req.body;
    const orgId = req.profile.org.id; 
    // Call service to upload and create resource
    const result = await resourceService.addResource({
      file: req.file,
      body: {
        collectionId,
        orgId,
        title,
        ownerId,
        description,
        url
      }
    });

    logger.info(`Resource added successfully for collection: ${collectionId}`);

    res.locals = {
      success: true,
      message: 'Resource added successfully',
      data: {
        collectionId,
        orgId,
        title,
        ownerId,
        url: result.fileUrl,
        resource: result.resource
      }
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Add resource error:', error.message);
    res.locals = {
      success: false,
      message: error.message,
      error: error.message
    };
    req.statusCode = 500;
    return next();
  }
};

export const getResourcesByCollection = async (req, res, next) => {
  try {
    const { collectionId } = req.params;  
    const data = await resourceService.getResourcesByCollection(collectionId);
    res.locals = { success: true, data };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Get resources error:', error.message);
    res.locals = { success: false, message: error.message };
    req.statusCode = 500;
    return next();
  }
};

export const getResourceById = async (req, res, next) => {
  try {
    const { resourceId } = req.params;   
    const data = await resourceService.getResourceById(resourceId);
    res.locals = { success: true, data };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Get resource error:', error.message);
    res.locals = { success: false, message: error.message };
    req.statusCode = 500;
    return next();
  }
};

export const deleteResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const data = await resourceService.deleteResourceById(resourceId);
    res.locals = { success: true, data };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Delete resource error:', error.message);
    res.locals = { success: false, message: error.message };
    req.statusCode = 500;
    return next();
  }
};

export const updateResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const updateBody = req.body;
    const data = await resourceService.updateResourceById(resourceId, updateBody);
    res.locals = { success: true, data };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Update resource error:', error.message);
    res.locals = { success: false, message: error.message };
    req.statusCode = 500;
    return next();
  }
};
