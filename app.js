var express = require('express'),
    path = require('path'),
    TwilioCapability = require('./lib/twilio-capability'),
    config = require('./config');

var app = express.createServer();
var io = require('socket.io').listen(app);

function relpath(pathname) {
  return path.join(__dirname, pathname);
}

app.use(express.static(relpath('static')));

module.exports = app;

var connections = {};
var latestID = 0;

function infoForUser(conn) {
  return {
    username: conn.username,
    muted: conn.muted
  };
}

function getInfoForAllUsers() {
  var info = {};
  for (var id in connections) {
    info[id] = infoForUser(connections[id]);
  }
  return info;
}

io.sockets.on('connection', function(socket) {
  var capability = new TwilioCapability(config.account_sid,
                                        config.auth_token);
  var conn = {
    token: null,
    username: "UNKNOWN",
    id: latestID++,
    muted: false
  };

  capability.allow_client_outgoing(config.app_sid);
  conn.token = capability.generate();
  connections[conn.id] = conn;

  socket.emit('configuration', {
    token: conn.token,
    id: conn.id,
    etherpad_url: config.etherpad_url,
    users: getInfoForAllUsers()
  });
  socket.broadcast.emit('user-connected', {
    id: conn.id,
    value: infoForUser(conn)
  });
  socket.on('set-username', function(data) {
    conn.username = data.value;
    socket.broadcast.emit('set-username', {
      id: conn.id,
      value: conn.username
    });
  });
  socket.on('set-muted', function(data) {
    if (data.target in connections) {
      connections[data.target].muted = data.value;
      socket.broadcast.emit('set-muted', {
        source: conn.id,
        target: data.target,
        value: data.value
      });
    }
  });
  socket.on('app-log', function(data) {
    socket.broadcast.emit('app-log', {
      id: conn.id,
      message: data.message
    });
  });
  socket.on('app-error', function(data) {
    socket.broadcast.emit('app-error', {
      id: conn.id,
      message: data.message
    });
  });
  socket.on('disconnect', function(data) {
    delete connections[conn.id];
    socket.broadcast.emit('user-disconnected', {
      id: conn.id,
    });
    console.log("DISCONNECT");
  });
});
