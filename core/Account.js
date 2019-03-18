/**
 * @module Account
 */

'use strict';

const {randomBytes} = require('crypto');
const secp256k1     = require('secp256k1');
const keccak256     = require('keccak256');
const helpers       = require('lib/helpers');
const transport     = require('core/transport');

module.exports = Account;

/**
 * General account @class.
 */
function Account() {
    if (!new.target) {
        return new Account();
    }

    let secretKey;

    do {
        secretKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(secretKey));

    const publicKey = secp256k1.publicKeyCreate(Buffer.from(secretKey, 'hex'), false).slice(1);
    const address   = keccak256(publicKey).slice(12);

    Object.defineProperties(this, {
        secretKey:    {value: secretKey},
        publicKey:    {value: publicKey},
        address:      {value: address},
        nonce:        {value: 0},
        balance:      {value: 0},
        rating:       {value: 0},
        certificates: {value: []}
    });
}

/**
 * Broadcast transaction.
 *
 * @param {Object} params
 */
Account.prototype.sendTx = function sendTx({to, value, data}) {
    const tx = helpers.sign(this.secretKey, {from: this.address, to, value, data});

    // NOTE rlp.encode(tx) will turn object to string.
    transport.send(tx);
};

/**
 * Vote for delegate.
 *
 * @param {Buffer} secretKey
 * @param {Buffer} delegateAddress
 */
Account.prototype.vote = function vote(delegateAddress) {
    const hash = keccak256(delegateAddress);
    const sig  = helpers.generateSignature(hash, this.secretKey);
    const msg  = {delegateAddress, sig};

    transport.send(msg);
};

/**
 * Perform a stake
 * (lock coins and get certificates).
 *
 * @param  {Number} amount Amount of coins to stake.
 * @return {[type]} [description]
 */
Account.prototype.stake = function stake(/*amount*/) {
    // TODO
    // 1. Mark amount as locked (locking mechanism?).
    // 2. Generate certificates (random?).
    // 3. transport.send(stakeRequest?);
};

/**
* Produce the block.
*
* @return {[type]} [description]
*/
Account.prototype.produceBlock = function produceBlock() {
    // TODO
    // 1. Get transactions from pool.
    // 2. Form the block.
    // 3. Include block to blockchain XXX before it is approved by 2/3 of delegates or after?
    // 4. transport.send(block);
};
