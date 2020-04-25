(function() {
    var rooms = {};

    var create = function(id) {
        if (id in rooms)
            return false;

        rooms[id] = {
            phase: "PREGAME",
            id: id,
            clients: {},
            players: {},
        };
        return true;
    }

    var templateInfo = function(id) {
        var room = rooms[id];
        return {
            id: room.id,
        };
    }

    var makePlayer = function(room, name) {
        // TODO: Actually assign roles
        var player = {
            name: name,
            role: "UNDETERMINED",
        }
        room.players[name] = player;
        return player;
    }

    var join = function(client, args) {
        var room = rooms[args.room];
        var name = args.name;
        if (name in room.clients) {
            rooms.clients[name].send({status: "disconnected"});
        }
        room.clients[name] = client;
        var p = makePlayer(room, name);
        return {
            status: "ok",
            player: p,
            players: room.players,
        }
    }

    module.exports = {
        create: create,
        join: join,
        room: function(id) { return rooms[id]; },
        templateInfo: templateInfo,
    };
}());
