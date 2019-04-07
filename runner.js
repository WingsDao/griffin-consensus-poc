/**
 * @module runner
 */

'use strict';

const num  = +process.argv.slice(2)[0] || 33;

const rb      = require('crypto').randomBytes;
const fs      = require('fs');
const cp      = require('child_process');
const evt     = require('lib/events');
const Genesis = require('lib/genesis');
const tp      = require('core/transport');
const Account = require('core/account');

/**
 * Initial voting power of the delegate.
 *
 * @type {Number}
 */
const DELEGATE_BALANCE = 100;

/**
 * Path to genesis file.
 *
 * @type {String}
 */
const GENESIS_PATH = `data/${rb(4)}.json`;

const env = Object.assign({DELEGATES: num, GENESIS_PATH}, process.env);

let delegates = [];
let producers = [];

const genesis = Genesis();

const account = Account();
producers.push(account);
genesis.addProducer(account.address.toString('hex'), 1);

for (let i = 0; i < num; i++) {
    const account = Account();

    delegates.push(account);
    genesis.addDelegate(account.address.toString('hex'), DELEGATE_BALANCE);
}

genesis.writeToFile(GENESIS_PATH);

const kids     = delegates.map((e, i) => spawnKid(e, i));
const producer = cp.fork('clients/block-producer.js', ['bp'], {env: Object.assign(env, {SECRET_KEY: producers[0].secretKey.toString('hex')})});
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
function spawnKid(e, i) {
    const options = {
        env: Object.assign(env, {SECRET_KEY: e.secretKey.toString('hex')}),
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    };

    const outPath = 'data/del_' + (i + 1);

    fs.mkdirSync(outPath);

    const stream = fs.createWriteStream(outPath + '/out.log', {flags: 'w'});
    const child  = cp.fork('clients/delegate.js', [], options);

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
