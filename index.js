const request = require('request')
const util = require('util')
const bluebird = require('bluebird')
const {
  promisify
} = util

const getAsync = promisify(request.get)

// Globals intended to be manipulated from within a REPL session

let server = {
  host: 'localhost',
  port: '8983',
  core: 'books',
}

let defaultQuerySpec = {
  defType: "edismax",
  debug: "all",
  wt: 'json',
  indent: 'true',
  fl: "*,[explain]"
}

let verbose = false

/** Triggers a HTTP GET with a timeout. 
 * @param {*} getUrl a HTTP GET url */
async function httpGet(getUrl, patienceMs = 4000) {
  return getAsync(getUrl) //.timeout(patienceMs)
}

/** Gets the body from a HTTP response. 
 * @param {*} getUrl a HTTP GET url */
async function extractBody(getUrl) {
  return httpGet(getUrl).then(({
    statusCode,
    body
  }) => {
    if (statusCode == '200') {
      let bodyObj = JSON.parse(body)
      return bodyObj
    } else {
      throw statusCode
    }
  })
}

/** Prefixes a paramString with the query endpoint URL
 * @param {*} paramString 
 */
function createSolrUrl(paramString) {
  return `http://${server.host}:${server.port}/solr/${server.core}/select` + paramString
}

/** Merges a map of query params with a default map
 * and constructs a SOLR parameter string for that query.
 * @param {*} querySpec A map of query parameters
 * The 'q' value  may be a string or a map of term clauses by fieldName.
 * All other parameters are just passed on.
 */
function createParamString(querySpec) {

  if (typeof querySpec == 'string') {
    querySpec = {
      q: querySpec
    }
  }

  //merge default params
  querySpec = Object.assign({}, defaultQuerySpec, querySpec)

  //check required values
  if (!('q' in querySpec)) {
    throw new Error(` querySpec needs a 'q' value`)
  }

  //serialise key:value pairs for URL
  queryPairs = []
  for (let entryName in querySpec) {
    let entryValue = querySpec[entryName]
    if (Array.isArray(entryValue)) {
      for (let childValue of entryValue) {
        queryPairs.push(`${entryName}=${childValue}`)
      }
    } else if (entryName == 'q' && typeof querySpec.q == 'object') {
      let fieldPairs = []
      for (let fieldName in querySpec.q) {
        if (fieldName) { //string: field name to match 
          fieldPairs.push(`${fieldName}:${querySpec.q[fieldName]}`)
        } else { //empty string = match default field
          fieldPairs.push(`${querySpec.q[fieldName]}`)
        }
      }
      queryPairs.push(`q=${fieldPairs.join(" ")}`)
    } else {
      queryPairs.push(`${entryName}=${entryValue}`)
    }
  }
  return `?${queryPairs.join("&")}`
}

/** Attempts to extract docs given a map of query parameters
 * @param {*} queryUrl */
async function extractDocs(queryUrl) {
  return extractBody(queryUrl).then(body => body.response.docs)
}

/** Returns the body of the HTTP response for a given query
 * @param {*} querySpec A map of query parameters (see createParamString())
 */
async function getResultsBody(querySpec) {
  let paramString = createParamString(querySpec)
  let queryUrl = createSolrUrl(paramString)
  if (verbose) console.log(`Loading ${queryUrl}`)
  return await extractBody(queryUrl)
}

/** Passes the result body to a callback function
 * @param {*} querySpec A map of query parameters (see createParamString())
 * @param {*} cb A function which will be passed each document in turn (defaults to console.log)
 */
async function processBody(querySpec, cb = console.log) {
  let body = await getResultsBody(querySpec)
  return cb(body)
}

/** Passes each doc to a callback function
 * @param {*} querySpec A map of query parameters (see createParamString())
 * @param {*} cb A function which will be passed each document in turn (defaults to console.log)
 */
async function processDocs(querySpec, cb = console.log) {
  let body = await getResultsBody(querySpec)
  let mapEmpty = true
  let mapped = []
  for (doc of body.response.docs) {
    let result = cb(doc)
    if (typeof result !== 'undefined') mapEmpty = false
    mapped.push(result)
  }
  if (!mapEmpty) return mapped
}