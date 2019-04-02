/**
 * @module runner
 */

'use strict';

const num  = +process.argv.slice(2)[0] || 33;

const fs  = require('fs');
const evt = require('lib/events');
const cp  = require('child_process');
const tp  = require('core/transport');
const env = Object.assign({DELEGATES: num}, process.env);

const kids     = Array.from(Array(num)).map((e, i) => spawnKid(i));
const producer = cp.fork('clients/block-producer.js', ['bp'], {env});
const repl     = require('repl').start('> ');

repl.context.kids  = kids;
repl.context.tp    = tp;
repl.context.start = () => tp.send(evt.START_ROUND);

tp.delegates = new Map();
tp.on(evt.I_AM_HERE, (data, msg) => tp.delegates.set(msg.sender, msg));

process
    .on('exit', finish)
    .on('SIGINT', finish)
    .on('uncaughtException', finish)
    .on('unhandledRejection', finish);

/**
 * Spawn child delegate process. To be used with Array.prototype.map
 *
 * @param  {Number}          i Sequence number of delegate
 * @return {cp.ChildProcess}   Spawned child process
 */
function spawnKid(i) {

    const outPath = 'data/del_' + (i + 1);

    fs.mkdirSync(outPath);

    const stream = fs.createWriteStream(outPath + '/out.log', {flags: 'w'});
    const child  = cp.fork('clients/delegate.js', [], {env: env, stdio: ['pipe', 'pipe', 'pipe', 'ipc']});

    child.stdout.pipe(stream);
    child.stderr.pipe(stream);

    return child;
}

function finish(...args) {
    return console.log('Cleaning up:', args)
        || producer.kill()
        && kids.map((kid) => kid.kill())
        && process.exit(0);
}
