/**
 * @module test/unit/chain
 */

'use strict';

require('chai').should();

const Account   = require('core/account');
const chaindata     = require('core/chaindata');
const genesis   = require('genesis');
const blockchain = require('core/blockchain');


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

    before('create', async () => {
        let serializedTx = {};
        const transactions = [];

        account  = Account(SECRET_KEY);
        delegate = Account();

        serializedTx = account.tx(delegate.getHexAddress(), 100);
        transactions.push(serializedTx);

        serializedTx = account.vote(delegate.getHexAddress());
        transactions.push(serializedTx);

        serializedTx = account.stake(100);
        transactions.push(serializedTx);

        account.produceBlock(genesis, transactions);
    });

    it('get account balance', async () => {
        const balance = await blockchain.getBalance(account.getHexAddress());

        balance.should.be.a('number');

        console.log('Balance:', balance);
    });

    xit('get account stake', async () => {
        const stake = await blockchain.getStake(account.getHexAddress());

        stake.should.be.a('number');

        console.log('Stake:', stake);
    });

    it('get account votes', async () => {
        const votes = await blockchain.getVotesFor(delegate.getHexAddress());

        console.log('Votes:', votes);
    });

    it('get all delegates', async () => {
        delegates = await blockchain.getDelegates();

        delegates.should.be.a('array');

        console.log('Delegates:', delegates);
    });

    it('get active delegates', async () => {
        const activeDelegates = await blockchain.getActiveDelegates();

        console.log('Active delegates:', activeDelegates);
    });

    it('get successor delegates', async () => {
        const successorDelegates = await blockchain.getSuccessorDelegates();

        console.log('Successor delegates:', successorDelegates);
    });

    it('get delegates count', async () => {
        const count  = await blockchain.getDelegatesCount();

        count.should.be.a('number');

        console.log('Count:', count);
    });

    it('check if account is delegate', async () => {
        const isDelegate = await blockchain.isDelegate(delegates[0]);

        isDelegate.should.be.true;

        console.log('is delegate:', isDelegate);
    });

    it('get block producers', async () => {
        blockProducers = await blockchain.getBlockProducers();

        console.log('block producers:', blockProducers);
    });

    it('check if account is block producer', async () => {
        const isBlockProducer = await blockchain.isBlockProducer(blockProducers[0].address);

        isBlockProducer.should.be.true;

        console.log('is block producer:', isBlockProducer);
    });
});
