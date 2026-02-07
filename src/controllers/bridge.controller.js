import ConfigurationServices from "../db_services/configuration.service.js";
import { callAiMiddleware } from "../services/utils/aiCall.utils.js";
import { bridge_ids } from "../configs/constant.js";
import prebuiltPromptDbService from "../db_services/prebuiltPrompt.service.js";
import testcaseDbservice from "../db_services/testcase.service.js";

const optimizePromptController = async (req, res, next) => {
  try {
    const { version_id, query, thread_id } = req.body;
    const { bridge_id } = req.params;
    const org_id = req.profile.org.id;

    const result = await ConfigurationServices.getAgents(bridge_id, org_id, version_id);
    const bridge = result.bridges;
    const prompt = bridge.configuration?.prompt || "";

    let configuration = null;
    const updated_prompt = await prebuiltPromptDbService.getSpecificPrebuiltPrompt(org_id, "optimze_prompt");
    if (updated_prompt && updated_prompt.optimze_prompt) {
      configuration = { prompt: updated_prompt.optimze_prompt };
    }

    const variables = { query: query || "" };
    const aiResult = await callAiMiddleware(prompt, {
      variables,
      configuration,
      thread_id,
      bridge_id: bridge_ids["optimze_prompt"],
      response_type: "text"
    });

    res.locals = {
      success: true,
      message: "Prompt optimized successfully",
      result: aiResult
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error("Error in optimizePromptController:", error);
    res.locals = { success: false, error: "Error in optimizing prompt: " + error.message };
    req.statusCode = 400;
    return next();
  }
};

const generateSummary = async (req, res, next) => {
  try {
    const { version_id } = req.body;
    const org_id = req.profile.org.id;

    const result = await ConfigurationServices.getAgentsWithTools(null, org_id, version_id);
    const bridgeData = result.bridges;

    if (!bridgeData) {
      res.locals = { success: false, error: "Version data not found" };
      req.statusCode = 400;
      return next();
    }

    const tools = {};
    if (bridgeData.apiCalls) {
      Object.values(bridgeData.apiCalls).forEach((tool) => {
        tools[tool.title] = tool.description;
      });
    }

    let system_prompt = bridgeData.configuration?.prompt || "";
    if (Object.keys(tools).length > 0) {
      system_prompt += `Available tool calls :-  ${JSON.stringify(tools)}`;
    }

    const variables = { prompt: system_prompt };
    const user = "generate summary from the user message provided in system prompt";

    let configuration = null;
    const updated_prompt = await prebuiltPromptDbService.getSpecificPrebuiltPrompt(org_id, "generate_summary");
    if (updated_prompt && updated_prompt.generate_summary) {
      configuration = { prompt: updated_prompt.generate_summary };
    }

    const summary = await callAiMiddleware(user, {
      bridge_id: bridge_ids["generate_summary"],
      configuration,
      response_type: "text",
      variables
    });

    res.locals = {
      success: true,
      message: "Summary generated successfully",
      result: summary
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error("Error in generateSummary:", error);
    res.locals = { success: false, error: error.message };
    req.statusCode = 400;
    return next();
  }
};

const functionArgsUsingAi = async (req, res, next) => {
  try {
    const { example_json } = req.body;
    const user = `geneate the json using the example json data : ${example_json}`;

    const json = await callAiMiddleware(user, {
      bridge_id: bridge_ids["function_agrs_using_ai"]
    });

    res.locals = {
      success: true,
      message: "json generated successfully",
      result: json
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error("Error in functionArgsUsingAi:", error);
    res.locals = { success: false, error: error.message };
    req.statusCode = 400;
    return next();
  }
};

const generateAdditionalTestCases = async (req, res, next) => {
  try {
    const { version_id } = req.body;
    const { bridge_id } = req.params;
    const org_id = req.profile.org.id;

    const result = await ConfigurationServices.getAgentsWithTools(bridge_id, org_id, version_id);
    const bridgeData = result.bridges;

    if (!bridgeData) {
      res.locals = { success: false, error: "Bridge data not found" };
      req.statusCode = 404;
      return next();
    }

    const system_prompt = bridgeData.configuration?.prompt || "";
    const variables = { system_prompt };

    let configuration = null;
    const updated_prompt = await prebuiltPromptDbService.getSpecificPrebuiltPrompt(org_id, "generate_test_cases");
    if (updated_prompt && updated_prompt.generate_test_cases) {
      configuration = { prompt: updated_prompt.generate_test_cases };
    }

    const user_message =
      "Generate 10 comprehensive test cases for this AI assistant based on its system prompt and available tools. Each test case should include a UserInput and ExpectedOutput.";

    const testcases = await callAiMiddleware(user_message, {
      variables,
      configuration,
      bridge_id: bridge_ids["generate_test_cases"]
    });

    const savedTestcases = await testcaseDbservice.parseAndSaveTestcases(testcases, bridge_id);

    res.locals = {
      success: true,
      message: `Test cases generated and ${savedTestcases.length} saved successfully`,
      result: testcases,
      saved_testcase_ids: savedTestcases
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error("Error in generateAdditionalTestCases:", error);
    res.locals = { success: false, error: "Error in generating test cases: " + error.message };
    req.statusCode = 400;
    return next();
  }
};

export default {
  optimizePromptController,
  generateSummary,
  functionArgsUsingAi,
  generateAdditionalTestCases
};
