import ConfigurationServices from "../db_services/ConfigurationServices.js";
import FolderModel from "../mongoModel/gtwyEmbedModel.js";
import { createProxyToken, getOrganizationById, updateOrganizationData } from "../services/proxyService.js";
import { generateIdentifier } from "../services/utils/utilityService.js";

const embedLogin = async (req, res) => {
    const { name: embeduser_name, email: embeduser_email } = req.Embed;
      const embedDetails = { user_id: req.Embed.user_id, company_id: req?.Embed?.org_id, company_name: req.Embed.org_name, tokenType: 'embed', embeduser_name, embeduser_email,folder_id : req.Embed.folder_id };
      const response = {
        ...req?.Embed,
        user_id: req.Embed.user_id,
        token: await createProxyToken(embedDetails),
      };
      return res.status(200).json({ data: response, message: 'logged in successfully' });
}

const createEmbed = async (req, res) => {
    const name = req.body.name;
    const config = req.body.config;
    const org_id =  req.profile.org.id
    const type = "embed"
    const folder = await FolderModel.create({ name, org_id, type, config });
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
    
    const folder = await FolderModel.findOne({ _id: folder_id, org_id });
    if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
    }

    folder.config = config;
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

const getEmbedByUserId = async (req, res) => {
    const user_id = req.params.user_id;
    const org_id = req.profile.org.id;
    const variables =  req?.query?.variables;
    
    const data = await ConfigurationServices.getBridgesByUserId(org_id, user_id);
    if(variables){
      const variablesState = data.map(bridge => ({
          _id: bridge._id,
          variables_state: bridge.variables_state || {},
          meta: bridge.meta || {}
      }));
      return res.status(200).json({variablesState });
     }
  
  res.status(200).json({ data });
}
export { embedLogin, createEmbed, getAllEmbed, genrateToken, updateEmbed, getEmbedByUserId };
