var utils = require('./utils');

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
        var role = room.phase == "PREGAME" ? "UNDETERMINED" : "SPECTATOR";
        var player = {
            name: name,
            role: role,
        }
        room.players[name] = player;
        return player;
    }

    var sendableInfo = function(room) {
        return {
            phase: room.phase,
            id: room.id,
            players: room.players,
        }
    }

    var updateAllPlayers = function(room) {
        console.log("Updating all players in room " + room.id);
        var info = sendableInfo(room);
        Object.keys(room.players).forEach(function(player) {
            var sock = room.clients[player];
            sock.send(JSON.stringify({
                status: "ok",
                cmd: "info",
                body: info,
            }));
        });
    }

    var join = function(client, args) {
        var room = rooms[args.room];
        var name = args.name;
        if (name in room.clients) {
            room.clients[name].send(JSON.stringify({status: "disconnected"}));
        } else {
            makePlayer(room, name);
        }
        room.clients[name] = client;
        updateAllPlayers(room);
    }

    var roomInfo = function(client, args) {
        var room = rooms[args.room];
        if (room === undefined) {
            create(args.name);
            room = rooms[args.room];
        }
        return sendableInfo(room);
    }

    var assignRoles = function(room) {
        var players = utils.shuffle(Object.keys(room.players));
        players.forEach(function(player, idx) {
            if (idx == 0) {
                room.players[player].role = "DETECTIVE";
            } else if ((idx - 1) % 3 == 0) {
                room.players[player].role = "TRAITOR";
            } else {
                room.players[player].role = "INNOCENT";
            }
        });
    }

    var start = function(args) {
        var room = rooms[args.room];
        if (room.phase != "PREGAME") {
            return false;
        }
        room.phase = "PLAYING";
        assignRoles(room);
        updateAllPlayers(room);
        return true;
    }

    module.exports = {
        create: create,
        join: join,
        room: function(id) { return rooms[id]; },
        info: roomInfo,
        start: start,
        templateInfo: templateInfo,
    };
}());
