var game = {};

window.onload = function() {

    var updateGame = function(game) {
        var phase = game.phase;
        var players = game.players;
        document.body.querySelector("#players").innerHTML = JSON.stringify(players);
        document.body.querySelector("#phase").innerHTML = phase;
    };

    console.log("Joining " + ROOM);
    if (!WSHOST) {
        WSHOST = "localhost:8080";
    }
    console.log("Hostname " + WSHOST)
    // var ws = new WebSocket("ws://" + WSHOST);

    // Create WebSocket connection.
    const socket = new WebSocket('ws://' + WSHOST);

    var send = function(obj) {
        socket.send(JSON.stringify(obj));
    }

    // Connection opened
    socket.addEventListener('open', function (event) {
        send({"cmd": "join", "args": {"room": ROOM, "name": "TESTNAME"}});
    });

    function handleResponse(cmd, body) {
        switch(cmd) {
            case "join":
                console.log("joined");
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
};
