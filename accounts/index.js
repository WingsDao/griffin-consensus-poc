'use strict';

const rlp           = require('rlp');
const {randomBytes} = require('crypto');
const secp256k1     = require('secp256k1');
const keccak256     = require('keccak256');
const helpers       = require('lib/helpers');

/**
 * Entrypoint.
 */
(function main() {

    const account = createAccount();

    console.log('[Account]');
    console.log('Secret key:', '0x' + account.secretKey.toString('hex'));
    console.log('Public key:', '0x' + account.publicKey.toString('hex'));
    console.log('Address:', '0x' + account.address.toString('hex'));
    console.log('Balance:', account.balance);

    vote(account.secretKey, Buffer.from('address'));

    sendTx(account.secretKey, {from: account.address, to: account.address, value: 10, data: '0x0'});

})();

/**
 * Create new account.
 *
 * @return {Object}
 */
function createAccount() {
    let secretKey;

    do {
        secretKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(secretKey));

    const publicKey = secp256k1.publicKeyCreate(Buffer.from(secretKey, 'hex'));
    const address   = keccak256(publicKey).slice(12);

    return {
        secretKey,
        publicKey,
        address,
        nonce: 0,
        balance: 0,
        rating: 0,
        lotteryTickets: [],
        voteFor: 0
    };
}

/**
 * Broadcast transaction.
 *
 * @param  {String} from
 * @param  {String} to
 * @param  {Number} value
 * @param  {String} data
 * @param  {String} secretKey
 */
function sendTx(secretKey, {from, to, value, data}) {
    const tx = sign(secretKey, {from, to, value, data});

    console.log('Transaction', tx);

    // TODO broadcast
    // sendMessage(ts);
    // NOTE rlp.encode(tx) will turn object to string.
}

/**
 * Vote for delegate.
 *
 * @param {Buffer} secretKey
 * @param {Buffer} delegateAddress
 */
function vote(secretKey, delegateAddress) {
    const hash = keccak256(delegateAddress);
    const sig  = helpers.generateSignature(hash, secretKey);
    const msg  = {delegateAddress, sig};

    // TODO broadcast
    // sendMessage(msg);
}

/**
 * Produce the block.
 *
 * @return {[type]} [description]
 */
function produceBlock(secretKey) {
    // Get transactions from pool.
    // Form the block.
    // Include block to blockchain XXX before it is approved by 2/3 of delegates or after?
    // TODO broadcast
    // sendMessage(block);
}

/**
 * Sign transaction.
 *
 * @param  {String} secretKey
 * @param  {Object} tx
 * @param  {String} chainId
 * @return {Object}
 */
function sign(secretKey, tx, chainId) {
    const encodedData = rlp.encode(JSON.stringify(tx));
    const msgHash = keccak256(encodedData);
    const sig = secp256k1.sign(msgHash, secretKey);
    const recovery = sig.recovery;

    const signature = {
        r: sig.signature.slice(0, 32),
        s: sig.signature.slice(32, 64),
        v: chainId ? recovery + (chainId * 2 + 35) : recovery + 27
    };

    return Object.assign(tx, signature);
}
