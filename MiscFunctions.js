/**
 * Module for Miscellaneous functions used in the implementation of the Kaede bot.
 */

module.exports = {sleep, randInt}

/**
 * A sleep function implemented in Javascript
 * @param {Number} milliseconds the time in milliseconds to delay
 */
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * Generates a random integer between start and end numbers inclusive. If start or end are not integers, 
 * start will be rounded up to the nearest integer and end will be rounded down to the nearest integer.
 * @param {Number} start the starting range of integer.
 * @param {Number} end the end range of integer.
 */
function randInt(start, end) {
    start = Math.ceil(start);
    end = Math.floor(end);
    return Math.floor(start + Math.random() * end);
}
