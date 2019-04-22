/**
 * @module test/unit/chain
 */

'use strict';

require('chai').should();

const Account    = require('core/account');
const blockchain = require('core/blockchain');
const Genesis    = require('lib/genesis');
const genesis    = require('genesis');

/**
 * Secret key used for testing.
 *
 * @type {String}
 */
const SECRET_KEY  = Buffer.from('557dce58018cf502a32b9b7723024805399350d006a4f71c3b9f489f7085cb50', 'hex');

describe('Blockchain', () => {
    let account        = {};
    let delegate       = {};
    let delegates      = [];
    let blockProducers = [];

    before('create', async () => {
        let serializedTx = {};
        const transactions = [];

        const genesisBlock = Genesis.genesisToBlock(genesis);

        account  = Account(SECRET_KEY);
        delegate = Account();

        serializedTx = account.tx(delegate.hexAddress, 100);
        transactions.push(serializedTx);

        serializedTx = account.vote(delegate.hexAddress);
        transactions.push(serializedTx);

        serializedTx = account.stake(100);
        transactions.push(serializedTx);

        account.produceBlock(genesisBlock, transactions);
    });

    it('get account balance', async () => {
        const balance = await blockchain.getBalance(account.hexAddress);

        balance.should.be.a('number');
    });

    xit('get account stake', async () => {
        const stake = await blockchain.getStake(account.hexAddress);

        stake.should.be.a('number');
    });

    it('get account votes', async () => {
        const votes = await blockchain.getVotesFor(delegate.hexAddress);

        // TODO: finish test
    });

    it('get all delegates', async () => {
        delegates = await blockchain.getDelegates();

        delegates.should.be.a('array');

        // TODO: TEST
    });

    it('get active delegates', async () => {
        const activeDelegates = await blockchain.getActiveDelegates();

        // TODO: TEST
    });

    it('get successor delegates', async () => {
        const successorDelegates = await blockchain.getSuccessorDelegates();

        // TODO: TEST
    });

    it('get delegates count', async () => {
        const count  = await blockchain.getDelegatesCount();

        count.should.be.a('number');

        // TODO: TEST
    });

    it('check if account is delegate', async () => {
        console.log(delegates[0])

        const isDelegate = await blockchain.isDelegate(delegates[0]);

        isDelegate.should.be.true;
    });

    it('get block producers', async () => {
        blockProducers = await blockchain.getBlockProducers();

        // TODO: TEST
    });

    xit('check if account is block producer', async () => {
        const isBlockProducer = await blockchain.isBlockProducer(blockProducers[0].address);

        isBlockProducer.should.be.true;
    });
});
