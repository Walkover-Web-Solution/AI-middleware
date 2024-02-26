require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { generateAuthToken } = require('../../utilities');
const jwt = require('jsonwebtoken');


const client = new MongoClient(process.env.MONGODB_CONNECTION_URI,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
)
const db = client.db(process.env.MONGODB_DATABASE_NAME); 

async function storeUserAndCreateCollection(body) {

  try {
    await client.connect()
    const collectionName = `${body?.orgId}_${body?.collectionName}`
    const token = generateAuthToken(collectionName)
    const userDoc = {
      userId: body?.userId,
      orgId: body?.orgId,
      collectionName,
      token
    }
    const database = client.db(process.env.MONGODB_USER_DATABASE); 
    const collection = database.collection(process.env.MONGODB_USER_DATABASE_COLLECTION);
    await collection.insertOne(userDoc);
    await db.createCollection(collectionName)
    return token
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function decodeTokenjwt(body){
  try {
    const decoded = jwt.verify(body?.code, process.env.JWT_TOKEN_SECRET);
    return decoded
  } catch (error) {
    console.log(error)
    throw error
  }
}

async function testConnection() {

  try {
    await client.connect()
    return await db.command({ ping: 1 });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function createNewCollection(body) {

  try {
    await client.connect()
    await db.createCollection(body?.collectionName);
    return {status: 'ok', message: 'collection created successfully'}
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function getAllCollectionsStartsWithOrgId(body) {

  try {
    await client.connect()
    const collectionsInfo = await db.listCollections().toArray();

    const collectionsWithPattern = collectionsInfo.filter(
      collection => collection.name.startsWith(body?.orgId)
    );
    return collectionsWithPattern
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function createNewDocument(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const result = await collection.insertOne(body?.document);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function getAllDocuments(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const documents = await collection.find().toArray();
    return documents;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function getDocumentById(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const document = await collection.findOne({_id: new ObjectId(body?.documentId)});
    return document;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function getDocumentsByQuery(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const documents = await collection.find(body?.query).toArray();
    return documents
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function deleteCollection(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    await collection.drop();
    return {status: 'ok', message: 'collection deleted!'}
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function deleteDocumentsByQuery(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const result = await collection.deleteMany(body?.query);
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function deleteDocumentsById(body) {

  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const result = await collection.deleteOne({ _id: new ObjectId(body?.documentId) });
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function updateDocumentById(body) {
  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const result = await collection.updateOne({ _id: new ObjectId(body?.documentId) }, {$set: body?.document});
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}
// {
//   "documentId":"659cfa3f6f9bacebc2452905",
//   "document":{
//       "name":"Arpit update again"
//   }
// }

async function updateDocumentByQuery(body) {
  try {
    await client.connect()
    const collection = db.collection(body?.collectionName);
    const result = await collection.updateOne(body?.filter, {$set: body?.document});
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

module.exports = {
    testConnection,
    createNewCollection,
    getAllCollectionsStartsWithOrgId,
    createNewDocument,
    getAllDocuments,
    getDocumentById,
    getDocumentsByQuery,
    deleteCollection,
    deleteDocumentsByQuery,
    deleteDocumentsById,
    storeUserAndCreateCollection,
    decodeTokenjwt,
    updateDocumentById,
    updateDocumentByQuery
};