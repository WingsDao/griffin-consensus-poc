/**
 * @module account
 */

'use strict';

const {randomBytes} = require('crypto');
const secp256k1     = require('secp256k1');
const keccak256     = require('keccak256');
const helpers       = require('lib/helpers');
const ethereumTx    = require('ethereumjs-tx');

module.exports = Account;

/**
 * Zero address (20 zero bytes with 0x prefix).
 *
 * @type {String}
 */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
        nonce:        {value: '0x00'},
        balance:      {value: '0x00'},
        rating:       {value: '0x00'},
        certificates: {value: []},
        votes:        {value: []}
    });
}

/**
 * Creates new serialized signed transaction.
 *
 * @example
 * const signedTx = {
 *   nonce: '0x00',
 *   gasPrice: '0x09184e72a000',
 *   gasLimit: '0x2710',
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: '0x00',
 *   data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
 *   v: '0x1c',
 *   r: '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
 *   s: '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
 * };
 * const serializedTx = '0xf8a280808094000000000000000000000000000000000000000064b8445f74bbde00000000000000000000000023e109eefb680fa623dde2e878f40e3f47b23c4a00000000000000000000000000000000000000000000000000000000000000641ba0933354095cea00453b7d5e589a6c416d500271fcdb2b703553fbedd2e670c720a013ec04710f3a51e5b98b8e1ac5d62fae0bfc35a6c79fa0f940faf5963ac70a99';
 *
 * @param  {String} to    Receiver of transaction.
 * @param  {String} value Value to send.
 * @param  {String} data  Data to send.
 * @return {String}       Serialized signed transaction.
 */
Account.prototype.tx = function tx(to, value, data='0x00') {
    const tx = new ethereumTx({nonce: this.nonce, to, value, data});
    tx.sign(this.secretKey);

    return '0x' + tx.serialize().toString('hex');
};

/**
 * Vote for delegate.
 *
 * @param  {String} address Address of delegate.
 * @param  {Number} amount  Amount to coins to use for vote.
 * @return {String}         Serialized signed transaction.
 */
Account.prototype.vote = function vote(address, amount) {
    const data = helpers.encodeTxData('vote(address,uint256)', [address, amount]);
    const tx   = new ethereumTx({nonce: this.nonce, to: ZERO_ADDRESS, value: amount, data});
    tx.sign(this.secretKey);

    return '0x' + tx.serialize().toString('hex');
};

/**
 * Perform a stake
 * (lock coins and get certificates).
 *
 * @param  {Number} amount Amount of coins to stake.
 * @return {String}        Serialized signed transaction.
 */
Account.prototype.stake = function stake(amount) {
    const data = helpers.encodeTxData('stake(uint256)', [amount]);
    const tx   = new ethereumTx({nonce: this.nonce, to: ZERO_ADDRESS, value: amount, data});
    tx.sign(this.secretKey);

    return '0x' + tx.serialize().toString('hex');
};

/**
* Produce the block.
*
* @return {Object} TODO
*/
Account.prototype.produceBlock = function produceBlock() {
    // TODO
    // 1. Get transactions from pool.
    // 2. [stake] Mark amount as locked (locking mechanism?).
    // 3. [stake] Generate certificates (random?).
    // 4. [vote] Mark amount as locked (locking mechanism?).
    // 5. Form the block.
    // 6. Calculate new state.
    // 7. Include block to blockchain (before it is approved by 2/3 of delegates or after?).

    // return block;
};
