# sease-repl

Use Node REPL to trigger, display, process HTTP query results from SOLR

This is intended to be used interactively. 

First install using `npm install` from a console in this directory.

Then call `npm run start` and you should find yourself in a repl with the following
references defined...

* `processDocs(querySpec, callback)` : Calls your function once-per-doc against results of the specified query
* `defaultQuerySpec` : default query parameters added to any querySpec (modify these, you modify all future queries)
* `server`: details the server host, port, SOLR core name etc. (modify this, you modify the SOLR target)
* `verbose` : boolean flag to see detail of procedures

## Examples

### Simple invocations

This shows how to query in three different ways. Each doc in the query results is passed to console.log

```js

//specify a query against the default field 
processDocs('yellow', console.log)

//specify a query against the default field, specifying q explicitly, (alongside other parameters in querySpec) 
processDocs({ rows: 2, q: 'yellow'}, console.log)

//specify a query against a fieldName explicitly
processDocs({ rows: 2, q: { text_all: 'yellow' }}, console.log)

```

### More complex processing

This shows how to detail a fancier query structure, and a rendering function which pulls out and render specific details of each doc.

To run multi-line programs containing javascript blocks from the REPL, use the builtin .load or .editor command.

```js

verbose = true

querySpec = {
  q: {
    title: "yellow"
  },
  fl: "title,author,[explain]",
}

processDocs(querySpec, doc => {
  console.log(`${doc.title} ${doc.author} : ${doc['[explain]']}`)
})

```

### Setting defaults 

The values in defaultQuerySpec are merged in to every query. You can manipulate it
to change all future queries.

```js
defaultQuerySpec.fl = "title,author"
processDocs("man")
```


### Using a javascript closure

A common thing to do is have a closure over a value which means you can 
access some data which was stored or manipulated from within your callback
function. Here the callback function is a closure over the value `count` 
declared in the outer block.

```js
defaultQuerySpec.rows = 10000
var count = 0
processDocs("man", () => count++).then(() => {
  console.log(count)
})
```


// processDocs({
//   q: "({!dismax qf=subjects v='yellow'})({!dismax qf=title v='wallpaper'})",
// }, console.log)