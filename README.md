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

//specify a query against the default field passing it to console.log
processDocs('yellow')

//specify a query against the default field, return authors, specifying q explicitly, (alongside other parameters in querySpec) 
processDocs({ rows: 2, q: 'yellow'}, doc => doc.author)

//specify a query against a fieldName explicitly
processDocs({ rows: 1000, q: { author: 'poe' }}, doc => doc.title)

```

For example the last invocation looks like this in an interactive REPL shell.

```
js > processDocs({ rows: 1000, q: { author: 'poe' }}, doc => doc.title)
[
  'The Works of Edgar Allan Poe — Volume 1',
  'The Works of Edgar Allan Poe — Volume 2',
  'The Fall of the House of Usher',
  'The Raven',
  'The Works of Edgar Allan Poe — Volume 3',
  'The Works of Edgar Allan Poe — Volume 5',
  'The Works of Edgar Allan Poe — Volume 4',
  'The Complete Poetical Works of Edgar Allan Poe: Including Essays on Poetry'
]
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

### Mapping documents 

If your callback produces a defined result, you can see the mapped results

```js
processDocs('{!mlt qf=subjects mintf=1 v="345"}', doc=>doc.title)

processDocs('({!mlt qf=subjects mintf=1 v="345"})({!edismax pf=author qf=author v="edgar allen poe"})', doc=>doc.author)

processDocs({q:'yellow',bq:['king^100','wallpaper^0.1']}, doc=>doc.title)

```

### Accessing body content

Sometimes the results aren't in the body.response.docs but somewhere else.

You can process the body in a different way, for example a grouped query might look like this...

```js
processBody({q:'man',group:true,"group.field":'author'}, body => body.grouped.author.groups)
```

Which results in the following in an interactive session

```sh
js > processBody({q:'man',group:true,"group.field":'author_s'}, body => body.grouped.author_s.groups)
[
  { groupValue: 'Shaw, Bernard', doclist: [Object] },
  { groupValue: 'Shaara, Michael', doclist: [Object] },
  { groupValue: 'Smith, Evelyn E.', doclist: [Object] },
  { groupValue: 'Wesley, Joseph', doclist: [Object] },
  { groupValue: 'Allen, James', doclist: [Object] },
  { groupValue: 'Wilde, Oscar', doclist: [Object] },
  { groupValue: 'Wallace, F. L. (Floyd L.)', doclist: [Object] },
  { groupValue: 'Twain, Mark', doclist: [Object] },
  { groupValue: 'Dumas, Alexandre', doclist: [Object] },
  { groupValue: 'Dick, Philip K.', doclist: [Object] }
]
```