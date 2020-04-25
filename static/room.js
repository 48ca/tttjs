var game = {};

window.onload = function() {
    connect();
};

var updateGame = function(game) {
    var phase = game.phase;
    var players = game.players;
    document.body.querySelector("#players").innerHTML = JSON.stringify(players);
    document.body.querySelector("#phase").innerHTML = phase;
};

var getPlayerName = function(e) {
    e.preventDefault();
    var name = document.querySelector("#playername").value;
    if (name != "") {
        join(name);
    }
    return false;
};

var join = function(name) {
    send({"cmd": "join", "args": {"room": ROOM, "name": name}});
};

var removeNamePrompt = function() {
    var e = document.body.querySelector("#nameform");
    e.parentNode.removeChild(e);
};

var connect = function() {
    console.log("Joining " + ROOM);
    if (!WSHOST) {
        WSHOST = "localhost:8080";
    }
    console.log("Hostname " + WSHOST)
    // var ws = new WebSocket("ws://" + WSHOST);

    // Create WebSocket connection.
    const socket = new WebSocket('ws://' + WSHOST);

    window.send = function(obj) {
        socket.send(JSON.stringify(obj));
    }

    // Connection opened
    socket.addEventListener('open', function (event) {
        send({"cmd": "info", "args": {"room": ROOM}});
    });

    function handleResponse(cmd, body) {
        switch(cmd) {
            case "join":
                console.log("joined");
                removeNamePrompt();
                break;
            case "info":
                console.log("got new game status " + JSON.stringify(body));
                updateGame(body);
                break;
        }
    }

    // Listen for messages
    socket.addEventListener('message', function (event) {
        var data = JSON.parse(event.data);
        if (data.status == "disconnected") {
            console.warn("disconnected: replaced");
            socket.close();
            return;
        }
        if (data.status != "ok") {
            console.warn("received non-ok response: " + event.data);
            return;
        }
        handleResponse(data.cmd, data.body);
    });

    document.body.querySelector("#startgame").onclick = function() {
        console.log("starting");
        send({cmd: "start", "args": {"room": ROOM}});
    }
}
