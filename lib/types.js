'use strict';

/* block */
exports.block = {
    number:     'number',
    hash:       'string',
    parentHash: 'string',
    timestamp:  'number',
    producer:   'string',
    stateRoot:  'string',
    txRoot:     'string',
    logsRoot:   'string'
};

/* tx */
exports.tx = {
    from:  'string',
    to:    'number',
    nonce: 'number',
    value: 'number',
    data:  'string'
};

/* account */
exports.account = {
    secretKey:      'string',
    publicKey:      'string',
    address:        'string',
    nonce:          'number',
    balance:        'number',
    rating:         'number',
    lotteryTickets: 'array<string>',
    voteFor:        'string'
};
