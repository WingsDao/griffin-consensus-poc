/**
 * @module test/unit/account
 */

'use strict';

require('chai').should();

const Account = require('core/account');
const helpers = require('lib/helpers');
const genesis = require('genesis');
const parser  = require('lib/parser');

/**
 * Secret key used for testing.
 *
 * @type {String}
 */
const SECRET_KEY = Buffer.from('557dce58018cf502a32b9b7723024805399350d006a4f71c3b9f489f7085cb50', 'hex');

describe('Accounts', () => {
    let account = {};
    let target  = {};

    const AMOUNT_TO_STAKE = 200;
    const AMOUNT_TO_VOTE  = 100;

    let transactions = [];

    before('create', () => {
        account = Account(SECRET_KEY);
        target  = Account();
    });

    it('correct secret key format', () => {
        const {secretKey} = account;

        secretKey.length.should.be.equal(32);
        (secretKey.constructor === Buffer).should.be.true;
    });

    it('correct public key format', () => {
        const {publicKey} = account;

        publicKey.length.should.be.equal(64);
        (publicKey.constructor === Buffer).should.be.true;
    });

    it('correct address format', () => {
        const {address} = account;

        address.length.should.be.equal(20);
        (address.constructor === Buffer).should.be.true;
    });

    it('standard tx', () => {
        const serializedTx = account.tx('0x' + target.address.toString('hex'), '0xff');

        console.log('Standard serialized tx:', serializedTx);

        transactions.push(serializedTx);

        const tx = helpers.toTxObject(serializedTx);

        console.log('tx object', tx);

        tx.from.should.be.equal('0x' + account.address.toString('hex'));
    });

    it('vote tx', () => {
        const serializedTx = account.vote('0x' + target.address.toString('hex'), AMOUNT_TO_STAKE);

        console.log('Vote serialized tx:', serializedTx);

        transactions.push(serializedTx);
    });

    it('stake tx', () => {
        const serializedTx = account.stake(AMOUNT_TO_VOTE);

        console.log('Stake serialized tx:', serializedTx);

        transactions.push(serializedTx);
    });

    it('produce first block and get list of delegates', () => {
        const block = account.produceBlock(genesis, transactions);

        console.log('New block:', block.state[0]);

        const normalizedState = parser(block.state);

        console.log('Delegates:', normalizedState.delegates);
        console.log('Amount of certificates:', normalizedState.totalCertificates);
    });

    xit('produce second block', () => {

    });
});
