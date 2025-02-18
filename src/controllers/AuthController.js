import { generateIdentifier } from "../services/utils/utilityService.js";
import { getOrganizationById, updateOrganizationData } from "../services/proxyService.js";


const CreateAuthToken = async (req, res) => {
    const org_id =  req.profile.org.id
    const auth_token = generateIdentifier(14);
    const data = await getOrganizationById(org_id)
    if(!data?.meta?.auth_token) await updateOrganizationData(org_id,  {
        meta: {
          ...data?.meta,
          auth_token,
        },
      },
    );
    res.status(200).json({ auth_token: data?.meta?.auth_token || auth_token });
}

export {
    CreateAuthToken
}