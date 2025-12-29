import axios from 'axios';
import collectionService from '../db_services/collection.service.js';
import logger from '../logger.js';

const HIPPOCAMPUS_BASE_URL = process.env.HIPPOCAMPUS_BASE_URL || 'http://hippocampus.gtwy.ai';
const HIPPOCAMPUS_API_KEY = process.env.HIPPOCAMPUS_API_KEY;

/**
 * Create a new collection
 * POST /collection
 * Body: {
 *   name: string,
 *   settings: {
 *     denseModel: string,
 *     sparseModel: string,
 *     rerankerModel: string,
 *     chunkSize: number,
 *     chunkOverlap: number
 *   }
 * }
 */
export const createCollection = async (req, res, next) => {
  try {
    const { name, settings } = req.body;

    const org_id = req.profile.org.id;
   

    // Prepare settings with defaults
    const collectionSettings = {
      denseModel: settings?.denseModel || 'BAAI/bge-large-en-v1.5',
      sparseModel: settings?.sparseModel || 'Qdrant/bm25',
      rerankerModel: settings?.rerankerModel || 'colbert-ir/colbertv2.0',
      chunkSize: settings?.chunkSize || 1000,
      chunkOverlap: settings?.chunkOverlap || 100
    };

    // Call Hippocampus API to create collection
    logger.info(`Creating collection in Hippocampus for org: ${org_id}, name: ${name}`);

    let hippocampusResponse;
    try {
      hippocampusResponse = await axios.post(
        `${HIPPOCAMPUS_BASE_URL}/collection`,
        {
          name: name,
          settings: collectionSettings,
        
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': HIPPOCAMPUS_API_KEY
          },
          timeout: 30000
        }
      );
    } catch (hippocampusError) {
      logger.error('Hippocampus API error:', hippocampusError.message);
      res.locals = {
        success: false,
        message: 'Failed to create collection in external service',
        error: hippocampusError.response?.data?.message || hippocampusError.message
      };
      req.statusCode = 500;
      return next();
    }

    // Get collection_id from Hippocampus response (_id field)
    const collection_id = hippocampusResponse.data?._id || hippocampusResponse.data?.collection_id;

    // Use settings from Hippocampus response if available
    const finalSettings = hippocampusResponse.data?.settings || collectionSettings;

    // Save collection metadata to MongoDB
    const mongoDbResult = await collectionService.createCollection({
      org_id,
      collection_id,
      name,
      settings: finalSettings
    });

    if (!mongoDbResult.success) {
      logger.error('MongoDB save error:', mongoDbResult.error);
      res.locals = {
        success: false,
        message: 'Failed to save collection metadata',
        error: mongoDbResult.error
      };
      req.statusCode = 500;
      return next();
    }

    logger.info(`Collection created successfully - org: ${org_id}, collection_id: ${collection_id}`);

    res.locals = {
      success: true,
      message: 'Collection created successfully',
      data: {
        org_id: mongoDbResult.data.org_id,
        collection_id: mongoDbResult.data.collection_id,
        name: mongoDbResult.data.name,
        settings: mongoDbResult.data.settings,
        created_at: mongoDbResult.data.created_at,
        hippocampus_response: {
          _id: hippocampusResponse.data._id,
          createdAt: hippocampusResponse.data.createdAt,
          updatedAt: hippocampusResponse.data.updatedAt
        }
      }
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Create collection error:', error);
    res.locals = {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
    req.statusCode = 500;
    return next();
  }
};

/**
 * Get all collections for an organization
 * GET /collection?org_id=...
 */
export const getAllCollections = async (req, res, next) => {
  try {
    const org_id = req.profile.org.id;

    const result = await collectionService.getCollectionsByOrgId(org_id);

    if (!result.success) {
      res.locals = {
        success: false,
        message: 'Failed to fetch collections',
        error: result.error
      };
      req.statusCode = 500;
      return next();
    }

    res.locals = {
      success: true,
      message: 'Collections fetched successfully',
      data: result.data,
      total: result.data.length
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Get collections error:', error);
    res.locals = {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
    req.statusCode = 500;
    return next();
  }
};

/**
 * Get a specific collection by ID
 * GET /collection/:collection_id
 */
export const getCollectionById = async (req, res, next) => {
  try {
    const { collection_id } = req.params;
    const org_id = req.profile.org.id;

    const result = await collectionService.getCollectionById(collection_id);

    if (!result.success) {
      res.locals = {
        success: false,
        message: result.error
      };
      req.statusCode = 404;
      return next();
    }

    
    res.locals = {
      success: true,
      message: 'Collection fetched successfully',
      data: result.data
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Get collection by ID error:', error);
    res.locals = {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
    req.statusCode = 500;
    return next();
  }
};

/**
 * Update a collection
 * PATCH /collection/:collection_id
 */
export const updateCollection = async (req, res, next) => {
  try {
    const { collection_id } = req.params;
    const org_id = req.profile.org.id;
    const updateData = req.body;

    // Verify collection exists and belongs to org
    const existingCollection = await collectionService.getCollectionById(collection_id);

    if (!existingCollection.success) {
      res.locals = {
        success: false,
        message: 'Collection not found'
      };
      req.statusCode = 404;
      return next();
    }


    const result = await collectionService.updateCollection(collection_id, updateData);

    if (!result.success) {
      res.locals = {
        success: false,
        message: result.error
      };
      req.statusCode = 500;
      return next();
    }

    logger.info(`Collection updated - collection_id: ${collection_id}`);

    res.locals = {
      success: true,
      message: 'Collection updated successfully',
      data: result.data
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    logger.error('Update collection error:', error);
    res.locals = {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
    req.statusCode = 500;
    return next();
  }
};
