import { MongoClient } from 'mongodb';
import axios from 'axios';
import tokenModule from '../services/commonService/generateToken.js';

/**
 * Controller for handling flow-related operations
 */
class FlowController {
  /**
   * Copy flows based on folder_id and user_id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async copyFlows(req, res) {
    try {
      console.log('Starting flow copy API process');
      
      // Get MongoDB connection string from environment variables
      const mongoUri = process.env.MONGODB_CONNECTION_URI;
      const apiBaseUrl = 'https://flow-api.viasocket.com/embed/duplicateflow';
      
      if (!mongoUri) {
        return res.status(500).json({ 
          success: false, 
          message: 'MongoDB connection URI is not configured' 
        });
      }
      
      // Connect to MongoDB
      const mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      console.log('Connected to MongoDB');
      
      const db = mongoClient.db();
      const apiCallsCollection = db.collection('apicalls');
      
      // Get query parameters or use defaults
      
      // Find API calls with folder_id and user_id
      const apiCalls = await apiCallsCollection.find({
        folder_id: { $exists: true, $ne: null },
        user_id: { $exists: true, $ne: null }
      })
      .toArray();
      
      console.log(`Found ${apiCalls.length} API calls with folder_id and user_id`);
      
      const results = {
        total: apiCalls.length,
        successful: 0,
        failed: 0,
        details: []
      };
      
      // Process each API call
      for (const apiCall of apiCalls) {
        try {
          const { folder_id, user_id, org_id, function_name } = apiCall;        
          // Create user ID for viasocket
          const viasocketUserId = org_id + "_" + folder_id + '_' + user_id;
          
          // Generate token for API authentication
          const viasocketToken = tokenModule.generateToken({ 
            payload: { 
              org_id: process.env.ORG_ID, 
              project_id: process.env.PROJECT_ID, 
              user_id: viasocketUserId
            }, 
            accessKey: process.env.Access_key
          });
          
          // Call the flow copy API
          const response = await axios.post(
            `${apiBaseUrl}/${function_name}`, {},
            {
              headers: {
                'Authorization': `${viasocketToken}`
              }
            }
          );
          
          // Update the API call record with the new function name
          if (response.data?.data && response.data.data.id) {
            const updatedApiCall = {
              ...apiCall,
              function_name: response.data.data.id,
              updated_at: new Date()
            };
            
            await apiCallsCollection.updateOne(
              { _id: apiCall._id }, 
              { $set: updatedApiCall }
            );
            
            results.successful++;
            results.details.push({
              id: apiCall._id,
              status: 'success',
              old_function_name: function_name,
              new_function_name: response.data.data.id
            });
            
            console.log(`Flow updated successfully apicalls id ${apiCall._id} ${folder_id} with the function name ${response.data.data.id}`);
          } else {
            results.failed++;
            results.details.push({
              id: apiCall._id,
              status: 'failed',
              reason: 'API response missing id'
            });
          }
        } catch (error) {
          console.error(`Error processing API call ${apiCall._id}:`, error.message);
          results.failed++;
          results.details.push({
            id: apiCall._id,
            status: 'failed',
            reason: error.message
          });
        }
      }
      
      // Close MongoDB connection
      await mongoClient.close();
      console.log('MongoDB connection closed');
      
      // Return results
      return res.status(200).json({
        success: true,
        message: 'Flow copy process completed',
        results
      });
    } catch (error) {
      console.error('Error during flow copy process:', error);
      return res.status(500).json({
        success: false,
        message: 'Error during flow copy process',
        error: error.message
      });
    }
  }
}

export default FlowController;
