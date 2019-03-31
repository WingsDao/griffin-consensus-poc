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
    let block   = {};
    let signedMessage = {};

    const AMOUNT_TO_STAKE = 200;
    const AMOUNT_TO_VOTE  = 100;
    const MESSAGE = 'hello, this is some message';

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
        const toAddress    = '0x' + target.address.toString('hex');
        const serializedTx = account.tx(toAddress, '0xff');

        transactions.push(serializedTx);

        const tx = helpers.toTxObject(serializedTx);

        tx.from.should.be.equal('0x' + account.address.toString('hex'));
        tx.to.should.be.equal(toAddress);
    });

    it('vote tx', () => {
        const serializedTx = account.vote('0x' + target.address.toString('hex'), AMOUNT_TO_STAKE);

        transactions.push(serializedTx);
    });

    it('stake tx', () => {
        const serializedTx = account.stake(AMOUNT_TO_VOTE);

        transactions.push(serializedTx);
    });

    it('produce first block and get list of delegates', () => {
        block = account.produceBlock(genesis, transactions);

        console.log('New block:', block.state[0]);
    });

    it('parse block state', () => {
        const normalizedState = parser(block.state);

        console.log('Delegates:', normalizedState.delegates);
        console.log('Amount of certificates:', normalizedState.totalCertificates);
    });

    it('sign message with account secret key', () => {
        signedMessage = account.signMessage(MESSAGE);

        signedMessage.message.should.be.string;
        signedMessage.signature.length.should.be.equal(64);
        signedMessage.publicKey.length.should.be.equal(64);
        console.log('Signed message: ', signedMessage);
    });

    it('verify signed message', () => {
        const verified = Account.verifyMessage(signedMessage);
        verified.should.be.true;
    });

    it('verify signed message by public key', () => {
        const verified = Account.verifyMessage(signedMessage, account.publicKey);
        verified.should.be.true;
    });

    it('verify signed message with wrong message', () => {
        signedMessage.message = 'not that message';
        const verified = Account.verifyMessage(signedMessage);
        signedMessage.message = MESSAGE;
        verified.should.be.false;
    });

    it('verify signed message with wrong public key', () => {
        const verified = Account.verifyMessage(signedMessage, target.publicKey);
        verified.should.be.false;
    });

    xit('produce second block', () => {

    });
});
