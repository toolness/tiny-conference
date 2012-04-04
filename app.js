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
    muted: conn.muted,
    "html-sandbox": conn["html-sandbox"]
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
    muted: false,
    "html-sandbox": '<div style="background: lightgray; padding: 4px">This area can be edited by its owner with <a href="http://hackasaurus.org/goggles/" target="_blank">X-Ray Goggles</a>.</div>'
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
  socket.on('set-property', function(data) {
    if (data.target in connections) {
      connections[data.target][data.property] = data.value;
      socket.broadcast.emit('set-property', {
        source: conn.id,
        target: data.target,
        property: data.property,
        value: data.value
      });
    }
  });
  socket.on('log', function(data) {
    socket.broadcast.emit('log', {
      id: conn.id,
      level: data.level,
      message: data.message
    });
  });
  socket.on('disconnect', function(data) {
    delete connections[conn.id];
    socket.broadcast.emit('user-disconnected', {
      id: conn.id,
    });
  });
});
