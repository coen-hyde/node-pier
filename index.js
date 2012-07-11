var EventEmitter = require('events').EventEmitter;
var seaport = require('seaport');

module.exports = function (query) {
    var server = seaport.createServer();
    server.tie = tie.bind(null, server, query);
    return server;
};

function tie (server, query, ports) {
    if (typeof ports.query !== 'function') {
        ports = seaport.connect.apply(null, [].slice.call(arguments, 2));
    }
    
    var matching = (function () {
        if (query === undefined) return function () { return true };
        var role = query.split('@')[0];
        var version = query.split('@')[1];
        
        return function (rec) {
            if (rec.role !== role) return false;
            if (version === undefined) return true;
            if (!semver.validRange(version)) {
                return version === rec.version;
            }
            return semver.satisfies(rec.version, version);
        };
    })();
    
    var records = [];
    ports.query(query, function (recs) {
        recs.forEach(insert);
        server.emit('ready', recs);
    });
    
    function insert (rec) {
        if (!server.roles[rec.role]) server.roles[rec.role] = [];
        server.roles[rec.role].push(rec);
        
        if (!server.ports[rec.host]) server.ports[rec.host] = [];
        server.ports[rec.host].push(rec.port);
        
        records.push(rec);
    }
    
    function remove (rec) {
        var ports = server.ports[rec.host];
        if (ports) {
            var ix = ports.indexOf(rec.port);
            if (ix >= 0) ports.splice(ix, 1);
        }
        
        var roles = server.roles[rec.role] || [];
        for (var i = 0; i < roles.length; i++) {
            var r = roles[i];
            if (r.host === rec.host && r.port === rec.port) {
                roles.splice(i, 1);
                break;
            }
        }
        
        for (var i = 0; i < records.length; i++) {
            var r = records[i];
            if (r.host === rec.host && r.port === rec.port) {
                records.splice(i, 1);
                break;
            }
        }
    }
    
    ports.subscribe('allocate', function (rec) {
        if (!matching(rec)) return;
        insert(rec);
        server.emit('update', records);
    });
    
    ports.subscribe('assume', function (rec) {
        if (!matching(rec)) return;
        insert(rec);
        server.emit('update', records);
    });
    
    ports.subscribe('free', function (rec) {
        if (!matching(rec)) return;
        remove(rec);
        server.emit('update', records);
    });
    
    return server;
}
