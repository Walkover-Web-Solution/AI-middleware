import responseTypeModel from "../mongoModel/ResponseType.model.js";
import defaultResponseJson from "../services/utils/defaultResponseConfig.js";

const create = async (orgId) => {
  try {
    const temp = await responseTypeModel.create({
      orgId: orgId,
      responseTypes: defaultResponseJson,
    });
    return {
      success: true,
      chatBot: temp,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create response in org " + error,
    };
  }
};

const update = async (orgId, updateData) => {
  try {
    const temp = await responseTypeModel.findOneAndUpdate(
      { orgId: orgId },
      { $set: { responseTypes: updateData } },
      { new: true, upsert: true } // upsert: true creates a new document if no matching document is found
    );
    console.log("Document updated:", temp);
    return {
      success: true,
      chatBot: temp,
    };
  } catch (error) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error: "Failed to update response in org",
    };
  }
};

const getAll = async (orgId) => {
  try {
    const temp = await responseTypeModel.findOne({
      orgId: orgId,
    });
    return { success: true, chatBot: temp };
  } catch (error) {
    return { success: false, error: "Failed to create response in org " + error };
  }
};

const addResponseTypes = async (orgId, responseId, responseJson) => {
  try {
    const temp = await responseTypeModel.findOneAndUpdate(
      {
        orgId: orgId,
      },
      {
        $set: {
          [`responseTypes.${responseId}`]: responseJson,
        },
      },
      {
        new: true,
      }
    );
    console.log("Document created:", temp);
    return temp._id;
  } catch (error) {
    return {
      success: false,
      error: "Failed to add response in org " + error,
    };
  }
};

const createOrgToken = async (orgId, token) => {
  try {
    const orgData = await responseTypeModel
      .findOneAndUpdate(
        {
          orgId: orgId,
        },
        {
          $set: {
            orgAcessToken: token,
          },
        },
        {
          new: true,
          upsert: true,
        }
      )
      .lean();
    return { success: true, orgData };
  } catch (error) {
    return {
      success: false,
      error: error?.message,
    };
  }
};

export default {
  create,
  addResponseTypes,
  getAll,
  createOrgToken,
  update,
};
