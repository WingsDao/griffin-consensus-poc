'use strict';

const ethUtil       = require('ethereumjs-util');
const {randomBytes} = require('crypto');
const secp256k1     = require('secp256k1');
const keccak256     = require('keccak256');

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
 */
function sendTx({from, to, value, data}) {
    const msg = {from, to, value, data};
    // TODO broadcast
}

/**
 * Vote for delegate.
 *
 * @param {Buffer} secretKey
 * @param {Buffer} delegateAddress
 */
async function vote(secretKey, delegateAddress) {
    const hash = keccak256(delegateAddress);
    const sig  = generateSignature(hash, secretKey);

    console.log('sig', sig);

    const msg = {delegateAddress, sig};
    // TODO broadcast
}

/**
 * Generate v r s signature.
 *
 * @param  {Buffer} dataToSign
 * @param  {Buffer} secretKey
 * @return {String}
 */
function generateSignature(dataToSign, secretKey) {
    const msg     = Buffer.from(dataToSign, 'hex');
    const msgHash = ethUtil.hashPersonalMessage(msg);
    const sig     = ethUtil.ecsign(msgHash, new Buffer(secretKey, 'hex'));
    return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
}
