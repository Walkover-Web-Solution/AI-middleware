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
  static decrypt(text) {
    if (!text || text == "") return "";
    const algorithm = process.env.ALGORITHM;
    const iv = crypto.createHash('sha512').update(process.env.Secret_IV).digest('hex').substring(0, 16);
    const key = crypto.createHash('sha512').update(process.env.Encreaption_key).digest('hex').substring(0, 32);
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
  static updateConfiguration = (prev_configuration, configuration) => {
    for (let key in prev_configuration) {
      prev_configuration[key] = key in configuration ? configuration[key] : prev_configuration[key];
    }
    for (let key in configuration) {
      prev_configuration[key] = configuration[key];
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