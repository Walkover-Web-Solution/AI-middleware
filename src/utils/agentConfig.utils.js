import { ObjectId } from "mongodb";
import apiCallModel from "../mongoModel/ApiCall.model.js";
import jwt from "jsonwebtoken";
import axios from "axios";

const getUniqueNameAndSlug = (baseName, allAgents) => {
    let name = baseName || "untitled_agent";
    let name_next_count = 1;
    let slug_next_count = 1;

    for (const agent of allAgents) {
        if (name.startsWith("untitled_agent") && agent.name.startsWith("untitled_agent_")) {
            const num = parseInt(agent.name.replace("untitled_agent_", ""));
            if (num >= name_next_count) name_next_count = num + 1;
        } else if (agent.name === name) {
            name_next_count += 1;
        }

        if (name.startsWith("untitled_agent") && agent.slugName.startsWith("untitled_agent_")) {
            const num = parseInt(agent.slugName.replace("untitled_agent_", ""));
            if (num >= slug_next_count) slug_next_count = num + 1;
        } else if (agent.slugName === name) {
            slug_next_count += 1;
        }
    }

    return {
        name: `${name}_${name_next_count}`,
        slugName: `${name}_${slug_next_count}`
    };
};

const normalizeFunctionIds = function_ids => {
    if (!function_ids) return [];
    if (Array.isArray(function_ids)) return function_ids;
    if (typeof function_ids === "object") return Object.values(function_ids);
    return [];
};

const cloneFunctionsForAgent = async (function_ids, org_id, agent_id) => {
    const cloned_function_ids = [];
    const ids = normalizeFunctionIds(function_ids);

    for (const function_id of ids) {
        if (!function_id) continue;
        let functionObjectId = null;
        try {
            functionObjectId = function_id?.buffer
                ? new ObjectId(Buffer.from(function_id.buffer))
                : new ObjectId(function_id);
        } catch {
            console.error("Invalid function id in template:", function_id);
            continue;
        }

        const original_api_call = await apiCallModel.findOne({ _id: functionObjectId }).lean();
        if (!original_api_call || !original_api_call.script_id) {
            continue;
        }

        const existing_api_call = await apiCallModel.findOne({
            org_id: org_id,
            script_id: original_api_call.script_id
        }).lean();

        if (existing_api_call) {
            await apiCallModel.updateOne(
                { _id: existing_api_call._id },
                {
                    $addToSet: { bridge_ids: new ObjectId(agent_id) },
                    $set: { status: 1, updated_at: new Date() }
                }
            );
            cloned_function_ids.push(existing_api_call._id.toString());
            continue;
        }

        try {
            const payload = {
                org_id: process.env.ORG_ID,
                project_id: process.env.PROJECT_ID,
                user_id: org_id
            };
            const auth_token = jwt.sign(payload, process.env.ACCESS_KEY, { algorithm: "HS256" });

            const duplicate_url = `https://flow-api.viasocket.com/embed/duplicateflow/${original_api_call.script_id}`;
            const headers = {
                Authorization: auth_token,
                "Content-Type": "application/json"
            };
            const json_body = {
                title: "",
                meta: ""
            };

            const response = await axios.post(duplicate_url, json_body, { headers });
            const duplicate_data = response.data;

            if (duplicate_data.success && duplicate_data.data) {
                const new_api_call = { ...original_api_call };
                delete new_api_call._id;
                new_api_call.org_id = org_id;
                new_api_call.script_id = duplicate_data.data.id;
                new_api_call.bridge_ids = [new ObjectId(agent_id)];
                new_api_call.updated_at = new Date();

                const new_api_call_result = await new apiCallModel(new_api_call).save();
                cloned_function_ids.push(new_api_call_result._id.toString());
            } else {
                console.error(`Failed to duplicate function ${original_api_call.script_id}:`, duplicate_data);
            }
        } catch (e) {
            console.error(`Error duplicating function ${original_api_call.script_id || function_id}:`, e);
            const new_api_call = { ...original_api_call };
            delete new_api_call._id;
            new_api_call.org_id = org_id;
            new_api_call.bridge_ids = [new ObjectId(agent_id)];
            new_api_call.updated_at = new Date();

            const new_api_call_result = await new apiCallModel(new_api_call).save();
            cloned_function_ids.push(new_api_call_result._id.toString());
        }
    }

    return cloned_function_ids;
};

export {
    getUniqueNameAndSlug,
    normalizeFunctionIds,
    cloneFunctionsForAgent
};
