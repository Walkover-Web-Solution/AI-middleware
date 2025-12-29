import axios from 'axios';
import FormData from 'form-data';
import logger from '../logger.js';

const GTWY_UPLOAD_API = process.env.GTWY_UPLOAD_API || 'https://api.gtwy.ai/files/upload';
const GTWY_AUTH_TOKEN = process.env.GTWY_AUTH_TOKEN;
const HIPPOCAMPUS_BASE_URL = process.env.HIPPOCAMPUS_BASE_URL || 'http://hippocampus.gtwy.ai';
const HIPPOCAMPUS_API_KEY = process.env.HIPPOCAMPUS_API_KEY;

/**
 * Upload file to GTWY file processing API
 * Returns file URL
 */
const uploadFileToGtwy = async (file) => {
  try {
    
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    logger.info(`Uploading file to GTWY: ${file.originalname}`);

    const uploadResponse = await axios.post(GTWY_UPLOAD_API, formData, {
      headers: {
        ...formData.getHeaders(),
        accept: 'application/json, text/plain, */*',
        pauthkey: GTWY_AUTH_TOKEN,
      },
      timeout: 30000,
    });

    const fileUrl = uploadResponse.data?.file_url;

    if (!fileUrl) {
      throw new Error('Failed to retrieve file URL from GTWY');
    }

    logger.info(`File uploaded to GTWY successfully: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    // Log more details to help diagnose 401/403 from GTWY
    logger.error('GTWY upload error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    const statusMsg = error.response?.status ? ` (status ${error.response.status})` : '';
    throw new Error(`Failed to upload file to GTWY: ${error.message}${statusMsg}`);
  }
};

/**
 * Create resource in Hippocampus
 * Returns resource metadata from Hippocampus
 */
const createResourceInHippocampus = async (resourcePayload) => {
  try {
    logger.info(`Creating resource in Hippocampus: ${resourcePayload.title}`);

    const hippocampusResponse = await axios.post(
      `${HIPPOCAMPUS_BASE_URL}/resource`,
      resourcePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': HIPPOCAMPUS_API_KEY,
        },
        timeout: 30000,
      }
    );

    if (!hippocampusResponse.data) {
      throw new Error('No response data from Hippocampus');
    }

    logger.info(`Resource created in Hippocampus: ${hippocampusResponse.data._id || hippocampusResponse.data.id}`);
    return hippocampusResponse.data;
  } catch (error) {
    logger.error('Hippocampus API error:', error.message);
    throw new Error(`Failed to create resource in Hippocampus: ${error.message}`);
  }
};

/**
 * Add resource: upload file + create in Hippocampus
 */
const addResource = async ({ file, body }) => {
  try {
    
    const { collectionId, orgId, title, ownerId } = body;

    // Step 1: Use provided URL if present, otherwise upload file to GTWY
    const fileUrl = body.url ? body.url : await uploadFileToGtwy(file);

    // Step 2: Create resource in Hippocampus
    const resourcePayload = {
      collectionId,
      title,
      url: fileUrl,
      ownerId,
      ...(body.description && { description: body.description }),
    };

    const hippocampusResponse = await createResourceInHippocampus(resourcePayload);

    // Return combined response
    return {
      fileUrl,
      resource: hippocampusResponse,
      success: true,
    };
  } catch (error) {
    logger.error('Add resource error:', error.message);
    throw error;
  }
};

/**
 * Get resources for a collection from Hippocampus
 */
const getResourcesByCollection = async (collectionId) => {
  try {
    const url = `${HIPPOCAMPUS_BASE_URL}/collection/${collectionId}/resources`;
    const resp = await axios.get(url, {
      headers: { 'x-api-key': HIPPOCAMPUS_API_KEY },
      timeout: 30000,
    });
    return resp.data;
  } catch (error) {
    logger.error('Error fetching resources for collection:', error.message);
    throw new Error(`Failed to fetch resources: ${error.message}`);
  }
};

/**n * Get a single resource by id from Hippocampus
 */
const getResourceById = async (resourceId) => {
  try {
    const url = `${HIPPOCAMPUS_BASE_URL}/resource/${resourceId}`;
    const resp = await axios.get(url, {
      headers: { 'x-api-key': HIPPOCAMPUS_API_KEY },
      timeout: 30000,
    });
    return resp.data;
  } catch (error) {
    logger.error('Error fetching resource by id:', error.message);
    throw new Error(`Failed to fetch resource: ${error.message}`);
  }
};

/**
 * Delete a resource in Hippocampus
 */
const deleteResourceById = async (resourceId) => {
  try {
    const url = `${HIPPOCAMPUS_BASE_URL}/resource/${resourceId}`;
    const resp = await axios.delete(url, {
      headers: { 'x-api-key': HIPPOCAMPUS_API_KEY },
      timeout: 30000,
    });
    return resp.data;
  } catch (error) {
    logger.error('Error deleting resource:', error.message);
    throw new Error(`Failed to delete resource: ${error.message}`);
  }
};

/**
 * Update a resource in Hippocampus
 */
const updateResourceById = async (resourceId, updateBody) => {
  try {
    const url = `${HIPPOCAMPUS_BASE_URL}/resource/${resourceId}`;
    const resp = await axios.put(url, updateBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HIPPOCAMPUS_API_KEY,
      },
      timeout: 30000,
    });
    return resp.data;
  } catch (error) {
    logger.error('Error updating resource:', error.message);
    throw new Error(`Failed to update resource: ${error.message}`);
  }
};

export default {
  uploadFileToGtwy,
  createResourceInHippocampus,
  addResource,
  getResourcesByCollection,
  getResourceById,
  deleteResourceById,
  updateResourceById,
};
