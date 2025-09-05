import ConfigurationServices from "../db_services/ConfigurationServices.js";
import FolderModel from "../mongoModel/gtwyEmbedModel.js";
import configurationModel from "../mongoModel/configuration.js";
import { deleteInCache } from "../cache_service/index.js";
import { createProxyToken, getOrganizationById, updateOrganizationData } from "../services/proxyService.js";
import { generateIdentifier } from "../services/utils/utilityService.js";

const embedLogin = async (req, res) => {
    const { name: embeduser_name, email: embeduser_email } = req.Embed;
      const embedDetails = { user_id: req.Embed.user_id, company_id: req?.Embed?.org_id, company_name: req.Embed.org_name, tokenType: 'embed', embeduser_name, embeduser_email,folder_id : req.Embed.folder_id };
      const folder = await FolderModel.findOne({ _id: req.Embed.folder_id });
      const config = folder?.config || {};
      const response = {
        ...req?.Embed,
        user_id: req.Embed.user_id,
        token: await createProxyToken(embedDetails),
        config
      };
      return res.status(200).json({ data: response, message: 'logged in successfully' });
}

const createEmbed = async (req, res) => {
    const name = req.body.name;
    const config = req.body.config;
    const org_id =  req.profile.org.id
    const apikey_object_id = req.body.apikey_object_id;
    const type = "embed"
    const folder = await FolderModel.create({ name, org_id, type, config, apikey_object_id });
    res.status(200).json({ data:{...folder.toObject(), folder_id: folder._id} });
}

const getAllEmbed = async (req, res) => {
    const org_id =  req.profile.org.id
    const data = await FolderModel.find({org_id})
    res.status(200).json({ data: data.map(folder => ({...folder.toObject(), folder_id: folder._id})) });
}

const updateEmbed = async (req, res) => {
    const folder_id = req.body.folder_id;
    const config = req.body.config;
    const org_id = req.profile.org.id;
    const apikey_object_id = req.body.apikey_object_id;
    
    const folder = await FolderModel.findOne({ _id: folder_id, org_id });
    if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
    }

    // Find bridge object using apikey_object_id and delete from cache
    const bridgeObject = await configurationModel.findOne({ folder_id : folder_id });
    if (bridgeObject) {
        // Delete cache using object id
        await deleteInCache(bridgeObject._id.toString());
        
        // Delete cache for all version_ids in a single batch operation
        // Access versions from _doc since direct access returns undefined
        const versionIds = bridgeObject._doc?.versions;
        if (versionIds?.length > 0) {
            await deleteInCache(versionIds);
        }
    }

    folder.config = config;
    folder.apikey_object_id = apikey_object_id;
    await folder.save();
    
    res.status(200).json({ data: {...folder.toObject(), folder_id: folder._id} });
}



const genrateToken = async (req, res) => {
  let gtwyAccessToken;
  const data = await getOrganizationById(req.profile.org.id)
  gtwyAccessToken = data?.meta?.gtwyAccessToken;
  if(!gtwyAccessToken) {
    gtwyAccessToken = generateIdentifier(32);
    await updateOrganizationData(req.profile.org.id,  {
      meta: {
        ...data?.meta,
        gtwyAccessToken,  
      },
    },
  );
  }
  res.status(200).json({ gtwyAccessToken });
}

const getEmbedDataByUserId = async (req, res, next) => {
  const user_id = req.profile.user.id;
  const org_id = req.profile.org.id;
  const agent_id = req?.query?.agent_id;
  
  const data = await ConfigurationServices.getBridgesByUserId(org_id, user_id, agent_id);
  
  res.locals = {
    success: true, 
    message: "Get Agents data successfully",
    data
  };

  req.statusCode = 200;
  return next();
};
export { embedLogin, createEmbed, getAllEmbed, genrateToken, updateEmbed, getEmbedDataByUserId };
