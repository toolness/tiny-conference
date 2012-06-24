var express = require('express'),
    path = require('path'),
    TwilioCapability = require('./lib/twilio-capability'),
    config = require('./config'),
    fs = require('fs');

var app = express.createServer();
var io = require('socket.io').listen(app);

function relpath(pathname) {
  return path.join(__dirname, pathname);
}

app.use(express.static(relpath('static')));

app.get('/admin', function(req, res) {
  res.send(fs.readFileSync(relpath('static/admin.html'), 'utf8'));
});

app.get('/status', function(req, res) {
  res.send({
    acceptingNewConnections: acceptingNewConnections,
    numConnections: Object.keys(connections).length
  });
});

app.post('/begin', function(req, res) {
  if (config.admin_key && req.header('x-admin-key') != config.admin_key)
    return res.send(403);
  acceptingNewConnections = true;
  res.send({message: "app enabled."});
});

app.post('/end', function(req, res) {
  if (config.admin_key && req.header('x-admin-key') != config.admin_key)
    return res.send(403);
  Object.keys(connections).forEach(function(id) {
    var conn = connections[id];
    delete connections[id];
    conn.socket.disconnect();
  });
  acceptingNewConnections = false;
  res.send({message: "app disabled."});
});

module.exports = app;

var acceptingNewConnections = true;
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

var editorState = {
  content: fs.readFileSync(relpath('/static/default-content.html'), 'utf8')
};

io.sockets.on('connection', function(socket) {
  if (!acceptingNewConnections) {
    socket.emit('go-away', {});
    socket.disconnect();
    return;
  }
  
  var capability = new TwilioCapability(config.account_sid,
                                        config.auth_token);
  var conn = {
    token: null,
    username: "UNKNOWN",
    id: latestID++,
    muted: false,
    socket: socket
  };

  capability.allow_client_outgoing(config.app_sid);
  conn.token = capability.generate();
  connections[conn.id] = conn;

  socket.emit('configuration', {
    token: conn.token,
    id: conn.id,
    etherpad_url: config.etherpad_url,
    users: getInfoForAllUsers(),
    editorState: editorState
  });
  socket.broadcast.emit('user-connected', {
    id: conn.id,
    value: infoForUser(conn)
  });
  socket.on('set-editor-property', function(data) {
    editorState[data.property] = data.value;
    socket.broadcast.emit('set-editor-property', {
      source: conn.id,
      property: data.property,
      value: data.value
    });
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
