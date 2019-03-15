/**
 * @module transport
 */

'use strict';

// Dependencies
const dgram  = require('dgram');
const events = require('events');

// Sort of OSI model in this scenario
//
// - Network transport in general
// - UDP transport level (all the messages, no filtration) - pure dgram from NodeJS package
// - Managed transport level - Transport library, which will wrap the UDP multicast and will make it usable
// - Highest level - blockchain interfaces (aka Transaction)

// What else do we have here?
//
// Let's describe protocol principles:
//
// Multicast sends message to everyone, including self.
// - Somehow we have to filter messages from self (or not? tricky one)
// There will be groups of transport nodes (delegates, block-producers)
// - Each message must be filterable by target (group, transportID or broadcast to everyone - * (asterisk))
// There gonna be a lot of messages around the network so we have to format messages accordingly
// - Type, Target, Sender, Content (specific for each Type) and maybe something more

// RBD:
//
// I want it to:
//
// - transport.send()
// - transport.on('message', function onMessage() { /* ... */ })
// - new Transport() (MB, not sure)
//
// Maybe there should be a higher abstraction level like:
//
// client.on('transaction') ~ transport.on('message', function (e) { if (e.type === 'TRANSACTION') emit(e); })
//
// If so we should create and keep in mind message structure which in this scenario MUST include e.type
// That's the least we can do for higher abstractions

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
const TRANSPORT_ID = require('crypto').randomBytes(5).toString('hex');

/**
 * Default target for messages
 *
 * @type {String}
 */
const TARGET_ALL = '*';

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

    const groups  = [];
    const emitter = new events();

    emitter.joinGroup = function joinGroup(name) {
        if (!name) { throw new IdentityLayerError('Group must be a non-empty String'); }
        return groups.push(name) && undefined;
    };

    emitter.send = function sendMessage(content, target = TARGET_ALL) {
        if (!target) { throw new IdentityLayerError('No target specified!'); }
        return transport.send(JSON.stringify({target, content, sender: TRANSPORT_ID}));
    };

    transport.on('message', function onMessage(contents, meta) {

        let msg;

        try {
            msg = JSON.parse(contents.toString());
        } catch (e) {
            throw new IdentityLayerError('Unable to process message contents: ' + contents.toString());
        }

        if (groups.concat([TRANSPORT_ID, TARGET_ALL]).includes(msg.target) && msg.sender !== TRANSPORT_ID) {
            emitter.emit('message', msg, meta);
        }
    });

    Object.defineProperties(emitter, {
        transportId: {value: TRANSPORT_ID},
        groups: {get: () => groups},
        udp: {value: transport}
    });

    return emitter;
})();

module.exports = identifiableLayer;
