# pier

Replicate a
[seaport service registry](https://github.com/substack/seaport)
for fast local in-memory access or redundancy.

# example

``` js
var seaport = require('seaport');
var pier = require('pier');

var server = seaport.createServer().listen(7890);
var cache = pier().tie(7890);

setInterval(function () {
    console.dir(cache.query('beep'));
}, 1000);
```

***

first start the server/cache program:

```
$ node example/cache.js 
[]
[]
[ { host: '127.0.0.1', port: 9999, role: 'beep', version: '0.0.0' } ]
[ { host: '127.0.0.1', port: 9999, role: 'beep', version: '0.0.0' } ]
[]
[]
```

meanwhile, register and unregister some services:

```
$ node
> var ports = require('seaport').connect(7890)
> ports.assume('beep', 9999)
> ports.free({ role : 'beep', port : 9999 })
```

# methods

``` js
var pier = require('pier')
```

## var p = pier(query)

Create a new seaport server `p` with an optional semver `query` to filter the
local cache by.

## p.tie(ports), pier.tie(...)

Tie a remote seaport server given either the handle itself or the parameters
to pass to `seaport.connect(...)`.

Returns the local seaport caching server `p`.

# events

In addition to all the usual events that seaport servers emit
(`'assume'`, `'allocate'`, `'free'`), these extra events are emitted:

## p.on('ready', function (records) { /* ... */ })

Emitted when the initial recordset is ready. When the remote server is first
bound, a `query()` is issued against it to get the initial recordset.

## p.on('update', function (records) { /* ... */ })

Emitted when the recordset changes. If `query` was specified, the `records`
parameter will be filtered, otherwise `records` is the entire recordset.

# install

With [npm](http://npmjs.org) do:

```
npm install pier
```

# license

MIT
