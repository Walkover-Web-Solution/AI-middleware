import configurationModel from "../mongoModel/Configuration.model.js";
import versionModel from "../mongoModel/BridgeVersion.model.js";
import { getallOrgs } from "../utils/proxy.utils.js";

// GET /agents/by-model?model=...
// Returns combined data from configuration and version collections
// matched by configuration.model and enriched with MSG91 org details.
export const getAgentsByModel = async (req, res, next) => {
  const { model } = req.query;
  if (!model || typeof model !== 'string') {
    res.locals = { success: false, message: 'Query param "model" is required' };
    req.statusCode = 400;
    return next();
  }

  // 1) Fetch configurations and versions that match the model (Mongo first)
  const [configs, versions] = await Promise.all([
    configurationModel
      .find({ 'configuration.model': model })
      .select({ _id: 1, name: 1, org_id: 1 })
      .lean(),
    versionModel
      .find({ 'configuration.model': model })
      .select({ _id: 1, org_id: 1, parent_id: 1, created_at: 1 })
      .lean(),
  ]);

  // Prepare helpers from the fetched Mongo data
  const configByOrg = new Map(configs.map(c => [String(c.org_id), c]));
  const items = [
    ...versions.map(v => ({ kind: 'version', data: v })),
    ...configs.map(c => ({ kind: 'config', data: c })),
  ];

    const parentIds = Array.from(new Set(
      versions
        .filter(v => !configByOrg.has(String(v.org_id)) && v?.parent_id)
        .map(v => String(v.parent_id))
    ));

  // 2) Resolve parent configurations (batch) for versions missing direct config
  let parentConfigById = new Map();
  if (parentIds.length > 0) {
    const parentConfigs = await configurationModel
      .find({ _id: { $in: parentIds } })
      .select({ _id: 1, name: 1 })
      .lean();
    parentConfigById = new Map(parentConfigs.map(p => [String(p._id), p]));
  }

  // 3) Fetch orgs from MSG91 and map by org_id; then map org data inside the loop
  const orgsResponse = await getallOrgs();
  const orgs = (orgsResponse?.data?.data) || (orgsResponse?.data) || orgsResponse || [];
  const orgMap = new Map();
  for (const org of orgs) {
    orgMap.set(String(org.id), { name: org.name || null, email: org.email || null });
  }

  const results = [];
  const seenNameEmail = new Set();

  for (const it of items) {
    const orgId = String(it.data.org_id);
    const orgInfo = orgMap.get(orgId) || { name: null, email: null };

    const nameEmailKey = `${orgInfo.name || ''}|${orgInfo.email || ''}`;
    if (seenNameEmail.has(nameEmailKey)) continue; // ensure distinct name/email

    let agentId = null;
    let agentName = null;
    let versionId = null;

    if (it.kind === 'config') {
      agentId = String(it.data._id);
      agentName = it.data.name || null;
      versionId = null;
    } else {
      versionId = String(it.data._id);
      const cfg = configByOrg.get(orgId);
      if (cfg) {
        agentId = String(cfg._id);
        agentName = cfg.name || null;
      } else if (it.data.parent_id) {
        const parentCfg = parentConfigById.get(String(it.data.parent_id));
        if (parentCfg) {
          agentId = String(parentCfg._id);
          agentName = parentCfg.name || null;
        }
      }
    }

    results.push({
      agent_id: agentId,
      version_id: versionId,
      name: orgInfo.name,
      email: orgInfo.email,
      agent_name: agentName,
      org_id: orgId,
    });
    seenNameEmail.add(nameEmailKey);
  }

  res.locals = { success: true, count: results.length, data: results };
  req.statusCode = 200;
  return next();
};

export default {
  getAgentsByModel,
};
