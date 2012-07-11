var test = require('tap').test;
var seaport = require('seaport');
var pier = require('../');

test('up and down', function (t) {
    t.plan(10);
    var port = Math.floor(1e4 + 5e4 * Math.random());
    
    var server = seaport.createServer().listen(port);
    var cache = pier().tie(port);
    var ports = seaport.connect(port);
    
    t.on('end', function () {
        console.log('end');
        ports.close();
        server.close();
        cache.close();
    });
    
    setTimeout(function () {
        t.same([], cache.query());
        ports.assume('beep', 9999);
        
        function cmp (records) {
            t.equal(records.length, 1);
            t.equal(records[0].host, '127.0.0.1');
            t.equal(records[0].port, 9999);
            t.equal(records[0].role, 'beep');
        }
        cache.once('update', function (records) {
            cmp(records);
            cmp(cache.query('beep'));
            
            cache.once('update', function (records) {
                t.same(records, []);
            });
            ports.free({ role : 'beep', port : 9999 });
        });
    }, 100);
});
