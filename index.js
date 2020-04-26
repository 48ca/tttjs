var express = require('express');
var app = express();

var WebSocket = require('ws');

var body_parser = require('body-parser');

var ttt = require('./ttt');

app.use(body_parser.urlencoded({ extended: true }));
app.use('/static', express.static('static'))
app.set('view engine', 'ejs');

var wsport = process.env.WSPORT || 8080;
var httpport = process.env.PORT || 3000;
var wshostname = process.env.WSHOST || "localhost";

app.locals.ws = {
    host: wshostname + ":" + wsport,
};

app.get('/', function (req, res) {
    res.render('index');
});
app.get('/roles', function (req, res) {
    res.render('roles');
});

app.get('/room/:id', function(req, res) {
    id = req.params.id;
    ttt.create(id)
    var room = ttt.templateInfo(id);
    res.render('room', {"room": room});
});

const wss = new WebSocket.Server({ port: wsport });

function handleCommand(client, cmd, args) {
    if (args.room != undefined) {
        ttt.reset(args.room);//reset inactive interval
    }
    switch(cmd) {
        case "join":
            ttt.join(client, args);
            return {status: "ok", cmd: "join"};
        case "info":
            return {
                status: "ok",
                cmd: "info",
                body: ttt.info(client, args)
            }
        case "start":
            if(!ttt.start(args)) {
                return {status: "Could not start game (already started?)"};
            }
            return;
        case "stop":
            if(!ttt.stop(args)) {
                return {status: "Could not stop game"};
            }
            return;
    }
    return {status: "Command not recognized: " + cmd};
}

wss.on('connection', function connection(ws) {
    console.log("Got connection");
    ws.on('message', function incoming(message) {
        var data = JSON.parse(message);
        console.log('received: %s', message);
        var res = handleCommand(ws, data.cmd, data.args);
        if (res !== undefined) {
            console.log('sending: %s', res);
            ws.send(JSON.stringify(res));
        }
    });
});

console.log("Started websocket server on port " + wsport);

app.listen(httpport, function () {
  console.log('Started http server on port ' + httpport);
});
