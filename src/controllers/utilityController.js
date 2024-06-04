import axios from "axios";
import responseTypeService from "../db_services/responseTypeService.js";
import configurationModel from "../mongoModel/configuration.js";
import { generateIdentifier } from "../services/utils/utilityService.js";

const defaulResponseMigration = async (req, res) => {
  let result = []

  try {
    const response = await axios.get(`${process.env.PROXY_BASE_URL}/${process.env.PROXY_USER_REFERENCE_ID}/getCompanies?itemsPerPage=${1000}`, {
      headers: {
        'Content-Type': 'application/json',
        Authkey: process.env.PROXY_ADMIN_TOKEN,
        // Add any other headers if needed
      }
    });

    result = response?.data?.data?.data;
    for (let index = 0; index < result.length; index++) {
      const org = result[index];
      const orgId = org.id
      console.log(orgId);
      await responseTypeService.create(orgId);

    }
    const bridges = await configurationModel.find({})
    for (let index = 0; index < bridges.length; index++) {
      const brige = bridges[index];
      if (!brige.slugName) {
        await configurationModel.findOneAndUpdate({ _id: brige }, {
          slugName: generateIdentifier(14)
        })

      }

    }

  } catch (error) {
    console.error('Error fetching data:', error.message);
    //   throw error; // Re-throw the error for the caller to handle
  }

  return res.status(200).json({ data: result?.length });

}
export {
  defaulResponseMigration
};
