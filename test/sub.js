var test = require('tap').test;
var seaport = require('seaport');
var pier = require('../');

test('up and down', function (t) {
    t.plan(16);
    var port = Math.floor(1e4 + 5e4 * Math.random());
    
    var server = seaport.createServer().listen(port);
    var cache = pier('beep').tie(port);
    var ports = seaport.connect(port);
    
    t.on('end', function () {
        console.log('end');
        ports.close();
        server.close();
        cache.close();
    });
    
    setTimeout(function () {
        t.same([], cache.query());
        ports.assume('robots', 9996);
        ports.assume('boop', 9997);
        ports.assume('beep', 9998);
        ports.assume('beep', 9999);
        
        function cmp (records) {
            t.equal(records.length, 2);
            
            t.equal(records[0].host, '127.0.0.1');
            t.equal(records[0].port, 9998);
            t.equal(records[0].role, 'beep');
            
            t.equal(records[1].host, '127.0.0.1');
            t.equal(records[1].port, 9999);
            t.equal(records[1].role, 'beep');
        }
        var pending0 = 2;
        cache.on('update', function fn (records) {
            if (--pending0 !== 0) return;
            cache.removeListener('update', fn);
            
            cmp(records);
            cmp(cache.query('beep'));
            
            var pending1 = 2;
            cache.on('update', function fn (records) {
                if (--pending1 !== 0) return;
                cache.removeListener('update', fn);
                t.same(records, []);
            });
            ports.free({ role : 'beep', port : 9998 });
            ports.free({ role : 'beep', port : 9999 });
        });
    }, 100);
});
