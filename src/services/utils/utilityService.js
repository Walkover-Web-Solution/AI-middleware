import { nanoid, customAlphabet } from 'nanoid';
import { parseString } from 'xml2js';
import _ from 'lodash';
import axios from 'axios';
import crypto from 'crypto';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const alphabetSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
// const basicAuthServices = require('../db_services/basic_auth_db_service.js')

// encryption decryption service
const algorithm = 'aes-256-cbc';
const secret_key = process.env.ENCRYPTION_SECRET_KEY;
const secret_iv = process.env.ENCRYPTION_SECRET_IV;

function generateIdentifier(length = 12, prefix = '', includeNumber = true) {
  const alphabet = includeNumber ? alphabetSet : alphabetSet.slice(0, alphabetSet.length - 10);
  if (alphabet) {
    const custom_nanoid = customAlphabet(alphabet, length);
    return `${prefix}${custom_nanoid()}`;
  }
  return `${prefix}${nanoid(length)}`;
}

const elasticValidateResponse = (data) => {
  try {
    const logs = [];
    const groupedData = {};
    if (data?._source) {
      const identifier = data._id;
      data._source.id = identifier;
      data._source._id = identifier;
      return data._source;
    }
    if (data?.[0]?._source) {
      data?.forEach((dataTemp) => {
        dataTemp._source.id = dataTemp._id;
        dataTemp._source._id = dataTemp._id;
        const { scriptId } = dataTemp._source;

        if (!groupedData[scriptId]) {
          groupedData[scriptId] = [];
        }
        groupedData[scriptId].push(dataTemp._source);
      });
      return groupedData;
    }
    if (data?.finalResponse) {
      data?.finalResponse?.forEach((dataTemp) => {
        dataTemp._source.id = dataTemp._id;
        dataTemp._source._id = dataTemp._id;
        const { scriptId } = dataTemp._source;

        if (!groupedData[scriptId]) {
          groupedData[scriptId] = [];
        }
        groupedData[scriptId].push(dataTemp._source);
      });
      data.finalResponse = groupedData;
      return data;
    }
    return logs;
  } catch (error) {
    console.error('error', error);
  }
};
const elasticPrepareSuccessResponse = ({ data, message, isCached }) => {
  data = elasticValidateResponse(data);
  return {
    success: true,
    message: !_.isEmpty(message) ? message : '',
    data: !_.isEmpty(data) ? data : null,
    isCached,
  };
};

const prepareSuccessResponse = ({ data, message, isCached }) => {
  if (
    data
    && (data?.dataValues
      || data[0]?.dataValues
      || data?.identifier
      || data[0]?.identifier)
  ) {
    data = validateResponse(data);
  }
  return {
    success: true,
    message: !_.isEmpty(message) ? message : '',
    data: !_.isEmpty(data) ? data : [],
    isCached,
  };
};

const successResponseForDeleteCreateUpdate = ({
  functionData, script, message, isCached,
}) => {
  let scriptData = script?.scriptData || script;
  if (functionData && (functionData?.dataValues || functionData[0]?.dataValues || functionData?.identifier || functionData[0]?.identifier)) functionData = validateResponse(functionData);

  // if(scriptData && (scriptData?.dataValues || scriptData[0]?.dataValues || scriptData?.identifier|| scriptData[0]?.identifier))
  if (scriptData) scriptData = validateResponse(scriptData);

  return {
    success: true,
    message: !_.isEmpty(message) ? message : '',
    function: message === 'Successfully delete Function' ? functionData : (!_.isEmpty(functionData) ? functionData : null),
    script: !_.isEmpty(scriptData) ? scriptData : null,
    isCached,
  };
};

const successResponseForDeleteCreateUpdateStep = ({
  script, message,
}) => {
  let scriptData = script?.scriptData;

  // if(scriptData && (scriptData?.dataValues || scriptData[0]?.dataValues || scriptData?.identifier|| scriptData[0]?.identifier))
  if (scriptData) scriptData = validateResponse(scriptData);
  return {
    success: true,
    message: !_.isEmpty(message) ? message : '',
    script: !_.isEmpty(scriptData) ? scriptData : null,
  };
};

const prepareErrorResponse = ({ data, message }) => ({
  success: false,
  message: !_.isEmpty(message) ? message : '',
  data: !_.isEmpty(data) ? data : null,
});

const validateResponse = (data) => {
  try {
    // delete published_json_script and publish_json_script
    if (data?.published_execution_script) {
      delete data?.published_execution_script;
    }
    if (data?.dataValues?.published_execution_script) {
      delete data?.dataValues?.published_execution_script;
    }

    if (data?.dataValues) {
      const identifier = data?.dataValues?.identifier;
      delete data?.dataValues.identifier;
      if (identifier) data.dataValues.id = identifier;
      return data;
    }
    if (data?.identifier) {
      const { identifier } = data;
      delete data.identifier;
      if (identifier) data.id = identifier;
      return data;
    }

    if (data[0]?.dataValues) {
      data?.forEach((dataTemp) => {
        if (dataTemp?.dataValues?.identifier) dataTemp.dataValues.id = dataTemp?.dataValues?.identifier;
        delete dataTemp?.dataValues.identifier;
      });
      return data;
    }
    if (data[0]?.identifier) {
      data?.forEach((ele) => {
        if (ele.identifier) ele.id = ele.identifier;
        delete ele.identifier;
      });
      return data;
    }
    return data;
  } catch (error) {
    console.error('error', error);
  }
};

const addVariableIntoCode = ({ code, variable }) => {
  let data = `let context = ${JSON?.stringify(variable)}`;
  data
    += ` \n async function getAccessToken(id){ \n const data  = await axios.get(\`${process.env.VERIFYTOKENURL
    }?id=\${id}\`)\nreturn data?.data\n}\n`;
  data
    += ` \n async function getBasicAuthData(id){ \n const data  = await axios.get(\`${process.env.GET_BASIC_AUTH_DATA_URL
    }?id=\${id}\`)\nreturn data?.data\n}\n`;
  data
    += ` \n async function _getAccessToken(id){ \n const data  = await axios.get(\`${process.env._VERIFYTOKENURL
    }?id=\${id}\`)\nreturn data?.data\n}\n`;
  data += `\n ${code}`;

  return data;
};

const checkCodeValidity = (codeString) => {
  try {
     
    eval(codeString);
    return { success: true, message: 'The code is valid.' };
  } catch (e) {
    return {
      success: false,
      message: `There is a syntax error in the code: ${e.message}`,
    };
  }
};

const evalVariableAndCodeFromContext = (code = '', context = {}) => {
  try {
    if (!code || !context) return { message: '', success: false };
     
    const myFunction = new Function('context', code);
    const data = myFunction(context);
    return { message: data, success: true };
  } catch (error) {
    return { message: `Error:: ${error?.message}`, success: false };
  }
};

const makeCronRequest = async (dataToSend) => {
  try {
    return (await axios.post(
      'https://flow.sokt.io/func/kBIFNE1ZYZGH', // TODO: need to update the cron flow in viasocket essentials at api query params-> timezone_from=2&timezone=${context?.req?.body?.timezone}
      // 'https://flow.sokt.io/func/scriZzzXglfq',
      dataToSend,
    ))?.data;
  } catch (e) {
    console.error(e);
  }
};

const formatedData = (postData) => {
  const value = postData?.mimeType;
  const xmlData = postData?.text && postData?.text !== '' ? postData?.text : '{}';

  if (
    value === 'text/html'
    || value === 'text/xml'
    || value === 'application/xml'
  ) {
    let data;
    parseString(JSON.parse(xmlData), (error, result) => {
      if (error) return {};

      data = result;
    });
    return data;
  }
  return xmlData;
};

const sendAlert = async (payload, title = null) => {
  try {
    const ALERT_API = process.env.ALERT_API || '';
    if (!ALERT_API) throw new Error('ALERT_API is required');
    await axios.post(ALERT_API, { payload, title });
  } catch (error) {
    console.error('ERROR IN sendAlert', error.message);
  }
};

const sendAlertOnLogs = async (dataToSend) => {
  try {
    return await axios.post(process.env.ALERT_ON_LOGS, {
      dataToSend,
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
};

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function removeCircularReferences(obj) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  }));
}

async function getAccessToken(id) {
  try {
    const data = await axios.get(`${process.env.VERIFYTOKENURL}?id=${id}`);
    return data?.data;
  } catch (error) {
    return error.message;
  }
}

function encrypt(text) {
  const { encryptionKey, iv } = generateEncryption();
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText) {
  const { encryptionKey, iv } = generateEncryption();
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher?.final('utf8');
  return decrypted;
}

// async function returnDecryptedBasicAuthData(authData){
//   try {
//     let encryptedAuthDataFromDB = await basicAuthServices.getbyid(authData);
//     let decryptedAuthData = JSON.parse(decrypt(encryptedAuthDataFromDB.dataValues.fields));
//     return decryptedAuthData;
//   } catch (error) {
//     console.log('something is wrong in returnDecryptedBasicAuthData', error);
//     return {};
//   }
// }

function maskString(str = '', startLength = 3, endLength = 3) {
  if (!str) return '******';
  let maskedString = '';
  for (let i = 0; i < startLength; i++) {
    if (i >= 0 && str.length > i + 1) {
      maskedString += str[i];
    }
  }
  maskedString += '******';
  for (let i = str.length - endLength; i < str.length; i++) {
    if (i >= 0 && str.length > i + 1) {
      maskedString += str[i];
    }
  }
  return maskedString;
}

function generateEncryption() {
  const encryptionKey = crypto
    .createHash('sha512')
    .update(secret_key)
    .digest('hex')
    .substring(0, 32);

  const iv = crypto
    .createHash('sha512')
    .update(secret_iv)
    .digest('hex')
    .substring(0, 16);

  return { encryptionKey, iv };
}
function removeKeyWithUnderscore(inputObject) {
  const filteredObject = {};

  for (const key in inputObject) {
    if (!key.startsWith('_')) {
      if (typeof inputObject[key] === 'object') {
        filteredObject[key] = removeKeyWithUnderscore(inputObject[key]);
      } else {
        filteredObject[key] = inputObject[key];
      }
    }
  }

  return filteredObject;
}

function removereplaceKeyWithUnderscoreForPlugin(inputObject) {
  // If the input is a string, return it as is
  if (typeof inputObject === 'string' || typeof inputObject === 'number' || typeof inputObject === 'boolean') return inputObject;

  // Initialize an empty object to store filtered keys and values
  const filteredObject = {};

  // Iterate through the keys of the input object
  for (const key in inputObject) {
    // Check if the key is a direct property of the inputObject
    if (inputObject.hasOwnProperty(key)) {
      // Check if the key starts with '_' and the value is 'number' or 'boolean'
      if (key.startsWith('_') && (inputObject[key] === 'number' || inputObject[key] === 'boolean')) {
        // Remove the underscore prefix and split the key by '-'
        const keyWithout_ = key.substring(1).split('-');

        // Check if the modified key is longer than 0 and ends with 'Type'
        if (keyWithout_.length > 0 && keyWithout_[keyWithout_.length - 1] === 'Type') {
          // Check if the first part of the modified key exists as a key in the inputObject
          if (keyWithout_[0] in inputObject && inputObject[keyWithout_[0]].trim() !== '') {
            // Create a new key without '_' and add the modified value to the filteredObject
            filteredObject[keyWithout_[0]] = `~${inputObject[keyWithout_[0]]}~`;
          } else if (keyWithout_[0] in inputObject && inputObject[keyWithout_[0]].trim() === '') {
            delete inputObject[keyWithout_[0]];
          }
        }
      }
      // Check if the key is not already added to the filteredObject
      if (!filteredObject.hasOwnProperty(key)) {
        // Recursively call the function on the nested object and assign the result to the filteredObject
        filteredObject[key] = removereplaceKeyWithUnderscoreForPlugin(inputObject[key]);
      }
    }
  }
  // Return the filtered object with modified keys
  return filteredObject;
}

function replaceQuotesForPlugin(input) {
  // Replace all double quotes and backticks with single backticks.
  return input.replace(/`~(.*?)~`(?!:)/g, '$1');
}

function replaceQuotesWithBackticks(obj) {
  if (typeof obj === 'string') {
    return `\`${obj}\``;
  }
  if (Array.isArray(obj)) {
    // Iterate over the array and replace all double quotes in each element.
    return obj.map(replaceQuotesWithBackticks);
  }

  if (typeof obj === 'object' && obj != null) {
    // Iterate over the dictionary and replace all double quotes in each value.
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = replaceQuotesWithBackticks(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

function replaceQuotes(string) {
  // Replace all double quotes and backticks with single backticks.
  return string.replace(/"(`.*?`)"(?!:)/g, '$1');
}
const usedVariblesToBeIgnore = ['context.authData', 'context.inputData'];
const usedVariableToBeIgnoreIfStringIsSame = ['context'];

export function getUpdateUsedVariableForPlugin(usedVariable, slugName, inputFieldJson = {}) {
  if (!usedVariable) usedVariable = {};
  if (!usedVariable.plugin) usedVariable.plugin = {};

  usedVariable.plugin[slugName] = inputFieldJson;
}

function getUsedVariables(allused_variables, functionId, codeString) {
  const regex = /(context[.\w?[\]]*)/g;
  codeString = codeString?.replace(/\?./g, '.'); //  remove optional chaining
  let previousUsedVariable = allused_variables.functions[functionId] || [];
  const matches = codeString?.match(regex);
  const uniqueMatchesSet = new Set(matches);
  usedVariblesToBeIgnore.forEach((usedVaribleToBeIgnore) => uniqueMatchesSet.forEach((value) => {
    if (value.startsWith(usedVaribleToBeIgnore)) uniqueMatchesSet.delete(value);
  }));
  usedVariableToBeIgnoreIfStringIsSame.forEach((usedVaribleToBeIgnore) => uniqueMatchesSet.forEach((value) => {
    if (value === usedVaribleToBeIgnore) uniqueMatchesSet.delete(value);
  }));
  const uniqueMatches = Array.from(uniqueMatchesSet); // Remove duplicate matches
  previousUsedVariable = previousUsedVariable.filter((val) => !uniqueMatches.includes(val)); // variables to delelte

  previousUsedVariable.forEach((variable) => {
    const variableMetadata = allused_variables.variables[variable];
    variableMetadata.usedInFunctions = variableMetadata.usedInFunctions.filter((funId) => funId !== functionId);
    if (variableMetadata.usedInFunctions.length === 0) {
      delete allused_variables.variables[variable];
    }
  }); // delete variable that are not being used in fucntion
  allused_variables.functions[functionId] = uniqueMatches;
  uniqueMatches.forEach((variable) => {
    const variableMetadata = allused_variables.variables[variable];
    if (variableMetadata) {
      if (variableMetadata.usedInFunctions.includes(functionId)) return;
      variableMetadata.usedInFunctions = [...variableMetadata.usedInFunctions, functionId];
    } else {
      allused_variables.variables[variable] = {
        usedInFunctions: [functionId],
        type: 'string',
      };
    }
  });
  const payloadData = createJsonUsingUsedVariable(allused_variables); // This creates a payload json for Embed user.
  allused_variables.payloadData = payloadData;
  return allused_variables;
}

function removeUsedVariables(allused_variables, functionId) {
  const functionVariables = allused_variables.functions[functionId] || [];
  functionVariables.forEach((variable) => {
    const variableMetadata = allused_variables.variables[variable];
    variableMetadata.usedInFunctions = variableMetadata.usedInFunctions.filter((funId) => funId !== functionId);
    if (variableMetadata.usedInFunctions.length === 0) {
      delete allused_variables.variables[variable];
    }
  });
  delete allused_variables.functions[functionId];
  const payloadData = createJsonUsingUsedVariable(allused_variables); // This creates a payload json for Embed user.
  allused_variables.payloadData = payloadData;
  if (allused_variables?.plugin?.[functionId]) delete allused_variables.plugin[functionId];
  return allused_variables;
}

function incrementIntAndFloat(inputString) {
  const parts = inputString.split('.');
  if (parts.length >= 2) {
    const decimalPart = parseInt(parts[1], 10) + 1;
    const resultString = `${parts[0]}.${decimalPart}.0`;
    return resultString;
  }
  return `${(parseInt(inputString, 10) + 0.1).toString()}.0`;
}

const incrementDraftVersioning = (inputString) => {
  if (typeof inputString === 'number') {
    inputString = `${inputString}`;
  }
  const parts = inputString?.split('.');
  if (parts?.length === 3) {
    const decimalPart = parseInt(parts[2], 10) + 1;
    const resultString = `${parts[0]}.${parts[1]}.${decimalPart}`;
    return resultString;
  }
  if (parts?.length === 2) {
    return `${inputString}.1`;
  }
  if (parts?.length === 1) {
    return `${inputString}.1.1`;
  }
  return '0.1.1';
};

function duplicateFunctionInDBwithPluginFilter(data, duplicateFunctionPayload, newFunctionIdentifier) {
  delete data?.dataValues?.identifier;
  delete data?.dataValues?.id;
  delete data?.dataValues?.createdAt;
  delete data?.dataValues?.updatedAt;

  let parsedData = data?.dataValues?.published_code;
  if (data.type === 'plugin') {
    parsedData = JSON.parse(parsedData);
    parsedData.selectedValues = {};
    data.code = JSON.stringify(parsedData);
    data.published_code = JSON.stringify(parsedData);
    delete data?.dataValues?.auth_id;
  } else { // type : {function, api};
    data.code = parsedData;
  }

  return {
    ...(data.dataValues),
    identifier: newFunctionIdentifier, // function identifier
    ...duplicateFunctionPayload,
  };
}

function isEqual(oldValue, newValue) {
  if (oldValue === newValue) return true;

  if (oldValue === null || oldValue === undefined || newValue === null || newValue === undefined) {
    return false;
  }

  const typeOfOldValue = typeof oldValue;
  const typeOfNewValue = typeof newValue;

  if (typeOfOldValue !== typeOfNewValue) return false;

  if (typeOfOldValue === 'object') {
    const keys1 = Object.keys(oldValue);
    const keys2 = Object.keys(newValue);

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) => isEqual(oldValue[key], newValue[key]));
  }

  if (Array.isArray(oldValue)) {
    if (!Array.isArray(newValue) || oldValue.length !== newValue.length) return false;

    return oldValue.every((item, index) => isEqual(item, newValue[index]));
  }

  return false;
}

function hasLoopsOrDuplicate(order) {
  const visited = new Set();
  const dfs = (node) => {
    if (visited.has(node) || node === '') {
      return true;
    }

    visited.add(node);

    if (order[node]) {
      for (let i = 0; i < order[node].length; i++) {
        const child = order[node][i];
        if (dfs(child)) {
          return true;
        }
      }
    }
    return false;
  };

  for (const key in order) {
    if (!visited.has(key)) {
      if (dfs(key)) {
        return true;
      }
    }
  }
  return false;
}

function getStepOrderArray(order) {
  const stepOrderArr = new Set();
  const processNode = (nodeId) => {
    stepOrderArr.add(nodeId);

    if (order[nodeId]) {
      order[nodeId].forEach((childId) => {
        processNode(childId);
      });
    }
  };
  order?.root?.forEach((id) => {
    if (order?.[id]) processNode(id);
    else stepOrderArr.add(id);
  });
  return stepOrderArr;
}

function deleteKeysFromBlocksNotInOrder(stepOrderArr, blocks) {
  for (const key in blocks) {
    if (!stepOrderArr.has(key) && key !== 'response') {
      delete blocks[key];
    }
  }
}

function deleteFromOrder(order, blocks) {
  for (const key in order) {
    if (!blocks[key] && key !== 'root') {
      delete order[key];
    }
  }

  for (const key in order) {
    if (order.hasOwnProperty(key)) {
      order[key] = order[key].filter((value) => blocks[value]);
    }
  }
}

const validateOrder = (order, blocks) => {
  const isUnhealthyOrder = hasLoopsOrDuplicate(order);
  if (!isUnhealthyOrder) {
    const stepOrderArr = getStepOrderArray(order);
    deleteKeysFromBlocksNotInOrder(stepOrderArr, blocks);
    deleteFromOrder(order, blocks);
    return true;
  }
  return false;
};

const replaceFromOrder = (oldValue, newValue, order, root = 'root') => {
  for (let i = 0; i < order[root].length; i++) {
    if (order[root][i] === oldValue) {
      order[root][i] = newValue;
      break;
    } else if (order.hasOwnProperty(order[root][i])) {
      replaceFromOrder(oldValue, newValue, order, order[root][i]);
    }
  }
};
const createJsonUsingUsedVariable = (usedVariables) => {
  const paths = Object.keys(usedVariables?.variables) || [];
  const jsonObject = {};
  paths.forEach((path) => {
    _.set(jsonObject, path, 'your_value_here');
  });
  return jsonObject;
};

function convertDoubleQuotesToSingleQuotes(inputString) {
  // Use regular expression to replace double quotes around square brackets with single quotes
  const modifiedString = inputString.replace(/\[\\"([^\\"]+)\\"\]/g, "['$1']");
  return modifiedString;
}

function replaceSpacesWithUnderscore(inputString) {
  return inputString.replace(/ /g, '_');
}
function calculatePercentageDeviation(arr, fourthNumber) {
  // Calculate the average
  const average = arr.reduce((acc, curr) => acc + curr, 0) / arr.length;
  // Find the absolute difference between the average and other number
  const difference = Math.abs(average - fourthNumber);
  // Calculate the percentage deviation
  const percentageDeviation = (difference / average) * 100;
  return { percentageDeviation, average };
}

const parseCsv = (csvBuffer) => new Promise((resolve, reject) => {
  const parsedData = [];
  const csvStream = csvParser()
    .on('data', (row) => {
      row.id = parseInt(row.id, 10);
      row.is_block = parseInt(row.is_block, 10);
      row.client_id = parseInt(row.client_id, 10);
      row.mobile = parseInt(row.mobile, 10);

      parsedData.push(row);
    })
    .on('end', () => {
      console.log('CSV parsing complete');
      // console.log('Parsed Data:', parsedData);
      resolve(parsedData);
    })
    .on('error', (error) => {
      console.error('Error parsing CSV:', error.message);
      reject(error);
    });

  const readableStream = new Readable();
  readableStream.push(csvBuffer);
  readableStream.push(null);

  readableStream.pipe(csvStream);
});

export function objectToQueryParams(obj) {
  return Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

export function getUniqueField(input) {
  if (!input) return null;
  return encrypt(JSON.stringify(input));
}
export function encryptString(input) {
  input = input?.toString();
  const specialCharMap = { '!': 'A', '@': 'B', '#': 'C', $: 'D', '%': 'E', '^': 'F', '&': 'G', '*': 'H', '(': 'I', ')': 'J', '-': 'K', _: 'L', '=': 'M', '+': 'N', '[': 'O', ']': 'P', '{': 'Q', '}': 'R', ';': 'S', ':': 'T', '\'': 'U', '"': 'V', ',': 'W', '.': 'X', '/': 'Y', '?': 'Z', '<': 'AA', '>': 'AAA', '|': 'LLL' };
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const specialChars = Object.keys(specialCharMap).map(escapeRegExp).join('');
  const regex = new RegExp(`[${specialChars}]`, 'g');
  return input.toUpperCase().replace(regex, (match) => specialCharMap[match] || match);
}

export function delay(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), time);
  });
}

export {
  generateIdentifier,
  removeUsedVariables,
  getUsedVariables,
  prepareSuccessResponse,
  prepareErrorResponse,
  validateResponse,
  addVariableIntoCode,
  checkCodeValidity,
  formatedData,
  sendAlert,
  sendAlertOnLogs,
  formatDateTime,
  makeCronRequest,
  removeCircularReferences,
  getAccessToken,
  encrypt,
  decrypt,
  // returnDecryptedBasicAuthData,
  maskString,
  removeKeyWithUnderscore,
  replaceQuotesWithBackticks,
  successResponseForDeleteCreateUpdate,
  replaceQuotes,
  elasticPrepareSuccessResponse,
  incrementIntAndFloat,
  incrementDraftVersioning,
  successResponseForDeleteCreateUpdateStep,
  duplicateFunctionInDBwithPluginFilter,
  isEqual,
  replaceFromOrder,
  validateOrder,
  createJsonUsingUsedVariable,
  removereplaceKeyWithUnderscoreForPlugin,
  replaceQuotesForPlugin,
  evalVariableAndCodeFromContext,
  convertDoubleQuotesToSingleQuotes,
  replaceSpacesWithUnderscore,
  parseCsv,
  calculatePercentageDeviation,
};
