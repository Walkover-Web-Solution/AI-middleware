
const collectionNames = {
  ApikeyCredentials: 'ApikeyCredentials',
  configuration: 'configuration',
  Folder: 'Folder'  // Fixed: Model name is 'Folder' not 'folders'
};


const redis_keys = {
  bridgeusedcost_ : 'bridgeusedcost_',
  folderusedcost_ : 'folderusedcost_',
  apikeyusedcost_ : 'apikeyusedcost_',
  bridge_data_with_tools_ : 'bridge_data_with_tools_',
  get_bridge_data_ : 'get_bridge_data_'
};

const cost_types = {
  bridge: 'bridge',
  folder: 'folder',
  apikey: 'apikey'
}
export {
  collectionNames,
  redis_keys,
  cost_types
};