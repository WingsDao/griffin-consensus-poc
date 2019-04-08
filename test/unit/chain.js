/**
 * @module test/unit/chain
 */

'use strict';

require('chai').should();

const Account = require('core/account');
const chain = require('core/chain');

const SECRET_KEYS = [
    Buffer.from('557dce58018cf502a32b9b7723024805399350d006a4f71c3b9f489f7085cb50', 'hex'),
    Buffer.from('9d22d682fd4ad16b0f6e21eddfe46d7231fff8670507a184787f74d6538ab0bc', 'hex')
];

describe('Chain', () => {
    let account = {};
    let delegate = {};
    let delegates = [];

    before('create', () => {
        account = Account(SECRET_KEYS[0]);
        delegate = Account(SECRET_KEYS[1]);
    });

    it('get account balance', async () => {
        const balance = await chain.getBalance(account.getStrAddress());

        balance.should.be.a('number');

        console.log('Balance: ', balance);
    });

    xit('get account stake', async () => {
        const stake = await chain.getStake(account.getStrAddress());

        stake.should.be.a('number');

        console.log('Stake: ', stake);
    });

    it('get account votes', async () => {
        const votes = await chain.getVotesFor(delegate.getStrAddress());

        console.log('Votes: ', votes);
    });

    it('get all delegates', async () => {
        delegates = await chain.getDelegates();

        delegates.should.be.a('array');
        console.log('Delegates: ', delegates);
    });

    it('get active delegates', async () => {
        const activeDelegates = await chain.getActiveDelegates();

        console.log('Active delegates: ', activeDelegates);
    });

    it('get successor delegates', async () => {
        const successorDelegates = await chain.getSuccessorDelegates();

        console.log('Successor delegates', successorDelegates);
    });

    it('get delegatets count', async () => {
        const count  = await chain.getDelegatesCount();

        count.should.be.a('number');

        console.log('Count: ', count);
    });

    it('check account is delegate', async () => {
        const isDelegate = await chain.isDelegate(delegates[0]);

        isDelegate.should.be.true;
    });



});