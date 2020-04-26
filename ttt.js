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
        var role = room.phase == "PREGAME" ? "Undetermined" : "Spectator";
        var player = {
            name: name,
            role: role,
            host: Object.keys(room.players).length == 0,
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

    var getRoom = function(room_name){
        var room = rooms[room_name];
        if (room === undefined) {
            create(room_name);
            room = rooms[room_name];
        }
        return room;
    }

    var join = function(client, args) {
        var room = getRoom(args.room);
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
        var room = getRoom(args.room);
        return sendableInfo(room);
    }

    var unassignRoles = function(room) {
        var players = utils.shuffle(Object.keys(room.players));
        players.forEach(function(player, idx) {
            room.players[player].role = "Undetermined";
        });
    }

    var assignRoles = function(room) {
        var players = utils.shuffle(Object.keys(room.players));
        players.forEach(function(player, idx) {
            if (idx == 0) {
                room.players[player].role = "Detective";
            } else if ((idx - 1) % 3 == 0) {
                room.players[player].role = "Traitor";
            } else {
                room.players[player].role = "Innocent";
            }
        });
    }

    var stop = function(args) {
        var room = getRoom(args.name);
        if (!room.players[args.name].host) {
            return false;
        }
        room.phase = "PREGAME";
        unassignRoles(room);
        updateAllPlayers(room);
        return true;
    }

    var start = function(args) {
        var room = getRoom(args.name);
        if (room.phase != "PREGAME") {
            return false;
        }
        if (!room.players[args.name].host) {
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
        room: function(id) { return getRoom(id); },
        info: roomInfo,
        start: start,
        stop: stop,
        templateInfo: templateInfo,
    };
}());
