var express = require('express');
var app = express();

var WebSocket = require('ws');

var body_parser = require('body-parser');

var ttt = require('./ttt');

app.use(body_parser.urlencoded({ extended: true }));
app.use('/static', express.static('static'))
app.set('view engine', 'ejs');
app.locals.ws = {
    host: "localhost:8080",
};

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/room/:id', function(req, res) {
    id = req.params.id;
    ttt.create(id)
    var room = ttt.templateInfo(id);
    res.render('room', {"room": room});
});

app.post('/create', function (req, res) {
    id = req.body.id;
    var ret = ttt.create(id);
    res.status(200).send({id: id, success: ret});
});

const wss = new WebSocket.Server({ port: 8080 });

function handleCommand(client, cmd, args) {
    switch(cmd) {
        case "join":
            return ttt.join(client, args);
    }
    return {"status": "CMDNOTFOUND"};
}

wss.on('connection', function connection(ws) {
    console.log("Got connection");
    ws.on('message', function incoming(message) {
        var data = JSON.parse(message);
        console.log('received: %s', message);
        var res = handleCommand(ws, data.cmd, data.args);
        console.log('sending: %s', res);
        ws.send(JSON.stringify(res));
    });
});

console.log("Started websocket server on port 8080");

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
