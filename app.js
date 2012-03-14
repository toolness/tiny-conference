var express = require('express'),
    path = require('path'),
    TwilioCapability = require('./lib/twilio-capability'),
    config = require('./config');

var app = express.createServer();

function relpath(pathname) {
  return path.join(__dirname, pathname);
}

app.use(express.static(relpath('static')));

app.get('/api/token', function(request, response) {
  var capability = new TwilioCapability(config.account_sid,
                                        config.auth_token);
  capability.allow_client_incoming("tommy");
  capability.allow_client_outgoing(config.app_sid);

  return response.send({
    token: capability.generate(),
    etherpad_url: config.etherpad_url
  });
});

module.exports = app;
