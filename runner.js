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
const GENESIS_PATH = `data/${rb(4).toString('hex')}.json`;

const env = Object.assign({DELEGATES: num, GENESIS_PATH}, process.env);

const delegates = [];
const producers = [];
const bank      = Account();

const genesis = Genesis();

genesis.addAccount(bank.address.toString('hex'), 1000000);

for (let i = 0; i < num; i++) {
    const account = Account();

    delegates.push(account);
    genesis.addDelegate(account.address.toString('hex'), DELEGATE_BALANCE);
}

for (let i = 0; i < num; i++) {
    const account = Account();

    producers.push(account);
    genesis.addProducer(account.address.toString('hex'), 1);
}

genesis.writeToFile(GENESIS_PATH);

const kids = []
    .concat(delegates.map(spawnDelegate))
    .concat(producers.map(spawnProducer));

const bankKiddo = cp.fork('clients/bank.js', ['bank'], {env: Object.assign(env, {SECRET_KEY: bank.secretKey.toString('hex')})});
const repl      = require('repl').start('> ');

repl.context.kids  = kids;
repl.context.tp    = tp;
repl.context.start = () => tp.send(evt.START_ROUND);
repl.context.ping  = (addr) => tp.send(evt.PING, addr);

tp.on(evt.PONG, (data) => console.log('Yup, dude, %s', data));

tp.delegates = new Map();
tp.on(evt.I_AM_HERE, (data, msg) => tp.delegates.set(msg.sender, msg));

console.log('DELEGATES:') || delegates.map((e) => console.log('-', e.getHexAddress()));
console.log('PRODUCERS:') || producers.map((e) => console.log('-', e.getHexAddress()));

tp.on(evt.START_ROUND, function () {
    tp.once(evt.NEW_BLOCK, function ({block}) {
        console.log('New block', block);
    });
});

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
function spawnDelegate(e, i) {

    const datadir = 'data/del_' + (i + 1);
    const options = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: Object.assign({
            SECRET_KEY: e.secretKey.toString('hex'),
            DATADIR: datadir
        }, env),
    };

    fs.mkdirSync(datadir);

    const stream = fs.createWriteStream(datadir + '/out.log', {flags: 'w'});
    const child  = cp.fork('clients/delegate.js', [], options);

    child.stdout.pipe(stream);
    child.stderr.pipe(stream);

    return child;
}

function spawnProducer(e, i) {

    const datadir = 'data/prod_' + (i + 1);
    const options = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: Object.assign({
            SECRET_KEY: e.secretKey.toString('hex'),
            DATADIR: datadir
        }, env),
    };

    fs.mkdirSync(datadir);

    const stream = fs.createWriteStream(datadir + '/out.log', {flags: 'w'});
    const child  = cp.fork('clients/block-producer.js', [], options);

    child.stdout.pipe(stream);
    child.stderr.pipe(stream);

    return child;
}

function finish(...args) {
    return console.log('Cleaning up:', args)
        || bankKiddo.kill()
        || true
        && kids.map((kid) => kid.kill())
        && process.exit(0);
}
