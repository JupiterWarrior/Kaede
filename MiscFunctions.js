/**
 * Module for Miscellaneous functions used in the implementation of the Kaede bot.
 */

module.exports = {sleep}

/**
 * A sleep function implemented in Javascript
 * @param {*} milliseconds the time in milliseconds to delay
 */
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}