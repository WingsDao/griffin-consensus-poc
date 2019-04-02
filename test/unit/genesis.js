/**
 * @module test/unit/genesis
 */

'use strict';

require('chai').should();

const rb      = require('crypto').randomBytes;
const Genesis = require('lib/genesis');

describe('Create genesis', () => {
    let genesis;
    let address;
    let amount;

    before('initiate genesis', () => {
        genesis = Genesis();
    });

    beforeEach('generate random address and amount', () => {
        address = '0x' + rb(20).toString('hex');
        amount  = Math.round(Math.random() * 100);
    });

    it('add block producer', () => {
        genesis.addProducer(address, amount);

        const allocObject = findAllocatedObject(genesis, address);

        allocObject.certificates.length.should.be.equal(amount);
        allocObject.balance.should.be.equal(0);
    });

    it('add delegate', () => {
        genesis.addDelegate(address, amount);

        const allocObject = findAllocatedObject(genesis, address);

        allocObject.votes[0].should.be.equal(address);
        allocObject.balance.should.be.equal(amount);
    });

    it('add account', () => {
        genesis.addAccount(address, amount);

        const allocObject = findAllocatedObject(genesis, address);

        allocObject.balance.should.be.equal(amount);
    });
});

/**
 * Find allocated object in genesis by account address.
 *
 * @param  {Genesis} genesis Object where to look for account.
 * @param  {String}  address Address of account to find.
 * @return {Object}          Found account.
 */
function findAllocatedObject(genesis, address) {
    return (genesis.alloc.find(el => (Object.keys(el)[0] === address)))[address];
}
