var express = require('express');
var fs = require('fs');
var app = express();
var gamejs = require('./public/js/Game.js');

var Game = gamejs.Game;

var game = new Game();

app.use(express.static(__dirname + '/public'));

/**
 * Create a server that listen on port 8082
 * @type {http.Server}
 */
var server = app.listen(8082, function () {
    var port = server.address().port;
    console.log('Server running at port %s', port);


});

var io = require('socket.io').listen(server);

/**
 * When a client is connected
 */
io.sockets.on('connection', function (socket) {

   console.log('Client connected ' + socket.id);

   socket.emit('id', socket.id);

    let joueur = game.createPlayer(socket.id);

    socket.emit('load', { data: game.save() });

    socket.broadcast.emit('join',  { joueur: joueur });
    io.emit('message', '<i>' + joueur.pseudo + ' a rejoint le jeu</i>');

    /**
     * When a client is renamed
     */
    socket.on('rename', function (pseudo) {
       let t = game.rename(socket.id, pseudo);
       io.emit('rename', { id: socket.id, pseudo: pseudo });
       io.emit('message', '<i>' + t + '</i>');
    });

    /**
     * When a client leave the game
     */
    socket.on('leave', function () {
        let t = game.leave(socket.id);
        io.emit('leave', socket.id);
        io.emit('<i>' + t + ' a quitté le jeu</i>');
    });

    /**
     * When the host start the game
     */
    socket.on('start', function () {
        if (game.getPlayer(socket.id).isHost) {
            console.log('Debut de la partie');
            game.updateEvery(game.UPDATE_INTERVAL);
            io.emit('start');
            io.emit('message', '<i>Début de la partie</i>');
        }
    });

    /**
     * When the client turn left
     */
    socket.on('left', function (d) {
        game.left(socket.id, d.press);
        io.emit('left', { id: socket.id, press: d.press});
    });

    /**
     * When the client turn right
     */
    socket.on('right', function (d) {
        game.right(socket.id, d.press);
        io.emit('right', { id: socket.id, press: d.press})
    });

    /**
     * When a client send a message with the tchat
     */
    socket.on('message', function (m) {
        let j = game.getPlayer(socket.id);
        io.emit('message', j.pseudo + ': ' + m);
        console.log('Nouveau message: ' + j.pseudo + ': ' + m)
    });

    socket.on('state', function () {
        console.log('Request sync from ' + socket.id);
        socket.emit('load', { data: game.save() });
    });

    var syncTimer = setInterval(function () {
        socket.emit('time', {
            updateCount: game.updateCount,
            timeStamp: game.timeStamp
        });
    }, 2000);
});

/**
 * When a player die
 */
game.on('die', function (d) {
    io.emit('die', d);
});

/**
 * When a player won the game
 */
game.on('victory', function (d) {
    game.win(d.winner);
    game.newGame();
    io.emit('load', { data: game.save() });
});

app.use('/', function (req, res) {
    console.log('Nouveau client');
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});