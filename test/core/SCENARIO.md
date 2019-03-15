## Core functionality test scenario

Actors:
- Alice - delegator
- Bob - delegator
- Clare - delegate
- Damir - delegate

### Actions

#### 1. Send transaction

Alice sends `n` coins to Bob.

#### 2. Vote

Alice votes with `n` coins for block producer (BP for short) Clare. Bob votes with `m` coins for BP Damir.

#### 3. Select next block producer

Next (random) block producer is selected.

#### 4. Produce block

Selected block producer produce block.

#### 5. Validate block

Other block producer validate produced block.

#### 6. Network participants receive block

New block was added. Actors receive it and verify that their transactions were included.
