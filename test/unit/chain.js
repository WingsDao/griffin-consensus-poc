/**
 * @module test/unit/chain
 */

'use strict';

require('chai').should();

const Account = require('core/account');
const chain   = require('core/chain');


/**
 * Secret key used for testing.
 *
 * @type {String}
 */
const SECRET_KEY = Buffer.from('557dce58018cf502a32b9b7723024805399350d006a4f71c3b9f489f7085cb50', 'hex');

describe('Chain', () => {
    let account        = {};
    let delegate       = {};
    let delegates      = [];
    let blockProducers = [];

    before('create', () => {
        account = Account(SECRET_KEY);
        delegate = Account();
    });

    it('get account balance', async () => {
        const balance = await chain.getBalance(account.getHexAddress());

        balance.should.be.a('number');

        console.log('Balance:', balance);
    });

    xit('get account stake', async () => {
        const stake = await chain.getStake(account.getHexAddress());

        stake.should.be.a('number');

        console.log('Stake:', stake);
    });

    it('get account votes', async () => {
        const votes = await chain.getVotesFor(delegate.getHexAddress());

        console.log('Votes:', votes);
    });

    it('get all delegates', async () => {
        delegates = await chain.getDelegates();

        delegates.should.be.a('array');

        console.log('Delegates:', delegates);
    });

    it('get active delegates', async () => {
        const activeDelegates = await chain.getActiveDelegates();

        console.log('Active delegates:', activeDelegates);
    });

    it('get successor delegates', async () => {
        const successorDelegates = await chain.getSuccessorDelegates();

        console.log('Successor delegates:', successorDelegates);
    });

    it('get delegates count', async () => {
        const count  = await chain.getDelegatesCount();

        count.should.be.a('number');

        console.log('Count:', count);
    });

    it('check if account is delegate', async () => {
        const isDelegate = await chain.isDelegate(delegates[0]);

        isDelegate.should.be.true;

        console.log('is delegate:', isDelegate);
    });

    it('get block producers', async () => {
        blockProducers = await chain.getBlockProducers();

        console.log('block producers:', blockProducers);
    });

    it('check if account is block producer', async () => {
        const isBlockProducer = await chain.isBlockProducer(blockProducers[0].address);

        isBlockProducer.should.be.true;

        console.log('is block producer:', isBlockProducer);
    });
});