/**
 * @module repl
 */

'use strict';

// Define REPL as is
const repl = require('repl');
const tty  = repl.start('> ');
const ctx  = tty.context;

// Attach transport system to it
(function attachTransport(tty) {

    const transport = ctx.transport = require('base/transport');

    tty.defineCommand('info', {
        action() {
            this.clearBufferedCommand();
            console.log('Transport ID is: %s', transport.transportId);
            console.log('Your groups are: %s', transport.groups.concat(['*']));
            console.log('Known nodes are: %s', JSON.stringify([...transport.knownNodes.keys()], null, 2));
            this.displayPrompt();
        }
    });

    tty.defineCommand('join', {
        action(group) {
            this.clearBufferedCommand();
            transport.joinGroup(group);
            console.log('You joined group %s', group);
            console.log('Your groups are: %s', transport.groups.concat(['*']));
            this.displayPrompt();
        }
    });

    tty.defineCommand('send', {
        action(message) {
            this.clearBufferedCommand();
            transport.send(message);
            console.log('You\'ve sent the message: %s', message);
            this.displayPrompt();
        }
    });

    transport.on('message', function (message, meta) {
        tty.clearBufferedCommand();
        console.log('New message!');
        console.log(JSON.stringify(message, null, 4));
        console.log(JSON.stringify(meta, null, 4));
        tty.displayPrompt();
    });


})(tty);
