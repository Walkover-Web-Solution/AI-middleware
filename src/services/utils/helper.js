import crypto from "crypto";
class Helper {
  static encrypt(text) {
    const algorithm = process.env.ALGORITHM;
    const iv = crypto.createHash('sha512').update(process.env.Secret_IV).digest('hex').substring(0, 16);
    const key = crypto.createHash('sha512').update(process.env.Encreaption_key).digest('hex').substring(0, 32);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  static decrypt(encryptedText) {
    let token = null;
    const encryptionKey = process.env.Encreaption_key;
    const secretIv = process.env.Secret_IV;

    const iv = crypto.createHash('sha512').update(secretIv).digest('hex').substring(0, 16);
    const key = crypto.createHash('sha512').update(encryptionKey).digest('hex').substring(0, 32);

    const encryptedTextBytes = Buffer.from(encryptedText, 'hex');
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
      let decryptedBytes = Buffer.concat([decipher.update(encryptedTextBytes), decipher.final()]);
      token = decryptedBytes.toString('utf8');
    } catch {
      const decipher = crypto.createDecipheriv('aes-256-cfb', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
      let decryptedBytes = Buffer.concat([decipher.update(encryptedTextBytes), decipher.final()]);
      token = decryptedBytes.toString('utf8');
    }
    return token;
  }
  static maskApiKey = (key) => {
    if (!key) return '';
    if (key.length > 4) {
        return key.slice(0, 2) + '*'.repeat(key.length - 4) + key.slice(-2);
    }
    return '*'.repeat(key.length);
  }
  static updateConfiguration = (prev_configuration, configuration) => {
    for (let key in prev_configuration) {
      prev_configuration[key] = key in configuration ? configuration[key] : prev_configuration[key];
    }
    for (let key in configuration) {
      prev_configuration[key] = configuration[key];
    }
    if(prev_configuration["tools"]?.length===0){
       delete prev_configuration["tools"];
    }
    return prev_configuration;
  };
  static replaceVariablesInPrompt = (prompt, variables) => {
    if (variables && Object.keys(variables).length > 0) {
      Object.entries(variables).forEach(([key, value]) => {
        const stringValue = JSON.stringify(value);
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        prompt = prompt.map(item => {
          if (item && "content" in item) {
            item.content = item.content.replace(regex, stringValue);
          }
          return item;
        });
      });
    }
    return prompt;
  };
  
  static parseJson = (jsonString) => {
    try {
      return{success: true, json: JSON.parse(jsonString)};
    } catch (error) {
      return {success: false, error: error.message};
    }
  };
}
export default Helper;