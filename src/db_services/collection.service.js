import collectionModel from '../mongoModel/Collection.model.js';

const createCollection = async (collectionData) => {
  try {
    const {
      org_id,
      collection_id,
      name,
      settings,
    } = collectionData;

    // Check if collection already exists for this org
    const existingCollection = await collectionModel.findOne({
      org_id,
      name
    });

    if (existingCollection) {
      return {
        success: false,
        error: `Collection with name "${name}" already exists for this organization`
      };
    }

    const newCollection = new collectionModel({
      org_id,
      collection_id,
      name,
      settings,  
    });

    const result = await newCollection.save();

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getCollectionsByOrgId = async (org_id) => {
  try {
    const collections = await collectionModel.find({
      org_id
    }).sort({ created_at: -1 });

    return {
      success: true,
      data: collections
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getCollectionById = async (collection_id) => {
  try {
    const collection = await collectionModel.findOne({
      collection_id
    });

    if (!collection) {
      return {
        success: false,
        error: 'Collection not found'
      };
    }

    return {
      success: true,
      data: collection
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const updateCollection = async (collection_id, updateData) => {
  try {
    const collection = await collectionModel.findOneAndUpdate(
      { collection_id },
      {
        ...updateData,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!collection) {
      return {
        success: false,
        error: 'Collection not found'
      };
    }

    return {
      success: true,
      data: collection
    };
  } catch (error) {
    console.error('Error updating collection:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createCollection,
  getCollectionsByOrgId,
  getCollectionById,
  updateCollection,
};
