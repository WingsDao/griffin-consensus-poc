/**
 * @module lib/random-math
 */

'use strict';

/**
 * Maximum value of a math.random() function
 * @type {Number}
 */
const MAX_RANDOM = exports.MAX_RANDOM = 1000;

/**
 * Generate random number
 *
 * @return {Number} Random number in range 0-1000
 */
exports.random = function random() {
    return parseInt(Math.random() * MAX_RANDOM);
};

/**
 * Generate final random number from Array of Numbers
 *
 * @param  {Number[]} arr Array of numbers for generating final one
 * @return {Number}       Final random number
 */
exports.finalRandom = function finalRandom(arr) {
    return parseInt(arr.reduce((a, v) => (a + v), 0) / arr.length);
};

/**
 * Calculate results of voting: sort every option by frequency.
 * Requirement for final random that has to be noted somewhere:
 *
 * @param  {Number[]} arr Array of final random numbers
 * @return {Object[]}     Array of voting options sorted by frequency of RN
 */
exports.votingResults = function calculateResults(arr) {
    const map = new Map();

    for (let value of arr) {
        map.has(value) && map.set(value, map.get(value) + 1) || map.set(value, 1);
    }

    const sorted = Array.from(map.entries()).sort((a, b) => (b[1] - a[1]));
    const result = sorted.map(([value, count]) => Object.assign({value, count}));

    return result;
};

/**
 * To find certificate index we calculate FRN percent from MAX_RANDOM value
 * and multiply it by total number of issued certificates (which may be changed on each block).
 *
 * @param  {Number}   frn       Final random to use
 * @param  {String[]} producers Array of producers' addresses to pick
 * @return {String}             Address of next block producer 
 */
exports.findProducer = function findProducer(frn, producers = []) {
    return producers[Math.floor(frn / MAX_RANDOM * producers.length)];
};
