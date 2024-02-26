// const models = require('../../models/index.js')

// async function createBulk(data) {
//   return await models.configuration.bulkCreate(data);
// }
// async function find(org_id,id) {
//   const configurations = await models.configuration.findOne({
//     attributes: [['message', 'content'], ['message_by', 'role']],
//     where: {
//         id:id,
//         org_id,
//     },
//     order: [
//       ['createdAt', 'DESC'],
//     ],
//     raw: true
//   });

//   // If you want to return the result directly
//   return configurations;
// }

// // Find All configuration db Service
// async function findAllBridges(org_id) {
//   const bridges = await models.configuration.findAll({
//     where: {
//       org_id
//     },
//     order: [
//       ['createdAt', 'ASC'],
//     ]
//   });

//   // If you want to return the result directly
//   return bridges;
// }
// module.exports = {
//   find,
//   createBulk,
//   findAllBridges
// }