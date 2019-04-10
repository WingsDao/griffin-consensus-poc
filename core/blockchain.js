/**
 * Blockchain utilities and transactions handlers.
 *
 * @module core/blockchain
 */

'use strict';

const {randomBytes} = require('crypto');
const keccak256     = require('keccak256');
const ethRpc        = require('eth-json-rpc')('http://localhost:8545');
const helpers       = require('lib/helpers');
const constants     = require('lib/constants');

exports.generateReceipt  = generateReceipt;
exports.getBlockProducer = getBlockProducer;

/**
 * Initial allocation of account balances from genesis.
 *
 * @param  {Object}  genesisBlock Genesis block.
 * @param  {Object}  block
 * @return {Object}
 */
exports.initiateGenesisState = function initiateGenesisState(genesisBlock, block) {
    for (const allocObject of genesisBlock.alloc) {
        const address = Object.keys(allocObject)[0];

        const allocatedAccount = allocObject[address];

        const account = helpers.emptyAccount(address);

        Object.assign(account, {
            balance:      allocatedAccount.balance      || 0,
            votes:        allocatedAccount.votes        || [],
            certificates: allocatedAccount.certificates || []
        });

        block.state.push(account);
    }

    return block;
};

/**
 * Transaction handling entrypoint.
 *
 * @return {Object}
 */
exports.handleTransaction = function handleTransaction(tx, block) {
    switch (true) {
        case isVote(tx.data):  return handleVote(tx, block);
        case isStake(tx.data): return handleStake(tx, block);
        default:               return handleStandardTransaction(tx, block);
    }
};

/**
 * Handle standard transaction.
 *
 * @param  {String} tx
 * @param  {Object} block
 * @return {Object}
 */
function handleStandardTransaction(tx, block) {
    const sender = block.state.find(account => account.address === tx.from);
    let receiver = block.state.find(account => account.address === tx.to);
    const value  = parseInt(tx.value, 16);

    if (value < 0) { throw 'Invalid value.'; }

    if (sender.balance < value) { throw 'Sender doesn\'t have enough coin in his purse.'; }

    if (!receiver) {
        receiver = helpers.emptyAccount(tx.to);
        block.state.push(receiver);
    }

    sender.balance   -= value;
    receiver.balance += value;

    return block;
}

/**
 * Handle vote transaction.
 *
 * @param  {String} tx
 * @param  {Object} block
 * @return {Object}
 */
function handleVote(tx, block) {
    const sender = block.state.find(account => (account.address === tx.from));

    let [delegate] = ethRpc.utils.decodeRawOutput(['address'], tx.data.slice(10));

    sender.votes = new Set(sender.votes);
    sender.votes.add(delegate);
    sender.votes = [...sender.votes];

    return block;
}

/**
 * Handle stake transaction.
 *
 * @param  {String} tx
 * @param  {Object} block
 * @return {Object}
 */
function handleStake(tx, block) {
    const sender = block.state.find(account => (account.address === tx.from));

    const amount = ethRpc.utils.decodeRawOutput(['uint256'], tx.data.slice(10));

    const nCertificates = Math.floor(amount / constants.CERTIFICATE_PRICE);
    const totalPrice    = nCertificates * constants.CERTIFICATE_PRICE;

    if (sender.balance < totalPrice) { throw 'Sender doesn\'t have enough coin in his purse.'; }

    sender.balance = +sender.balance - totalPrice;
    sender.locked  = +sender.locked  + totalPrice;

    for (let i = 0; i < nCertificates; i++) {
        sender.certificates.push('0x' + randomBytes(32).toString('hex'));
    }

    return block;
}

/**
 * Generate transaction receipt.
 *
 * @param  {Object} block
 * @param  {Number} transactionIndex
 * @param  {String} serializedTx
 * @param  {Object} tx
 * @return {Object}
 */
function generateReceipt(block, transactionIndex, serializedTx, tx) {
    return {
        blockHash:        block.hash,
        blockNumber:      block.number,
        transactionHash:  '0x' + keccak256(serializedTx).toString('hex'),
        transactionIndex,
        from:             tx.from,
        to:               tx.to
    };
}

/**
 * Check whether tx action is vote.
 *
 * @param  {String}  data Transaction data.
 * @return {Boolean}
 */
function isVote(data) {
    return data.slice(0, 2 + helpers.METHOD_SIGNATURE_LENGTH) === helpers.encodeTxData(constants.VOTE_METHOD_SIG);
}

/**
 * Check whether tx action is stake.
 *
 * @param  {String}  data Transaction data.
 * @return {Boolean}
 */
function isStake(data) {
    return data.slice(0, 2 + helpers.METHOD_SIGNATURE_LENGTH) === helpers.encodeTxData(constants.STAKE_METHOD_SIG);
}

/**
 * Get block producer by certificate number.
 *
 * @param  {Object} block
 * @param  {Number} finalRandomNumber
 * @return {String}                   Address of block producer.
 */
function getBlockProducer(block, finalRandomNumber) {
    let i = 0;

    for (const account of block.state) {
        for (let j = 0; j < account.certificates.length; j++) {
            if (i++ === finalRandomNumber) {
                return account.address;
            }
        }
    }
}
