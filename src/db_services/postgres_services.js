const {Client} = require('pg')

async function handlePostgresQuery(dbCredentials, query) {
  const client = new Client(dbCredentials);
  try {
      await client.connect();
      const result = await client.query(query);
      console.log(result)
      // await client.end();

    return result.rows;

  } catch (error) {
    console.error('Error::', error.code);
    let httpStatusCode = 400
    if (error.code === '28P01' || error.code === '3D000') {
      httpStatusCode = 401
    }

    throw { message: error.message, code: error.code, statusCode: httpStatusCode, success: false };

  } finally {
    await client.end();
  }
}
module.exports={
handlePostgresQuery
}
