import RagDataModel from '../mongoModel/RagData.model.js';

export default class RagDataService {
    static async createChunk(data) {
        try {
            // Clear the resource's chunks cache
            const chunk = new RagDataModel(data);
            await chunk.save();
            return chunk;
        } catch (error) {
            throw new Error(`Failed to create chunk: ${error.message}`);
        }
    }

    static async deleteChunk(id) {
        try {
            const deletedChunk = await RagDataModel.findByIdAndDelete(id);
            if (!deletedChunk) {
                throw new Error(`RagDataModel with ID ${id} not found.`);
            }
            return deletedChunk;
        } catch (error) {
            throw new Error(`Failed to delete chunk: ${error.message}`);
        }
    }

    static async updateChunk(id, updateData) {
        try {
            const updatedChunk = await RagDataModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!updatedChunk) {
                throw new Error(`RagDataModel with ID ${id} not found.`);
            }
            // Clear specific chunk cache and resource's chunks cache
            return updatedChunk;
        } catch (error) {
            throw new Error(`Failed to update chunk: ${error.message}`, 404);
        }
    }

    static async getChunkById(id) {
        try {
            const chunk = await RagDataModel.findById(id);
            if (!chunk) {
                throw new Error(`RagDataModel with ID ${id} not found.`);
            }
            return chunk;
        } catch (error) {
            throw new Error(`Failed to retrieve chunk: ${error.message}`, 404);
        }
    }

    static async getChunksByResource(resourceId) {
        try {
            const chunks = await RagDataModel.find({ doc_id: resourceId });
            return chunks;
        } catch (error) {
            throw new Error(`Failed to retrieve chunks for resource: ${error.message}`);
        }
    }

    static async deleteChunksByResource(resourceId) {
        try {
            // Delete chunks from database
            const result = await RagDataModel.deleteMany({ doc_id:resourceId });
            return result;
        } catch (error) {
            throw new Error(`Failed to delete chunks for resource: ${error.message}`, 500);
        }
    }
}
