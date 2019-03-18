## Core functionality test scenario

Actors:
- Alice - delegator
- Bob - delegator
- Clare - delegate
- Damir - delegate
- Elliot - block producer
- Fenrir - block producer

### Actions

#### 1. Send transaction

Alice sends `n` coins to Bob.

#### 2. Vote

Alice votes with `n` coins for Clare. Bob votes with `m` coins for Damir.

#### 3. Delegates generate random number

This step will result in random number which corresponds to some certificate owned by potential block producer.

#### 4. Produce block

Selected block producer produces block.

#### 5. Validate block

Clare and Damir validate produced block.

#### 6. Network participants receive block

New block was added. Actors receive it and verify that their transactions were included.
