import jwt from "jsonwebtoken";
require('dotenv').config();
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
// function generateAuthToken(data) {
//   const token = jwt.sign({
//     data
//   }, process.env.JWT_TOKEN_SECRET);
//   return token;
// }
export default {
  removeCircularReferences,
  // generateAuthToken
};