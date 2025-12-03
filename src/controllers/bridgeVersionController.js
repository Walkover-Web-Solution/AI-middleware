import bridgeVersionDbService from "../db_services/bridgeVersionDbService.js";
import ConfigurationServices from "../db_services/ConfigurationServices.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let modelFeatures = {};
try {
    const featuresPath = path.join(__dirname, '../services/utils/model_features.json');
    if (fs.existsSync(featuresPath)) {
        modelFeatures = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading model features:", error);
}

const createVersion = async (req, res, next) => {
    const { version_id, version_description } = req.body;
    const org_id = req.profile.org.id;

    const bridgeData = await ConfigurationServices.getBridgesWithoutTools(null, org_id, version_id);

    if (bridgeData.bridges && bridgeData.bridges.deletedAt) {
        res.locals = { success: false, message: "Cannot create version for a deleted bridge" };
        req.statusCode = 400;
        return next();
    }

    const parent_id = bridgeData.bridges.parent_id;
    const bridgeVersionData = { ...bridgeData.bridges, version_description };

    const newVersion = await bridgeVersionDbService.createBridgeVersion(bridgeVersionData);
    const create_new_version = newVersion._id.toString();
    await bridgeVersionDbService.updateBridges(parent_id, { versions: [create_new_version] });
    if (bridgeData.bridges.apikey_object_id) {
        await ConfigurationServices.updateApikeyCreds(create_new_version, bridgeData.bridges.apikey_object_id);
    }

    res.locals = {
        success: true,
        message: "version created successfully",
        version_id: create_new_version
    };
    req.statusCode = 200;
    return next();
};

const getVersion = async (req, res, next) => {
    const { version_id } = req.params;
    const result = await bridgeVersionDbService.getVersionWithTools(version_id);
    if (!result || !result.bridges) {
        res.locals = { success: false, message: "Bridge version not found" };
        req.statusCode = 400;
        return next();
    }

    const bridge = result.bridges;
    res.locals = {
        success: true,
        message: "bridge get successfully",
        bridge: bridge
    };
    req.statusCode = 200;
    return next();
};

const publishVersion = async (req, res, next) => {
    const { version_id } = req.params;
    const org_id = req.profile.org.id;
    const user_id = req.profile.user.id;

    await bridgeVersionDbService.publish(org_id, version_id, user_id);

    res.locals = {
        success: true,
        message: "version published successfully",
        version_id: version_id
    };
    req.statusCode = 200;
    return next();
};

const removeVersion = async (req, res, next) => {
    const { version_id } = req.params;
    const org_id = req.profile.org.id;

    const result = await bridgeVersionDbService.deleteBridgeVersion(org_id, version_id);
    res.locals = result;
    req.statusCode = 200;
    return next();
};

const bulkPublishVersion = async (req, res, next) => {
    const { version_ids } = req.body;
    const org_id = req.profile.org.id;
    const user_id = req.profile.user.id;

    if (!Array.isArray(version_ids) || version_ids.length === 0) {
        res.locals = { success: false, message: "version_ids must be a non-empty list" };
        req.statusCode = 400;
        return next();
    }

    const results = await Promise.all(version_ids.map(async (vid) => {
        try {
            await bridgeVersionDbService.publish(org_id, vid, user_id);
            return { status: "success", version_id: vid };
        } catch (error) {
            return { status: "failed", version_id: vid, error: error.message };
        }
    }));

    const published = results.filter(r => r.status === "success").map(r => r.version_id);
    const failed = results.filter(r => r.status === "failed");

    res.locals = {
        success: failed.length === 0,
        message: "Bulk publish completed",
        published_version_ids: published,
        failed: failed
    };
    req.statusCode = 200;
    return next();
};

const discardVersion = async (req, res, next) => {
    const { version_id } = req.params;
    const bridgeDataResult = await bridgeVersionDbService.getVersionWithTools(version_id);
    if (!bridgeDataResult || !bridgeDataResult.bridges) {
        res.locals = { success: false, message: "Bridge not found" };
        req.statusCode = 400;
        return next();
    }
    const bridgeData = bridgeDataResult.bridges;
    const keysToRemove = ['name', 'slugName', 'bridgeType', '_id', 'versions', 'status', 'apiCalls', 'bridge_status'];
    keysToRemove.forEach(key => delete bridgeData[key]);

    bridgeData.is_drafted = false;
    await bridgeVersionDbService.updateBridges(null, bridgeData, version_id);

    res.locals = {
        success: true,
        message: "version changes discarded successfully",
        version_id: version_id
    };
    req.statusCode = 200;
    return next();
};

const suggestModel = async (req, res, next) => {
    const { version_id } = req.params;
    const org_id = req.profile.org.id;
    const folder_id = req.profile.user.folder_id;

    res.locals = { success: true, message: "Suggest model not fully implemented yet", data: { available: { model: "gpt-3.5-turbo", service: "openai" } } };
    req.statusCode = 200;
    return next();
};

const getConnectedAgents = async (req, res, next) => {
    const { id } = req.params;
    const { type } = req.query;
    const org_id = req.profile.org.id;

    const result = await bridgeVersionDbService.getAllConnectedAgents(id, org_id, type);
    res.locals = { success: true, data: result };
    req.statusCode = 200;
    return next();
};

export default {
    createVersion,
    getVersion,
    publishVersion,
    removeVersion,
    bulkPublishVersion,
    discardVersion,
    suggestModel,
    getConnectedAgents
};
