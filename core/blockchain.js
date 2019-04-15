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
const chainData     = require('core/chaindata');

exports.generateReceipt  = generateReceipt;
exports.getBlockProducer = getBlockProducer;
exports.getDelegates = getDelegates;

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
 * Get balance of account by address.
 *
 * @param   address            Address of account.
 * @returns {Promise.<Number>} Balance of account.
 */
exports.getBalance = async function getBalance(address) {
    const account = await getAccountFromLatestBlock(address);
    return account.balance;
};

/**
 * Get stake of account by address.
 *
 * @param   address            Address of account.
 * @returns {Promise.<Number>} Stake of account.
 */
exports.getStake = async function getStake(address) {
    const account = await getAccountFromLatestBlock(address);

    if (!account.certificates.length) {
        return 0;
    }

    return account.locked;
};

/**
 * Get votes for account (delegate) by address.
 *
 * @param   address              Address of delegates.
 * @returns {Promise.<String[]>} All votes for delegate.
 */
exports.getVotesFor = async function getVotesFor(address) {
    const latestBlock = await chainData.getLatest();

    const votes = latestBlock.state.filter(account => {
        return account.votes.findIndex(delegate => delegate == address) >= 0;
    });

    return votes;
};

/**
 * Returns 31 active delegates.
 *
 * @returns {Promise.<Object[]>}
 */
exports.getActiveDelegates = async function getActiveDelegates() {
    const delegates = await getDelegates();

    return delegates.slice(0, constants.ACTIVE_DELEGATES_COUNT);
};

/**
 * Returns 31 successor delegates.
 *
 * @returns {Promise.<Object[]>}
 */
exports.getSuccessorDelegates = async function getSuccessorDelegates() {
    const delegates         = await getDelegates();
    const delegatesListEnd  = constants.ACTIVE_DELEGATES_COUNT + constants.SUCCESSOR_DELEGATES_COUNT;

    return delegates.slice(constants.ACTIVE_DELEGATES_COUNT, delegatesListEnd);
};

/**
 * Returns delegates count.
 *
 * @returns {Promise.<Number>}
 */
exports.getDelegatesCount = async function getDelegatesCount() {
    const rawDelegates = await getRawDelegates();

    return Object.keys(rawDelegates).length;
};

/**
 * Check if account is delegate.
 *
 * @param   address             Address of account.
 * @returns {Promise.<boolean>} True/false depends is delegate or not.
 */
exports.isDelegate = async function isDelegate(address) {
    const rawDelegates = await getRawDelegates();

    return rawDelegates[address] == undefined;
};

/**
 * Get certificates of account.
 *
 * @param   address              Address of account.
 * @returns {Promise.<String[]>} Array with certificates.
 */
exports.getCertificates = async function getCertificates(address) {
    const account = await getAccountFromLatestBlock(address);

    return account.certificates;
};

/**
 * Check if account is a block producer.
 *
 * @param  address             Address of account to check.
 * @returns {Promise.<boolean>}
 */
exports.isBlockProducer = async function isBlockProducer(address) {
    const latestBlock = await chainData.getLatest();
    const account     = latestBlock.state.find(account => account.address == address);

    return !!account.certificates.length;
};

/**
 * Get all block producers.
 *
 * @returns {Promise.<Object[]>} List of accounts who has certificates as block producers.
 */
exports.getBlockProducers = async function getBlockProducers() {
    const latestBlock    = await chainData.getLatest();
    const blockProducers = latestBlock.state.filter(account => account.certificates.length);

    return blockProducers;
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

/**
 * Get delegates packed into object.
 *
 * @example
 * {
 *  '0x00...': 1000,
 *  '0x01...': 2000
 * }
 *
 * @returns {Promise.<Object>} Object contains delegates and their votes.
 */
async function getRawDelegates() {
    const latestBlock = await chainData.getLatest();

    const rawDelegates = latestBlock.state.reduce((rawDelegates, account) => {
        for (let v of account.votes) {
            if (!rawDelegates[v.delegate]) {
                rawDelegates[v.delegate] = 0;
            }

            rawDelegates[v.delegate] += parseInt(v.amount);
        }

        return rawDelegates;
    }, {});

    return rawDelegates;
}

/**
 * Get account by address from latest block.
 *
 * @param   address   Address of account to return.
 * @returns {Promise.<Object>} Account.
 */
async function getAccountFromLatestBlock(address) {
    const latestBlock = await chainData.getLatest();

    return getAccount(address, latestBlock);
}

/**
 * Finds account by address in the provided block.
 *
 * @param   address            Address of account to find.
 * @param   block              Block to find account.
 * @returns {Promise.<Object>} Account.
 */
async function getAccount(address, block) {
    const account = block.state.find(account => account.address == address);

    if (!account) {
        throw `Account '0x${address.toString('hex')}' not found`;
    }

    return account;
}

/**
 * Get all delegates sorted by their votes.
 *
 * @returns {Promise.<Object[]>|Object[]} Delegates array.
 */
async function getDelegates() {
    let delegates = await getRawDelegates();

    delegates = Object.keys(delegates).map(delegate => {
        return {
            delegate,
            voteAmount: delegates[delegate]
        };
    });

    delegates.sort((a,b) => b.voteAmount - a.voteAmount);

    return delegates;
}
