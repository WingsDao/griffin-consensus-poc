/**
 * @module core/transport
 */

'use strict';

// Dependencies
const dgram   = require('dgram');
const Emitter = require('events');
const events  = require('lib/events');

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
const TRANSPORT_ID = [randomName(), require('crypto').randomBytes(2).toString('hex')].join('_');

/**
 * Default target for messages
 *
 * @type {String}
 */
const TARGET_ALL = '*';

const NODE_ONLINE = events.NODE_ONLINE;
const HANDSHAKE   = events.HANDSHAKE;

/**
 * Layers definition
 */

class TransportError extends Error {}
class IdentityLayerError extends TransportError {}

/**
 * Base transport level
 *
 * - send(msg)
 * - on('message')
 * @return {[type]} [description]
 */
const transport = (function initTransportLayer() {

    const udp = dgram.createSocket({type: 'udp4', reuseAddr: true});

    udp.bind(PORT);
    udp.on('listening', () => udp.addMembership(MULTICAST_ADDR));

    return {
        on: udp.on.bind(udp),
        send(msg, cb) {
            if (!msg) { throw TransportError('Message must be buffer or string'); }
            return (msg = msg.toString()) && udp.send(msg, 0, msg.length, PORT, MULTICAST_ADDR, cb);
        }
    };
})();

/**
 * Identifiable layer
 *
 * - Only JSON
 * - Identifiable
 * - Groups API included
 *
 * - possible: joinGroup(name)
 * - display groups: get->groups
 */
const identifiableLayer = (function initIdentifiableLayer() {

    const groups     = [];
    const knownNodes = new Map();
    const emitter    = new Emitter();

    emitter.joinGroup = function joinGroup(name) {
        if (!name) { throw new IdentityLayerError('Group must be a non-empty String'); }
        return groups.push(name) && undefined;
    };

    emitter.send = function sendMessage(content, target = TARGET_ALL) {
        if (!target) { throw new IdentityLayerError('No target specified!'); }
        return transport.send(JSON.stringify({target, content, sender: TRANSPORT_ID, timestamp: Date.now()}));
    };

    transport.on('message', function onMessage(contents, meta) {

        let msg;

        try {
            msg = JSON.parse(contents.toString());
        } catch (e) {
            throw new IdentityLayerError('Unable to process message contents: ' + contents.toString());
        }

        if (groups.concat([TRANSPORT_ID, TARGET_ALL]).includes(msg.target)) {
            emitter.emit('message', msg, meta);
            emitter.emit(msg.content.type, msg.content.data, msg, meta);
            knownNodes.set(msg.sender, meta);
        }
    });

    emitter.on('message', function sendIdentityWhenRequestes(msg) {
        if (msg.content.type === NODE_ONLINE) {
            emitter.send({type: HANDSHAKE}, msg.sender);
        }
    });

    transport.on('listening', function requestIdentities() {
        emitter.send({type: NODE_ONLINE}, '*');
    });

    Object.defineProperties(emitter, {
        transportId: {value: TRANSPORT_ID},
        knownNodes: {get: () => knownNodes},
        groups: {get: () => groups},
        udp: {value: transport}
    });

    return emitter;
})();

module.exports = identifiableLayer;

/**
 * @return {String}
 */
function randomName() {
    return [
        'alice','bob','josh','ben','yuri','sam','bud','amy','noah','lana','george',
        'beatrice','karen','hank','charlie','pam','dude','bonny','arthur','merkel'
    ].sort(() => Math.random() - 0.5)[0];
}
