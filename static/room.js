var game = {};
var NAME = undefined;

window.onload = function() {
    connect();
};

var showHostButtons = function() {
    if (game.phase == "PREGAME") {
        document.body.querySelector("#stopgame").style.display = "none";
        document.body.querySelector("#startgame").style.display = "";
    } else {
        document.body.querySelector("#startgame").style.display = "none";
        document.body.querySelector("#stopgame").style.display = "";
    }
}

var hideHostButtons = function() {
    document.body.querySelector("#startgame").style.display = "none";
    document.body.querySelector("#stopgame").style.display = "none";
}

var updateGame = function(game) {
    window.game = game;
    var phase = game.phase;
    var players = game.players;
    var next_players="";
    function appendToPlayers(str) {
        var players_html = document.body.querySelector("#players").innerHTML;
        document.body.querySelector("#players").innerHTML = players_html + str;
    }
    Object.keys(players).forEach(function(player, index) {
        next_players += (index%2==0 ? "<tr><td>"+player+"</td>" : "<td>"+player+"</td></tr>")
        if (index%2 == 1) {
            appendToPlayers(next_players);
            next_players="";
        }
    });
    if (players.length%2 == 1) {
        appendToPlayers("</tr>");
    }
    var role = game.players[NAME].role;
    //document.body.querySelector("#players").innerHTML = JSON.stringify(players);
    document.body.querySelector("#phase").innerHTML = phase;
    if (players[NAME].host) {
        showHostButtons();
    } else {
        hideHostButtons();
    }
    document.body.querySelector("#role").innerHTML = "<div class=\""+role.toLowerCase()+"\"><h1>"+role+"</h1></div>";
};

var getPlayerName = function(e) {
    e.preventDefault();
    var name = document.querySelector("#playername").value;
    if (name != "") {
        join(name);
    }
    window.NAME = name;
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
        console.log("connected");
        // send({"cmd": "info", "args": {"room": ROOM}});
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
        send({cmd: "start", "args": {"room": ROOM, "name": NAME}});
    }

    document.body.querySelector("#stopgame").onclick = function() {
        console.log("stopping");
        send({cmd: "stop", "args": {"room": ROOM, "name": NAME}});
    }
}
