import PrebuiltPrompt from "../mongoModel/PrebuiltPrompt.model.js";

async function getSpecificPrebuiltPrompt(org_id, prompt_key) {
    try {
        const document = await PrebuiltPrompt.findOne({ org_id }).lean();
        if (document && document.prebuilt_prompts && document.prebuilt_prompts[prompt_key]) {
            return { [prompt_key]: document.prebuilt_prompts[prompt_key] };
        }
        return null;
    } catch (error) {
        console.error("Error fetching specific prebuilt prompt:", error);
        throw error;
    }
}

async function updatePrebuiltPromptService(org_id, prompt_id, prompt_data) {
    try {
        const existingDocument = await PrebuiltPrompt.findOne({ org_id });

        if (existingDocument) {
            const updateData = {
                [`prebuilt_prompts.${prompt_id}`]: prompt_data.prompt
            };

            await PrebuiltPrompt.updateOne({ org_id }, { $set: updateData });
            return { [prompt_id]: prompt_data.prompt };
        } else {
            const newPromptData = {
                org_id,
                prebuilt_prompts: {
                    [prompt_id]: prompt_data.prompt
                }
            };
            await PrebuiltPrompt.create(newPromptData);
            return { [prompt_id]: prompt_data.prompt };
        }
    } catch (error) {
        throw new Error(`Database error: ${error.message}`);
    }
}

async function getPrebuiltPromptsService(org_id) {
    try {
        const document = await PrebuiltPrompt.findOne({ org_id }).lean();
        const prompts = [];
        if (document && document.prebuilt_prompts) {
            for (const [key, value] of Object.entries(document.prebuilt_prompts)) {
                prompts.push({ [key]: value });
            }
        }
        return prompts;
    } catch (error) {
        throw new Error(`Database error: ${error.message}`);
    }
}

export default {
    getSpecificPrebuiltPrompt,
    updatePrebuiltPromptService,
    getPrebuiltPromptsService
};
