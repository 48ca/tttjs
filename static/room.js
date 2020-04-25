window.onload = function() {
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
            case "disconnected":
                console.warn("disconnected: replaced");
                socket.close();
                break;
            case "join":
                console.log("got players " + body.players);
                break;
        }
    }

    // Listen for messages
    socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
        var data = JSON.parse(event.data);
        handleResponse(data.cmd, data.body);
    });
};
