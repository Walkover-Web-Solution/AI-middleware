var crypto = require('crypto');
var assert = require('assert');

class Helper {
    static encrypt(text) {
        const algorithm=process.env.ALGORITHM;
        const iv = process.env.Secret_IV;
        const key = process.env.Encreaption_key;
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    static decrypt(text) {
        if (!text || text == "") return "";
        const algorithm=process.env.ALGORITHM;
        const iv = process.env.Secret_IV;
        const key = process.env.Encreaption_key;
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
}

module.exports = Helper