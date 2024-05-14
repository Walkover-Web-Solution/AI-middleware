// import jwt from 'jsonwebtoken';
// // import { getOrganizationById } from '../services/proxyService.js';

// const InterfaceTokenDecode = async (req, res, next) => {
//   const token = req?.get('Authorization');
//   const { isAnonymousUser, interface_id } = req?.body;
//   if (!token && !isAnonymousUser) {
//     return res.status(498).json({ message: 'invalid token' });
//   }
//   if (isAnonymousUser) {
//     req.Interface = { interface_id };
//     return next();
//   }
//   try {
//     const decodedToken = jwt.decode(token);
//     let orgToken;
//     if (decodedToken) {
//       const orgTokenFromDb = await getOrganizationById(decodedToken.org_id);
//       orgToken = orgTokenFromDb?.meta?.auth_token;
//       if (orgToken) {
//         const checkToken = jwt.verify(token, orgToken);
//         if (checkToken) {
//           req.Interface = checkToken;
//           return next();
//         }
//         return res.status(404).json({ message: 'unauthorized user' });
//       }
//     }
//     return res.status(401).json({ message: 'unauthorized user 1', token });
//   } catch (err) {
//     console.error(err);
//     return res.status(401).json({ message: 'unauthorized user ', token });
//   }
// };
// const InterfaceAuth = async (req, res, next) => { // todo pending
//   let token = req?.get('Authorization');
//   token = token.split(' ')?.[1] || token;
//   if (!token) {
//     return res.status(498).json({ message: 'invalid token' });
//   }
//   try {
//     const decodedToken = jwt.decode(token);
//     if (decodedToken) {
//       const checkToken = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
//       if (checkToken) {
//         req.profile = checkToken;
//         if (!checkToken.user) req.profile.viewOnly = true;
//         return next();
//       }
//     }
//     return res.status(401).json({ message: 'unauthorized user' });
//   } catch (err) {
//     return res.status(401).json({ message: 'unauthorized user' });
//   }
// };

// export { InterfaceTokenDecode, InterfaceAuth };
