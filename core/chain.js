/**
 * @module core/chain
 */
'use strict';

const chainData = require('core/chaindata')

/*
 - getVotesFor(addr) +
 - getBalance(addr) +
 - getStake(addr) +
 - getCertificates(addr) // not sure yet
 - getDelegates() (возможно, вариации типа getSuccessorDelegates() + getActiveDelegates())
 - getDelegatesCount()
 - getBlockProducers()
 - isBlockProducer(addr)
 - isDelegate(addr)
 */

function Chain() {
}

Chain.prototype.getBalance = function getBalance(address) {
    return getAccountFromLatestBlock(address).balance;
}

Chain.prototype.getStake = function getStake(address) {
    return getAccountFromLatestBlock(address).locked;
}

Chain.prototype.getVotesFor = function getVotesFor(address) {
    const latestBlock = chainData.getLatest();

    const votes = latestBlock.state.filter(account => {
        return account.votes.findIndex(delegate => delegate == address) >= 0;
    });

    return votes;
}

Chain.prototype.getCertificates = function getCertificates(address) {
    return getAccountFromLatestBlock(address).certificates;
}

Chain.prototype.getDelegates = function getDelegates() {
    let delegates = getRawDelegates();

    delegates = Object.keys(delegates).map(delegate => {
        return {
            delegate,
            voteAmount: delegates[delegate]
        };
    });

    delegates.sort((a,b) => a.voteAmount - b.voteAmount);

    return delegates;
}

Chain.prototype.getActiveDelegates = function getActiveDelegates() {
    return this.getDelegates().slice(0, 31);
}

Chain.prototype.getSuccessorDelegates = function getSuccessorDelegates() {
    return this.getDelegates().slice(31, 62);
}

Chain.prototype.getDelegatesCount = function getDelegatesCount() {
    const rawDelegates = getRawDelegates();

    return Object.keys(rawDelegates).length;
}

Chain.prototype.isDelegate = function isDelegate(address) {
    const rawDelegates = getRawDelegates();

    return rawDelegates[address] == undefined;
}

Chain.prototype.getBlockProducers = function getBlockProducers() {

}

Chain.prototype.isBlockProducer = function isBlockProducer(address) {

}

function getRawDelegates() {
    const latestBlock = chainData.getLatest();

    const rawDelegates = latestBlock.state.reduce((rawDelegates, account) => {
        for (let v in account.votes) {
            if (!rawDelegates[v.delegate]) {
                rawDelegates[v.delegate] = 0;
            }

            rawDelegates[v.delegate] += v.amount;
        }
    }, {});

    return rawDelegates;
}

function getAccountFromLatestBlock(address) {
    return getAccount(address, chainData.getLatest());
}

function getAccount(address, block) {
    const account = block.state.find(account => account.address == address);

    if (!account) {
        throw `Account '${account.address}' not found`;
    }

    return account;
}

module.exports = Chain;