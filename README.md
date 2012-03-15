This is a small experiment designed to fix a handful of problems that Mozilla conference calls have:

1. There's frequently someone in a train station who's unmuted, and thereby ruins the call for everyone until they mute themselves.

2. Most conference calls use an Etherpad as a back-channel; some use an Etherpad as the front-channel and the conference call as a back channel. However, keeping the audio and Etherpad channels completely separate means that there's frequently someone on one channel who doesn't know how to get on the other. Even if they know the dial-in information, the conference room/PIN, and the Etherpad URL, it's still a hassle to join both channels separately.

Tiny Conference tries to solve the muting problem by making it easy for *anyone* in the call to mute anyone else. It tries to solve the two-channel problem by using the [Twilio Client API][] to make the audio channel completely Web-based. Combined with [Etherpad Lite][], the whole experience can be made much more seamless and hassle-free: joining a conference becomes simply a matter of visiting a web page and entering one's name.

## Prerequisites

* node.js
* npm
* Etherpad Lite

## Quick Start

First, you'll want to set up a Twilio app with a Voice URL that points to an XML file containing the following:

    <Response>
    <Say>Joining a conference room</Say>
    <Dial>
    <Conference>MyRoom</Conference>
    </Dial>
    </Response>

Then, run the following at a shell prompt:

    git clone git://github.com/toolness/tiny-conference.git
    cd tiny-conference
    npm install
    npm test
    cp config.js.sample config.js

Now edit `config.js` as necessary, and then run:

    node_modules/.bin/up -w -n 1 app.js

Then visit http://localhost:3000/.

## Limitations

So far, there are tons of limitations to this app. Here are a few.

* The app can only currently host one conference call with a single Etherpad back-channel; it can't be used to host multiple simultaneous conferences with different Etherpad back-channels.

* The UI needs to make the user's mute-state more obvious to them.

  [Twilio Client API]: http://www.twilio.com/docs/client
  [Etherpad Lite]: https://github.com/Pita/etherpad-lite
