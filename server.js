var express = require("express");
var app = express();
var port = 6969;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false });

app.configure(function() {
   app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
  res.render('main');
});
 
var io = require('socket.io').listen(app.listen(port));
var people = {};
var queue = {};

function pickRandom(obj) {
    console.log(obj);

    var result;
    var count = 0;
    for (var key in obj)
        if (Math.random() < 1/++count)
           result = obj[key];

    return result;
}

function count(obj) {
    var count = 0;
    for(var prop in obj)
        count++;
    return count;
}

io.sockets.on('connection', function (socket) {

    var person = {id: socket.id, partnerID: null};
    people[socket.id] = person;

    socket.emit('requestData',person);

    socket.on('updateData', function (person) {
        people[socket.id] = person;
    });

    socket.on('findPartner',function (criteria) {

        if (count(queue) === 0) {
            queue[socket.id] = people[socket.id];
            socket.emit('waitingForPartner');
        }
        else {
            var stranger = pickRandom(queue);
            var strangerSocket = io.sockets.sockets[stranger.id];

            delete queue[stranger.id];

            people[socket.id].partnerID = stranger.id;
            stranger.partnerID = socket.id;

            strangerSocket.emit('readyToChat',stranger);
            socket.emit('readyToChat',people[socket.id]);
        } 
    });

    socket.on('sendMessage', function (data) {
        if (data.to) {
            var strangerSocket = io.sockets.sockets[data.to];

            socket.emit('messageReceived', data);
            strangerSocket.emit('messageReceived', data);
        }
    });

    socket.on('disconnect', function () {
        var strangerID = people[socket.id].partnerID;

        if (strangerID) {
            var strangerSocket = io.sockets.sockets[strangerID];

            people[strangerID].partnerID = null;
            strangerSocket.emit('partnerLeft',people[strangerID]);
        }

        if (queue[socket.id]) {
            delete queue[socket.id];
        }

        if (people[socket.id]) {
            delete people[socket.id];
        }
    });
});

console.log("Running server on port " + port + "...");