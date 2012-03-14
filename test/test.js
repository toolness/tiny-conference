var assert = require('assert'),
    jwt = require('../lib/jwt'),
    TwilioCapability = require('../lib/twilio-capability');

describe("btoa/atob", function() {
  var window = jwt._window;

  function verify(str, expected) {
    var a = window.btoa(str);
    var b = window.atob(a);
    assert.equal(a, expected);
    assert.equal(b, str);
  }
  
  it("should work with plain ASCII strings", function() {
    verify("hello", "aGVsbG8=");
  });
  
  it("should work with funky binary strings", function() {
    var buf = [4,44,13,134,7,89,155,254,71,79,144,132,29,113,173,226,72,12,
               105,143,22,167,64,131,146,143,221,161,225,61,140,196];
    var str = String.fromCharCode.apply(String, buf);
    verify(str, "BCwNhgdZm/5HT5CEHXGt4kgMaY8Wp0CDko/doeE9jMQ=");
  });
});

describe("TwilioCapability", function() {
  it('should not throw', function() {
    var account_sid = "xxx";
    var auth_token = "yyy";
    var app_sid = "zzz";

    var capability = new TwilioCapability(account_sid, auth_token);
    capability.allow_client_incoming("tommy");
    capability.allow_client_outgoing(app_sid);
    assert.equal(typeof(capability.generate()), "string");
  });
});
