var crypto = require('crypto');
var assert = require('assert');

class Helper {
    static encrypt(text) {
        const algorithm=process.env.ALGORITHM;

        const iv = crypto
            .createHash('sha512')
            .update(process.env.Secret_IV)
            .digest('hex')
            .substring(0, 16)
        const key = crypto.createHash('sha512').update(process.env.Encreaption_key).digest('hex').substring(0, 32);
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    static decrypt(text) {
        if (!text || text == "") return "";
        const algorithm=process.env.ALGORITHM;
        const iv = crypto
        .createHash('sha512')
        .update(process.env.Secret_IV)
        .digest('hex')
        .substring(0, 16)
        const key = crypto.createHash('sha512').update(process.env.Encreaption_key).digest('hex').substring(0, 32);
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
}

module.exports = Helper