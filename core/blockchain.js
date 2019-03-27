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
const constants     = require('core/constants');

exports.generateReceipt = generateReceipt;

/**
 * Initial allocation of account balances from genesis.
 *
 * @param  {Object}  genesisBlock Genesis block.
 * @param  {Object}  block
 * @return {Object}
 */
exports.genesisAllocation = function genesisAllocation(genesisBlock, block) {
    for (const allocObject of genesisBlock.alloc) {
        const address = Object.keys(allocObject)[0];
        if (address !== constants.ZERO_ADDRESS) {
            block.state.push(helpers.emptyAccount(address, allocObject[address].balance));
        }
    }

    return block;
};

/**
 * Transaction handling entrypoint.
 *
 * @return {Object}
 */
exports.handleTransaction = function handleTransaction(tx, block) {
    if (isVote(tx.data)) {
        block = handleVote(tx, block);
    } else if (isStake(tx.data)) {
        block = handleStake(tx, block);
    } else {
        block = handleTx(tx, block);
    }

    return block;
};

/**
 * Handle standard transaction.
 *
 * @param  {String} tx
 * @param  {Object} block
 * @return {Object}
 */
function handleTx(tx, block) {
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
    const sender = block.state.find(account => account.address === tx.from);

    const [delegate, votes] = ethRpc.utils.decodeRawOutput(['address', 'uint256'], tx.data.slice(10));

    sender.balance -= votes;
    sender.locked  += votes;

    sender.votes.push({
        delegate,
        amount: votes
    });

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
    const sender = block.state.find(account => account.address === tx.from);

    const amount = ethRpc.utils.decodeRawOutput(['uint256'], tx.data.slice(10));

    const nCertificates = Math.floor(amount / constants.CERTIFICATE_PRICE);
    const totalPrice    = nCertificates * constants.CERTIFICATE_PRICE;

    if (sender.balance < totalPrice) { throw 'Sender doesn\'t have enough coin in his purse.'; }

    sender.balance -= totalPrice;
    sender.locked  += totalPrice;

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
