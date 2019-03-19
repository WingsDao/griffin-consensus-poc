/**
 * @module test/unit/account
 */

'use strict';

require('chai').should();

const rlp     = require('rlp');
const Account = require('core/account');
const helpers = require('lib/helpers');

describe('Accounts', () => {
    let account = {};
    let target  = {};

    const AMOUNT_TO_STAKE = 100;
    const AMOUNT_TO_VOTE  = 100;

    before('create', () => {
        account = Account();
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

        const decodedTx = rlp.decode(serializedTx);

        const tx = helpers.toTxObject(decodedTx);

        console.log('tx object', tx);
    });

    it('vote tx', () => {
        const serializedTx = account.vote('0x' + target.address.toString('hex'), AMOUNT_TO_STAKE);

        console.log('Vote serialized tx:', serializedTx);
    });

    it('stake tx', () => {
        const serializedTx = account.stake(AMOUNT_TO_VOTE);

        console.log('Stake serialized tx:', serializedTx);
    });
});
