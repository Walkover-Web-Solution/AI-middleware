import Configuration from '../mongoModel/configuration.js';
import IgnoreUserModel from '../mongoModel/ignoreUserModel.js';
import { getUserDetails } from '../services/proxyService.js';

// Constants for configuration
const BATCH_SIZE = 10; // Process user details in batches
const REQUEST_TIMEOUT = 5000; // 5 second timeout
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function bridgeAnalysisController(){
    try {
        console.log('Starting bridge analysis...');
        
        // Fetch existing ignore users from collection
        const existingIgnoreUsers = await IgnoreUserModel.find({}, { user_id: 1 });
        let ignoreusers = new Set(existingIgnoreUsers.map(user => user.user_id)); // Use Set to track ignored user_ids
        
        // Fetch all bridges with required fields only for better performance
        const allbridges = await Configuration.find({}, {
            user_id: 1,
            org_id: 1,
            slugName: 1,
            published_version_id: 1,
            total_tokens: 1
        });
        
        let notactiveuser = [];
        let newIgnoreUsers = []; // Track new users to add to ignore collection
        let userOrgBridgeMap = new Map(); // Track all bridges per user-org combination
        let skippedBridgesCount = 0; // Track bridges without user_id
        let validationErrors = 0;
        
        // Phase 1: Group all bridges by user-org combination (skip already ignored users)
        allbridges.forEach((bridge) => {
            const bridgeData = bridge.toJSON();
            
            // Input validation
            if (!bridgeData.user_id || typeof bridgeData.user_id === 'undefined') {
                skippedBridgesCount++;
                return;
            }
            
            if (!bridgeData.org_id || typeof bridgeData.org_id === 'undefined') {
                validationErrors++;
                return;
            }
            
            // Skip if this user is already in ignore list
            if (ignoreusers.has(bridgeData.user_id)) {
                return;
            }
            
            // Create unique key for user-org combination
            const userOrgKey = `${bridgeData.user_id}`;
            
            if (!userOrgBridgeMap.has(userOrgKey)) {
                userOrgBridgeMap.set(userOrgKey, {
                    user_id: bridgeData.user_id,
                    bridges: [],
                    hasActiveBridge: false
                });
            }
            
            const userData = userOrgBridgeMap.get(userOrgKey);
            
            // FIXED: Correct active bridge detection logic
            const isActiveBridge = 
                                 bridgeData.published_version_id !== undefined ||
                                 bridgeData.total_tokens == undefined ||
                                 bridgeData.published_version_id !== null && 
                                 bridgeData.total_tokens && 
                                 bridgeData.total_tokens > 0;
            
            userData.bridges.push({
                bridge_id: bridgeData._id,
                slugName: bridgeData.slugName,
                published_version_id: bridgeData.published_version_id,
                total_tokens: bridgeData.total_tokens,
                isActive: isActiveBridge
            });
            
            // If this bridge is active, mark user as having active bridge
            if (isActiveBridge) {
                userData.hasActiveBridge = true;
            }
        });
        
        // Phase 2: First pass - identify users with any active bridges
        let usersWithActiveBridges = new Set();
        userOrgBridgeMap.forEach((userData, userOrgKey) => {
            if (userData.hasActiveBridge) {
                usersWithActiveBridges.add(userData.user_id);
            }
        });
        
        // Phase 3: Second pass - categorize based on user-level activity
        userOrgBridgeMap.forEach((userData, userOrgKey) => {
            if (usersWithActiveBridges.has(userData.user_id)) {
                // User has active bridge in ANY org - add to ignore list (only once per user)
                if (!ignoreusers.has(userData.user_id)) {
                    ignoreusers.add(userData.user_id);
                    newIgnoreUsers.push({
                        user_id: userData.user_id,
                        org_id: userData.org_id, // Use first org encountered
                        reason: "Has active bridges in at least one organization"
                    });
                }
            } else {
                // User has NO active bridges in ANY org - add all their org combinations to not active list
                notactiveuser.push({
                    "user_id": userData.user_id,
                    "inactive_bridges_count": userData.bridges.length,
                });
            }
        });
        
        // Save new ignore users to database using upsert to avoid duplicates
        if (newIgnoreUsers.length > 0) {
            try {
                const bulkOps = newIgnoreUsers.map(user => ({
                    updateOne: {
                        filter: { user_id: user.user_id },
                        update: { $set: user },
                        upsert: true
                    }
                }));
                
                const result = await IgnoreUserModel.bulkWrite(bulkOps);
                console.log(`Processed ${newIgnoreUsers.length} ignore users: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
            } catch (error) {
                console.log("Error saving ignore users:", error);
            }
        }
        
        const totalUniqueUserOrgs = userOrgBridgeMap.size;
        const totalUniqueUsers = new Set([...userOrgBridgeMap.values()].map(u => u.user_id)).size;
        
        console.log("=== BRIDGE ANALYSIS SUMMARY ===");
        console.log("Total bridges processed:", allbridges.length);
        console.log("Bridges skipped (no user_id):", skippedBridgesCount);
        console.log("Bridges skipped (validation errors):", validationErrors);
        console.log("Total unique user-org combinations:", totalUniqueUserOrgs);
        console.log("Total unique users:", totalUniqueUsers);
        console.log("Users with active bridges (ignored):", ignoreusers.size);
        console.log("Inactive user-org records to process:", notactiveuser.length);
        console.log("================================");
        
        await sentuserDetails(notactiveuser);
    } catch (error) {
        console.log("Error in bridgeAnalysisController:", error);
        throw error;
    }
}

// Helper function to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get user details with retry logic using proxy service
const getUserDetailsWithRetry = async (user, retryCount = 0) => {
    try {
        const userDetails = await getUserDetails(user.user_id);
        
        if (userDetails) {
            return {
                user_id: user.user_id,
                org_id: user.org_id,
                inactive_bridges_count: user.inactive_bridges_count,
                ...userDetails
            };
        }
        return null;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying user ${user.user_id}, attempt ${retryCount + 1}/${MAX_RETRIES}`);
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return getUserDetailsWithRetry(user, retryCount + 1);
        }
        console.log(`Failed to get details for user ${user.user_id}:`, error.message);
        return null;
    }
};

const sentuserDetails = async (notactiveuser) => {
    try {
        if (!notactiveuser || notactiveuser.length === 0) {
            console.log('No inactive users to process');
            return;
        }
        
        console.log(`Processing ${notactiveuser.length} users in batches of ${BATCH_SIZE}`);
        let alluserdetails = [];
        let processedCount = 0;
        let errorCount = 0;
        
        // Process users in batches to avoid overwhelming the API
        for (let i = 0; i < notactiveuser.length; i += BATCH_SIZE) {
            const batch = notactiveuser.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(notactiveuser.length/BATCH_SIZE)}`);
            
            // Process batch with Promise.allSettled to handle individual failures
            const batchPromises = batch.map(user => getUserDetailsWithRetry(user));
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Collect successful results
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    alluserdetails.push(result.value);
                    processedCount++;
                } else {
                    errorCount++;
                }
            });
            
            // Add delay between batches to be respectful to the API
            if (i + BATCH_SIZE < notactiveuser.length) {
                await delay(500); // 500ms delay between batches
            }
        }
        
        console.log(`User details processing complete: ${processedCount} successful, ${errorCount} failed`);
        
        // Send data to webhook if we have results
        if (alluserdetails.length > 0) {
            const webhookUrl = process.env.WEBHOOK_URL || "https://flow.sokt.io/func/scriuEklU2Bu";
            
            try {
                const response = await fetch(webhookUrl, {    
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(alluserdetails),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                
                if (!response.ok) {
                    throw new Error(`Webhook failed with status: ${response.status}`);
                }
                
                console.log(`Successfully sent ${alluserdetails.length} user details to webhook`);
            } catch (webhookError) {
                console.error('Failed to send data to webhook:', webhookError.message);
                // Don't throw here - we still want to complete the analysis
            }
        } else {
            console.log('No user details to send to webhook');
        }
        
    } catch (error) {
        console.error("Error in sentuserDetails:", error);
        throw error;
    }
}


export default bridgeAnalysisController;