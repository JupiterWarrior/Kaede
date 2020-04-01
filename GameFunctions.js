/**
 * Module used to implement Game functions for the Kaede Bot.
 */

module.exports = {
    rps, guessNumber, mostMath, blackJack
}

/* Constants defined. */
const HALF_MIN = 30000;

/* Module imports. */
const MiscFunctions = require('./MiscFunctions.js');
const fs = require('fs');

/**
 * Helper function used to increment the game wins of the user for certain games. 
 * @param {String} playerId the unique id of the discord user.
 * @param {String} gameStat the game stat string to be updated on.
 */
async function incrementGameWins(playerId, gameStat) {
    fs.readFile('KaedeGameStats.json', 'utf8', async (error, data) => {
        if (error){
            console.log(err);
        } else {
        gameStatsObj = JSON.parse(data);

        if (!gameStatsObj[playerId]) {
            gameStatsObj[playerId] = {};
        }
        if (!gameStatsObj[playerId][gameStat]) {
            gameStatsObj[playerId][gameStat] = 0;
        }
        ++gameStatsObj[playerId][gameStat];
        json = JSON.stringify(gameStatsObj);
        fs.writeFile('KaedeGameStats.json', json, 'utf8', (error) => {
            if (error) {
                //console.log(error);
            }
        });
    }});
}

/**
 * Helper function to update the highscore of the user for certain games.
 * @param {String} playerId the unique id of the discord user.
 * @param {Number} newScore the new score the user just got.
 * @param {String} gameStat the game stat string to be updated on.
 */

async function checkForHighscore(playerId, newScore, gameStat) {
    fs.readFile('KaedeGameStats.json', 'utf8', (error, data) => {
        if (error){
            console.log(err);
        } else {
        gameStatsObj = JSON.parse(data);

        if (!gameStatsObj[playerId]) {
            gameStatsObj[playerId] = {};
        }
        if (!gameStatsObj[playerId][gameStat]) {
            gameStatsObj[playerId][gameStat] = 0;
        }
        gameStatsObj[playerId][gameStat] = Math.max(newScore, gameStatsObj[playerId][gameStat]); // Find max to find highscore
        json = JSON.stringify(gameStatsObj);
        fs.writeFile('KaedeGameStats.json', json, 'utf8', (error) => {
            if (error) {
                //console.log(error);
            }
        });
    }});
}

/**
 * The game function for the rock, paper & scissors game.
 * @param {Object} message the message object sent to play the game.
 */
async function rps(message) {
    const rpsenum = {
        ROCK : 1,
        PAPER : 2,
        SCISSORS : 3,
    }
    const filter = m => m.author.id === message.author.id;
    message.channel.send("Choose your weapon to go against Kaede!! :boxing_glove:");
    let draw = true;
    while (draw) {
        try {
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : HALF_MIN / 3, errors: ['time']});
            let kaedechoice = MiscFunctions.randInt(1, 3);
            if (kaedechoice === 1) {
                message.channel.send("rock!");
            }
            else if (kaedechoice === 2) {
                message.channel.send("paper!");
            }
            else if (kaedechoice === 3) {
                message.channel.send("scissors!");
            }
            let win = 3;
            await MiscFunctions.sleep(HALF_MIN / 30);
            switch (collected.first().content.toLowerCase()) {
                case "rock":
                    win = kaedechoice - rpsenum.ROCK;
                    break;
                case "scissors":
                    win = kaedechoice - rpsenum.SCISSORS;
                    break;
                case "paper":
                    win = kaedechoice - rpsenum.PAPER;
                    break;
                default:
                    message.channel.send("Kaede wants to play seriously!! <:4199_charlotte_ugh:683110139024113697>");
                    draw = false;
                    break;
            }
            if (win === 1 || win === -2) {
                message.channel.send("Kaede always wins <:Hehe:683109333411954767>");
                draw = false;
            }
            else if (win === 2 || win === -1) {
                message.channel.send("You cheated! <:illyapout:683110138235977758>");
                incrementGameWins(message.author.id, "rpsWins");
                draw = false;
            }
            else if (win === 0) {
                message.channel.send("one more time!");
            }
        } catch (error) {
            console.log(error);
            message.channel.send("Kaede waited too long!");
            break;
        }
    }
}
/**
 * The game function implementation for guess the number between 1-10.
 * @param {Object} message message object sent in order to play the game
 */
async function guessNumber(message) {
    const filter = m => {
        let num = Number(m.content);
        return m.author.id === message.author.id && !isNaN(num);
    }
    message.channel.send("You have 3 chances to guess Kaede's number! It's between 1 and 10 <:tachi_smile:683109333621669912> Hehehe, you'll never guess it!");
    let guessesLeft = 3;
    let correctNumber = MiscFunctions.randInt(1, 10);
    while (guessesLeft > 0) {
        try {
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : HALF_MIN / 3, errors: ['time']});
            let numberGuess = Number(collected.first().content);
            if (Number.isInteger(numberGuess) && numberGuess >= 1 && numberGuess <= 10) {
                --guessesLeft;
                let incorrectGuessString;
                if (numberGuess === correctNumber) {
                    incrementGameWins(message.author.id, "guessNumberWins");
                    message.channel.send("Whaaat, how did you know? <:illyapout:683110138235977758>")
                    return;
                } else if (numberGuess > correctNumber) {
                    incorrectGuessString = "Nope! Kaede's number is lower! :stuck_out_tongue_closed_eyes:";
                } else {
                    incorrectGuessString = "Nope! Kaede's number is higher! :stuck_out_tongue_closed_eyes:";
                }
                if (guessesLeft == 2) {
                    message.channel.send(incorrectGuessString + "You only have 2 more chances! <:KannaSip:683109333650899004>");
                } else if (guessesLeft == 1) {
                    message.channel.send(incorrectGuessString + "This is your final chance! <:KannaSip:683109333650899004>");
                }
            } else {
                message.channel.send("Kaede wants to play seriously!! <:4199_charlotte_ugh:683110139024113697>");
            }
        } catch (error) {
            message.channel.send("Kaede waited too long!");
            return;
        }
    }
    message.channel.send("Hehehe! Kaede wins! You're out of guesses <:02smug:683109333156102159> Kaede's number is " + correctNumber + "!");
}
/**
 * The game function used in the implementation of most math questions answered.
 * @param {Object} message message object sent to play the game.
 */
async function mostMath(message) {
    const openum = {
        ADD : "+",
        SUB : "-",
        MUL : "*",
    } // enumeration for operations
    const filter = m => {
        let num = Number(m.content);
        return m.author.id === message.author.id && !isNaN(num);
    }
    message.channel.send("Kaede wants you to answer as many math questions as possible in 30 seconds!! <:6185_No_game_no_life_1:683263289895157782>");
    const start = Date.now();
    var countCorrect = 0;
    var countTotal = 0;
    let answered = true;
    while (Date.now() - start <= HALF_MIN) {
        let actualAns;
        if (answered) {
            let op = "";
            let num = MiscFunctions.randInt(1, 3);
            if (num === 1) {
                op = "+";
            }
            else if (num === 2) {
                op = "-";
            }
            else {
                op = "*";
            }
            let num1 = MiscFunctions.randInt(-9, 9);
            let num2 = MiscFunctions.randInt(-9, 9);
            if (op === openum.ADD) {
                actualAns = num1 + num2;
            }
            else if (op === openum.SUB) {
                actualAns = num1 - num2;
            }
            else {
                actualAns = num1 * num2;
            }
            let num2str = num2 >= 0 ? num2.toString() : "(" + num2.toString() + ")";
            await message.channel.send(num1 + " " + op + " " + num2str + "?");
        }
        answered = false;
        try {
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : HALF_MIN + start - Date.now(), errors: ['time']}); 
            let answer = Number(collected.first().content);
            if (answer === actualAns) {
                countCorrect++;
            }
            ++countTotal;
            answered = true;
        } catch (error) {
            break;
        }
    }
    checkForHighscore(message.author.id, countCorrect, "mostMathHighscore");
    message.channel.send("Ta-da! You got " + countCorrect + " out of " + countTotal + " questions correctly!");
    if ((countCorrect * 100) / countTotal >= 90 && countTotal >= 15) {
        message.channel.send("Math Genius! <:AwOo:683109333327675393> Kaede likes you! :heartbeat:");
    }
    else if ((countCorrect * 100) / countTotal >= 80 && countTotal >= 10) {
        message.channel.send("Not bad at all! Kaede respects you! <:SataniaThumbsUp:683109334460268652>");
    }
    else if ((countCorrect * 100) / countTotal >= 60) {
        message.channel.send("<:KannaWhat:683109333331869703> Kaede expected more from you!")
    }
    else if ((countCorrect * 100) / countTotal >= 50) {
        message.channel.send("At least you passed! <:akkoShrug:683109333399109638>")
    }
    else {
        message.channel.send("Kaede's very disappointed in you! Kaede no like you! <:4199_charlotte_ugh:683110139024113697>")
    }
}
/**
 * Game implementation for blackjack in kaede bot.
 * @param {Object} message message object sent in order to play the game.
 */
async function blackJack(message) {

    // deal cards

    // game loop
    let gameOngoing = true;
    while (gameOngoing) {
        break;
    }
}