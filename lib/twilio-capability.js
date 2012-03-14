var jwt = require('./jwt');

var Utils = {
    urlencode: function(kwargs)
    {
        var out = [], key;
        for(key in kwargs)
        {
            if(kwargs.hasOwnProperty(key))
            {
                out.push(key+'='+encodeURI(kwargs[key]));
            }
        }

        return out.join('&');
    }
},
ScopeURI = function(service, privilege, params)
{
    this.service = service;
    this.privilege = privilege;
    this.params = params ? Utils.urlencode(params) : false;
};
ScopeURI.prototype.toString = function()
{
    var param_string = this.params ? '?'+this.params : '';
    return 'scope:'+this.service+':'+this.privilege+param_string;
};
var TwilioCapability = function(account_sid, auth_token)
{
    this.account_sid = account_sid;
    this.auth_token = auth_token;
    this.capabilities = {};
};
TwilioCapability.prototype = {
    payload: function()
    {
        var scope_uris = [], key;
        for(key in this.capabilities)
        {
            if(this.capabilities.hasOwnProperty(key))
            {
                scope_uris.push(this.capabilities[key].toString());
            }
        }

        return {
            scope: scope_uris.join(' ')
        };
    },
    allow_client_incoming: function(client_name)
    {
        this.capabilities.incoming = new ScopeURI('client', 'incoming', {
            clientName: client_name
        });
    },

    allow_client_outgoing: function(application_sid, client_name, kwargs)
    {
        var scope_params = {
            appSid: application_sid
        };
        if(client_name)
        {
            scope_params.clientName = client_name;
        }
        if(kwargs)
        {
            scope_params.appParams = Utils.urlencode(kwargs);
        }

        this.capabilities.outgoing = new ScopeURI('client', 'outgoing', scope_params);
    },

    allow_event_stream: function(kwargs)
    {
        var scope_params = {
            path: '/2010-04-01/Events'
        };
        if(kwargs)
        {
            scope_params.filters = Utils.urlencode(kwargs);
        }

        this.capabilities.events = new ScopeURI('stream', 'subscribe', scope_params);
    },

    generate: function(expires)
    {
        var payload = this.payload(), token;
        payload.iss = this.account_sid;
        payload.exp = Math.round(new Date().getTime()/1000) + (expires || 3600);
        
        token = new jwt.WebToken(JSON.stringify(payload), JSON.stringify({typ:'JWT', alg: 'HS256'}));
        return token.serialize(this.auth_token);

    }
};

module.exports = TwilioCapability;
