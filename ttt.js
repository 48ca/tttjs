var utils = require('./utils');

(function() {
    var rooms = {};

    var resetInactiveTimer = function(room) {
        var room = rooms[id];
        if (room === undefined)
            return;
        if (room.interval != undefined) {
            clearInterval(room.interval);
        }
        room.interval = setInterval(function() {
            console.log("Cleaning up " + id);
            if (room != undefined) {
                Object.keys(room.clients).forEach(function(p) {
                    room.clients[p].send(JSON.stringify({status: "disconnected"}))
                });
                clearInterval(room.interval);
            }
            delete rooms[id];
        }, 30 * 60 * 1000); // 30 minute inactive timer
    }

    var create = function(id) {
        if (id in rooms)
            return false;

        rooms[id] = {
            phase: "PREGAME",
            id: id,
            clients: {},
            players: {},
        };
        resetInactiveTimer(id);
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
            } else if ((idx - 1) % 4 == 0) {
                room.players[player].role = "Traitor";
            } else {
                room.players[player].role = "Innocent";
            }
        });
    }

    var stop = function(args) {
        var room = rooms[args.room];
        if (room === undefined) {
            return false;
        }
        if (!room.players[args.name].host) {
            return false;
        }
        room.phase = "PREGAME";
        unassignRoles(room);
        updateAllPlayers(room);
        return true;
    }

    var start = function(args) {
        var room = rooms[args.room];
        if (room === undefined) {
            return false;
        }
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
        reset: resetInactiveTimer,
        templateInfo: templateInfo,
    };
}());
