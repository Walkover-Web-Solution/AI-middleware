import prebuiltPromptDbService from "../db_services/prebuiltPrompt.service.js";
import { getAiMiddlewareAgentData } from "../services/utils/aiCall.utils.js";
import { bridge_ids, prebuilt_prompt_bridge_id } from "../configs/constant.js";

const getPrebuiltPrompts = async (req, res, next) => {
    const org_id = req.profile.org.id;
    const prebuiltPrompts = await prebuiltPromptDbService.getPrebuiltPromptsService(org_id);

    const existingPromptIds = new Set();
    prebuiltPrompts.forEach(prompt => {
        Object.keys(prompt).forEach(key => existingPromptIds.add(key));
    });

    for (const prebuiltPromptId of prebuilt_prompt_bridge_id) {
        if (!existingPromptIds.has(prebuiltPromptId)) {
            try {
                const bridgePrompt = await getAiMiddlewareAgentData(bridge_ids[prebuiltPromptId]);
                if (bridgePrompt?.bridge?.configuration?.prompt) {
                    prebuiltPrompts.push({ [prebuiltPromptId]: bridgePrompt.bridge.configuration.prompt });
                }
            } catch (error) {
                console.warn(`Failed to fetch bridge prompt ${prebuiltPromptId}: ${error.message}`);
                continue;
            }
        }
    }

    res.locals = {
        success: true,
        message: "Prebuilt prompts retrieved successfully",
        data: prebuiltPrompts
    };
    req.statusCode = 200;
    return next();
};

const updatePrebuiltPrompt = async (req, res, next) => {
    const org_id = req.profile.org.id;
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
        res.locals = { success: false, message: "Request body cannot be empty" };
        req.statusCode = 400;
        return next();
    }

    const prompt_id = Object.keys(body)[0];
    const prompt_text = body[prompt_id];

    if (!prebuilt_prompt_bridge_id.includes(prompt_id) || !prompt_text) {
        res.locals = { success: false, message: `Invalid prompt_id. Must be one of: ${prebuilt_prompt_bridge_id.join(', ')}` };
        req.statusCode = 400;
        return next();
    }

    const updatedPrompt = await prebuiltPromptDbService.updatePrebuiltPromptService(org_id, prompt_id, { prompt: prompt_text });

    res.locals = {
        success: true,
        message: "Prebuilt prompt updated successfully",
        data: updatedPrompt
    };
    req.statusCode = 200;
    return next();
};

const resetPrebuiltPrompts = async (req, res, next) => {
    const org_id = req.profile.org.id;
    const { prompt_id } = req.body;

    if (!prompt_id) {
        res.locals = { success: false, message: "prompt_id is required in request body" };
        req.statusCode = 400;
        return next();
    }

    if (!prebuilt_prompt_bridge_id.includes(prompt_id)) {
        res.locals = { success: false, message: `Invalid prompt_id. Must be one of: ${prebuilt_prompt_bridge_id.join(', ')}` };
        req.statusCode = 400;
        return next();
    }

    const bridge_id = bridge_ids[prompt_id];
    const bridgePrompt = await getAiMiddlewareAgentData(bridge_id);

    if (bridgePrompt.bridge.configuration.prompt) {
        const originalPrompt = bridgePrompt.bridge.configuration.prompt;
        const updatedPrompt = await prebuiltPromptDbService.updatePrebuiltPromptService(org_id, prompt_id, { prompt: originalPrompt });

        res.locals = {
            success: true,
            message: `Successfully reset ${prompt_id} to original value`,
            data: updatedPrompt
        };
        req.statusCode = 200;
        return next();
    } else {
        res.locals = { success: false, message: "Failed to fetch original prompt from bridge configuration" };
        req.statusCode = 404;
        return next();
    }
};

const getSpecificPrebuiltPrompt = async (req, res, next) => {
    const { prompt_key } = req.body;
    const org_id = req.profile.org.id;

    if (!prompt_key) {
        res.locals = { success: false, message: "prompt_key is required in request body" };
        req.statusCode = 400;
        return next();
    }

    if (!prebuilt_prompt_bridge_id.includes(prompt_key)) {
        res.locals = { success: false, message: `Invalid prompt_key. Must be one of: ${prebuilt_prompt_bridge_id.join(', ')}` };
        req.statusCode = 400;
        return next();
    }

    const specificPrompt = await prebuiltPromptDbService.getSpecificPrebuiltPrompt(org_id, prompt_key);

    res.locals = {
        success: true,
        message: `Retrieved prompt '${prompt_key}' successfully`,
        data: specificPrompt
    };
    req.statusCode = 200;
    return next();
};

export default {
    getPrebuiltPrompts,
    updatePrebuiltPrompt,
    resetPrebuiltPrompts,
    getSpecificPrebuiltPrompt
};
