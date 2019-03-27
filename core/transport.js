/**
 * @module core/transport
 */

'use strict';

// Dependencies
const dgram   = require('dgram');
const Emitter = require('events');
const events  = require('lib/events');

/**
 * Whole module is ONE EVENT EMITTER, BEWARE!
 * @type {events.EventEmitter}
 */
const emitter = module.exports = exports = new Emitter();

/**
 * Address of multicast. Must be in range: 224.0.0.0 -> 239.255.255.255
 * @see {@link https://www.iana.org/assignments/multicast-addresses/multicast-addresses.xhtml}
 *
 * @type {String}
 */
const MULTICAST_ADDR = '224.0.0.1';

/**
 * Port to listen to.
 * ENV: UDP_PORT
 *
 * @default 30000
 * @type {Number}
 */
const PORT = process.env.UDP_PORT || 30000;

/**
 * 5-byte Transport ID in HEX encoding.
 * Random on every launch, one per transport node.
 *
 * @type {String}
 */
const TRANSPORT_ID = exports.transportId = exports.ID = randomName();

/**
 * Default target for messages
 *
 * @type {String}
 */
const TARGET_ALL = '*';

const NODE_ONLINE = events.NODE_ONLINE;
const HANDSHAKE   = events.HANDSHAKE;
// const PING        = events.PING;s

class TransportError     extends Error {}
class IdentityLayerError extends TransportError {}

const msgTargets = exports.groups     = new Set([TARGET_ALL, TRANSPORT_ID]);
const knownNodes = exports.knownNodes = new Map;

const udp = dgram
    .createSocket({type: 'udp4', reuseAddr: true}).bind(PORT)
    .once('listening', () => udp.addMembership(MULTICAST_ADDR))
    .once('listening', () => sendEvent(NODE_ONLINE, null, '*'));


exports.send = emitter.send = sendEvent.bind(emitter);
exports.on   = emitter.on.bind(emitter);

udp.on('message', function (rawData, meta) {

    let msg;

    try { msg = JSON.parse(rawData.toString()); }
    catch (e) {
        throw new IdentityLayerError('Unable to process message contents: ' + rawData.toString());
    }

    // We suppose message structure in this network is one and only one
    const target       = msg.target;
    const {type, data} = msg.content;

    if (msgTargets.has(target)) {

        emitter.emit('message', msg, meta);     // Emit 'message' event on main emitter
        emitter.emit(type, data, msg, meta);    // Emit event.* event for more complex logic
        knownNodes.set(msg.sender, meta);       // As this node showed some activity -> remember it
    }

});

emitter.on(NODE_ONLINE, (data, msg) => sendEvent(HANDSHAKE, null, msg.sender));

/**
 * Wrap UDP broadcast into id-layer standard form
 *
 * @param  {String} evt          Event data
 * @param  {Object} data         Data to send (any type and no worries)
 * @param  {String} [target='*'] Event target, all by default
 */
function sendEvent(evt, data, target = TARGET_ALL) {
    const content = {type: evt, data};
    const message = JSON.stringify({
        target,
        content,
        sender: TRANSPORT_ID,
        timestamp: Date.now()
    });

    return broadcast(message);
}

/**
 * Broadcast RAW UDP message with Max length of 65535 bytes
 * all over the multicast subscribers
 *
 * @param  {Buffer|String} msg Message to send
 * @param  {Function}      cb  Callback after message was sent
 */
function broadcast(msg, cb) {

    msg && (msg = msg.toString());

    if (!msg || msg.length && msg.length > 65535) {
        throw new TransportError('Message MUST be a string. Max length is: 655535');
    }

    return udp.send(msg, 0, msg.length, PORT, MULTICAST_ADDR, cb);
}

/**
 * Generate random Node name of kind: alice_0b6a
 * Why? It's so much easier to work with understandable namings.
 *
 * @return {String}
 */
function randomName() {

    const code = require('crypto').randomBytes(2).toString('hex');
    const name = [
        'alice','bob','josh','ben','yuri','sam','bud','amy','noah','lana','george',
        'beatrice','karen','hank','charlie','pam','dude','bonny','arthur','merkel'
    ].sort(() => Math.random() - 0.5)[0];

    return [name, code].join('_');
}
