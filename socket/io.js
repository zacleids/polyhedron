var io = require('socket.io')();

io.on('connection', function (socket) {
    socket.on('test', function (data) {
        console.log(data);
    });
});

module.exports = io;