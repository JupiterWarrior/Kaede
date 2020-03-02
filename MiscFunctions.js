module.exports = {sleep}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}