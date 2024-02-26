const { Client } = require('@elastic/elasticsearch')

async function handleElasticQuery(dbCredentials, query) {
    const client = new Client({
      node: dbCredentials?.node,
      auth: {
        apiKey: dbCredentials?.apiKey
      }
    })
    try {
        const result = await client.sql.query({
        query: query
        })
        return result
  
    } catch (error) {
      console.error('Error', error);
      throw error
  
    } finally {
      await client.close();
    }
}

async function createIndex(dbCredentials, propertiesObj) {
    const client = new Client({
      node: dbCredentials?.node,
      auth: {
        apiKey: dbCredentials?.apiKey
      }
    })
    try {
        const result = await client.indices.create(propertiesObj)
        return result
  
    } catch (error) {
      console.error('Error', error);
      throw error
  
    } finally {
      await client.close();
    }

  //   {
  //     "dbCredentials": {
          // "apiKey": "essu_ZUZwb1dtSlpkMEpUVFRodmNtOVROREphWVVVNlJ6QnVRVk4xTFhSU1IzbFpiVkZVZWxONGJrbEVadz09AAAAACoRO7M=",
          // "node":"https://5e2261b75cda467da9c4bd743a51ab1f.us-central1.gcp.cloud.es.io"
  //     },
  //     "propertiesObj": {
  //         "index":"hello_hii_test",
  //     "body":{
  //       "mappings": {
  //         "properties": {
  //           "id": { "type": "integer" },
  //           "text": { "type": "text" },
  //           "user": { "type": "keyword" },
  //           "time": { "type": "date" }
  //         }
  //       }
  //     }
  //     }
  // }
  
}

async function getIndices(dbCredentials) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })
  try {
      const result = await client.cat.indices({ format: 'json' });
      const userIndices = result.filter(index => !index.index.startsWith('.'));
      return userIndices

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

async function createDocument(dbCredentials, propertiesObj) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })
  try {
      const result = await client.index(propertiesObj)
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }

//   {
//     "dbCredentials": {
        // "apiKey": "Y0FlOUpJd0JLVU9adkJpX3N1MlY6N2pTU00tS01SeldaSGs0RWhWbjZ2QQ==",
        // "node":"https://188e7f42007f419fb40f78728f26ad0f.us-central1.gcp.cloud.es.io"
//     },
//     "propertiesObj": {
//         "index":"hello_hii_test",
//         "id":"meriId", // optional
//         "document": {
//           "id": 112,
//           "text": "hello guys",
//           "user": "arpit"
//         }
//     }
// }

}

async function testConnection(dbCredentials) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })
  try {
      const result = await client.info()
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

async function deleteIndex(dbCredentials, propertiesObj) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })
  try {
      const result = await client.indices.delete(propertiesObj)
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

async function deleteDocument(dbCredentials, propertiesObj) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })
  try {
      const result = await client.delete(propertiesObj)
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }

//   {
//     "dbCredentials": {
//         "apiKey": "OWNwQ2NZd0JiOVl6Ukc5RW55S3Q6RjJ6SG1DZVlUeWk5aXRGZm1MS2o0dw==",
//         "node":"https://5e2261b75cda467da9c4bd743a51ab1f.us-central1.gcp.cloud.es.io"
//     },
//     "propertiesObj": {
//         "index":"test_again",
//         "id":"meriId"
//     }
// }

}

async function bulkDeleteDocuments(dbCredentials, indexName, documentIds) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })

  const body = documentIds.map(id => ({ delete: { _index: indexName, _id: id } }))

  try {
      const result = await client.bulk({ refresh: true, body })
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

// Example usage:
// bulkDeleteDocuments(dbCredentials, 'my_index', ['1', '2'])

async function bulkAddDocuments(dbCredentials, indexName, documents) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })

  const body = documents.flatMap(doc => [{ index: { _index: indexName } }, doc])

  try {
      const result = await client.bulk({ refresh: true, body })
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

// Example usage:
// bulkAddDocuments(dbCredentials, 'my_index', [{ id: 1, text: 'Document 1' }, { id: 2, text: 'Document 2' }])


async function bulkAddDocumentsWithDocumentId(dbCredentials, indexName, documents) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })

  const body = documents.flatMap(doc => [{ index: { _index: indexName, _id: doc.id } }, doc])

  try {
      const result = await client.bulk({ body })
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

// Example usage:
// bulkAddDocuments(dbCredentials, 'my_index', [{ id: '1', text: 'Document 1' }, { id: '2', text: 'Document 2' }])


async function updateDocument(dbCredentials, propertiesObj) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })
  try {
      const result = await client.update(propertiesObj)
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }

//   {
//     "dbCredentials": {
        // "apiKey": "Y0FlOUpJd0JLVU9adkJpX3N1MlY6N2pTU00tS01SeldaSGs0RWhWbjZ2QQ==",
        // "node":"https://188e7f42007f419fb40f78728f26ad0f.us-central1.gcp.cloud.es.io"
//     },
//     "propertiesObj": {
//         "index":"hello_hii_test",
//         "id":"meriId", // the id of the document to be updated
//         "body": {
//           "doc": {
//             "text": "updated text" // the fields to be updated
//           }
//         }
//     }
// }

}

async function bulkUpdateDocuments(dbCredentials, indexName, updates) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })

  const body = updates.flatMap(update => [
    { update: { _index: indexName, _id: update.id } },
    { doc: update.doc }
  ])

  try {
      const result = await client.bulk({ refresh: true, body })
      return result

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

// Example usage:
// bulkUpdateDocuments(dbCredentials, 'my_index', [
//   { id: '1', doc: { text: 'Updated Document 1' } },
//   { id: '2', doc: { text: 'Updated Document 2' } }
// ])


async function fuzzySearch(dbCredentials, propertiesObj) {
  const client = new Client({
    node: dbCredentials?.node,
    auth: {
      apiKey: dbCredentials?.apiKey
    }
  })

  try {
    const result = await client.search({
      index: propertiesObj?.index,
      body: {
        query: {
          fuzzy: {
            [propertiesObj?.field]: {
              value: propertiesObj?.statement,
              fuzziness: propertiesObj?.fuzziness || 1
            }
          }
        }
      }
    })
    return result?.hits.hits

  } catch (error) {
    console.error('Error :', error);
    throw error

  } finally {
    await client.close();
  }
}

// Example usage:
// fuzzySearch(dbCredentials, 'my_index', 'text', 'helo')
// {
//   "dbCredentials": {
//       "apiKey": "OWNwQ2NZd0JiOVl6Ukc5RW55S3Q6RjJ6SG1DZVlUeWk5aXRGZm1MS2o0dw==",
//       "node": "https://5e2261b75cda467da9c4bd743a51ab1f.us-central1.gcp.cloud.es.io"
//   },
//   "propertiesObj": {
//       "index": "hello_hii_test",
//       "field": "hello",
//       "statement": "jigy",
//       "fuzziness": 2
//   }
// }

module.exports={
    handleElasticQuery,
    createIndex,
    getIndices,
    createDocument,
    testConnection,
    deleteIndex,
    deleteDocument,
    bulkDeleteDocuments,
    bulkAddDocuments,
    bulkAddDocumentsWithDocumentId,
    updateDocument,
    bulkUpdateDocuments, 
    fuzzySearch
}