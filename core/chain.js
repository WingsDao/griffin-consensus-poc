/**
 * @module core/chain
 */
'use strict';

const chainData = require('core/chaindata');

/**
 * Returns balance of account.
 *
 * @param   address            Address of account.
 * @returns {Promise.<Number>} Balance of account.
 */
exports.getBalance = async function getBalance(address) {
    const account = await getAccountFromLatestBlock(address);

    return account.balance;
};

/**
 * Returns stake of account.
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
 * Returns votes for account.
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
 * Get all delegates sorted by their votes.
 *
 * @returns {Promise.<Object[]>} Delegates array.
 */
exports.getDelegates = async function getDelegates() {
    let delegates = await getRawDelegates();

    delegates = Object.keys(delegates).map(delegate => {
        return {
            delegate,
            voteAmount: delegates[delegate]
        };
    });

    delegates.sort((a,b) => b.voteAmount - a.voteAmount);

    return delegates;
};

/**
 * Returns 31 active delegates.
 *
 * @returns {Promise.<Object[]>}
 */
exports.getActiveDelegates = async function getActiveDelegates() {
    const delegates = await this.getDelegates();

    return delegates.slice(0, 31);
};

/**
 * Returns 31 successor delegates.
 *
 * @returns {Promise.<Object[]>}
 */
exports.getSuccessorDelegates = async function getSuccessorDelegates() {
    const delegates = await this.getDelegates();

    return delegates.slice(31, 62);
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
 * @todo getBlockProducers function
 * @todo isBlockProducer function
 */

/**
 * Returns delegates as object.
 *
 * @example
 * {
 *  '0x00...': 1000,
 *  '0x01...': 2000
 * }
 *
 * @returns {Promise.<Object>} Object contains delegates and their votes.s
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
};

/**
 * Returns account by address from latetst block.
 *
 * @param   address   Address of account to return.
 * @returns {Promise.<Object>} Account.
 */
async function getAccountFromLatestBlock(address) {
    const latestBlock = await chainData.getLatest();

    return getAccount(address, latestBlock);
};

/**
 * Finds account in the block.
 *
 * @param   address            Address of account to find.
 * @param   block              Block to find account.
 * @returns {Promise.<Object>} Account.
 */
async function getAccount(address, block) {
    const account = block.state.find(account => account.address == address);

    if (!account) {
        throw `Account '${address.toString('hex')}' not found`;
    }

    return account;
};