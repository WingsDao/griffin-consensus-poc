/**
 * @module account
 */

'use strict';

const {randomBytes} = require('crypto');
const secp256k1     = require('secp256k1');
const keccak256     = require('keccak256');
const ethereumTx    = require('ethereumjs-tx');
const helpers       = require('lib/helpers');
const constants     = require('core/constants');
const blockchain    = require('core/blockchain');

module.exports = Account;

/**
 * General account @class.
 */
function Account(secretKey) {
    if (!new.target) {
        return new Account(secretKey);
    }

    while (!secretKey || !secp256k1.privateKeyVerify(secretKey)) {
        secretKey = randomBytes(32);
    }

    const publicKey = secp256k1.publicKeyCreate(Buffer.from(secretKey, 'hex'), false).slice(1);
    const address   = keccak256(publicKey).slice(12);

    Object.defineProperties(this, {
        secretKey:    {value: secretKey},
        publicKey:    {value: publicKey},
        address:      {value: address},
        nonce:        {value: 0},
        balance:      {value: 0},
        rating:       {value: 0},
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
    const data = helpers.encodeTxData(constants.VOTE_METHOD_SIG, [address, amount]);

    return this.tx(constants.ZERO_ADDRESS, amount, data);
};

/**
 * Perform a stake
 * (lock coins and get certificates).
 *
 * @param  {Number} amount Amount of coins to stake.
 * @return {String}        Serialized signed transaction.
 */
Account.prototype.stake = function stake(amount) {
    const data = helpers.encodeTxData(constants.STAKE_METHOD_SIG, [amount]);

    return this.tx(constants.ZERO_ADDRESS, amount, data);
};

/**
* Produce the block.
*
* @param  {Object}   parentBlock  Parent block.
* @param  {String[]} transactions Array of transactions to include in new block.
* @return {Object}                Block.
*/
Account.prototype.produceBlock = function produceBlock(parentBlock, transactions) {
    let block = {};

    block.number       = parentBlock.number + 1;
    block.parentHash   = parentBlock.hash;
    block.hash         = '0x' + keccak256(parentBlock.hash).toString('hex');
    block.producer     = '0x' + this.address.toString('hex');
    block.state        = parentBlock.state    || [];
    block.transactions = transactions;
    block.receipts     = parentBlock.receipts || [];
    block.txRoot       = helpers.merkleRoot(transactions);

    if (parentBlock.alloc) {
        block = blockchain.genesisAllocation(parentBlock, block);
    }

    for (let txIndex = 0; txIndex < transactions.length; txIndex++) {
        const serializedTx = block.transactions[txIndex];
        const tx           = helpers.toTxObject(serializedTx);
        const sender       = block.state.find(account => account.address === tx.from);

        if (!sender) { throw 'Sender account doesn\'t exist'; }

        block = blockchain.handleTransaction(tx, block);

        block.receipts.push(blockchain.generateReceipt(block, txIndex, serializedTx, tx));
    }

    block.stateRoot    = helpers.merkleRoot(block.state.map(account => JSON.stringify(account)));
    block.receiptsRoot = helpers.merkleRoot(block.receipts.map(receipt => JSON.stringify(receipt)));

    return block;
};
