/**
 * Module used to implement Game functions for the Kaede Bot.
 */

module.exports = {
    rps, guessNumber, mostMath, blackJack, trivia
}

/* Constants defined. */
const HALF_MIN = 30000;

/* Module imports. */
const MiscFunctions = require('./MiscFunctions.js');
const fs = require('fs');
const Discord = require('discord.js');

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
                console.log(error);
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
                console.log(error);
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
        return m.author.id === message.author.id && (m.content === "&cancel" || !isNaN(num));
    }
    message.channel.send("Kaede wants you to answer as many math questions as possible in 30 seconds!! <:6185_No_game_no_life_1:683263289895157782>\nYou can cancel the game by typing &cancel!");
    const start = Date.now();
    var countCorrect = 0;
    var countTotal = 0;
    let answered = true;
    while (Date.now() - start <= HALF_MIN) {
        if (answered) {
            let num = MiscFunctions.randInt(1, 3);
            let op = num === 1 ? "+" : (num === 2 ? "-" : "*");
            let num1 = MiscFunctions.randInt(-9, 9);
            let num2 = MiscFunctions.randInt(-9, 9);
            var actualAns = op === openum.ADD ? num1 + num2 : (op === openum.SUB ? num1 - num2 : num1 * num2);
            let num2str = num2 >= 0 ? num2.toString() : "(" + num2.toString() + ")";
            await message.channel.send(num1 + " " + op + " " + num2str + "?");
        }
        answered = false;
        try {
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : HALF_MIN + start - Date.now(), errors: ['time']}); 
            if (collected.first().content === "&cancel") {
                message.channel.send("Kaede cancel!");
                return;
            }
            let answer = Number(collected.first().content);
            countCorrect = answer === actualAns ? countCorrect + 1 : countCorrect;
            ++countTotal;
            answered = true;
        } catch (error) {
            message.channel.send("Time's up!");
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

/**
 * Trivia game! MAIN LOGIC: people join in trivia by pressing on a reaction emoji and the bot waits for 30 seconds before starting the 
 * trivia game. if nobody join within the time interval, trivia is cancelled. You can have an option of a CPU joining or not. Each trivia can hold a max
 * of 5 people joining. Each trivia round has 6 questions. And each trivia game can be played with 1, 3 or 5 rounds. There will be numerous categories, 
 * and each round must be a different category than one another. At the last question of each round, the points obtained will be doubled. 
 * 
 * Each question is multiple choice (4 or 5 choices) and lasts for 15 seconds. First person to answer will get the most points, followed by the second and so on.
 * Trivia game also has multiple fun modes that can be added to the game. Example is: hardcore mode (10 secs each qn and negative scoring for wrong answers) 
 * underdog boost (points every round is increased in a y = mx linear scale where m is random between 1, 2, 3 and 5), mystery category (category for each round is random), 
 * mirror trivia (which one is the wrong answer?), etc. ADDITIONALLY, these modes can be combined together!!!
 * 
 * 
 * Trivia shall not be disturbed by anything else and music shall not be played (some questions require voice channel feature. Like in songs, anime (anime op or ed) , movies)
 * If music was playing, we will give a question to whether or not we can immediately stop the music playing. The &cancel command still applies in the middle of any trivia game round,
 * although all participating users must agree on stopping the game then it will end, immediately determining the winner. In the middle of trivia, if 3 consecutive (consecutiveness carries over to next round) questions were left unanswered,
 * except for CPU, then players will be considered AFK and game is cancelled (no winners). If a player is AFK ( 3 question consec) then the player will immediately be kicked out and the
 * score will be voided. 
 * 
 * Any additional features or suggestions can be made by contacting me (Elbert). Enjoy in implementing the game and always to not forget to pull
 * before modifying any code!!
 * 
 * Please note that questions are to be written MANUALLY in the "trivia.json" file, where the main js object have categories as its properties and each property is an array of question objects
 * where they have the question string, an image attachment (if present) and an mp3 file (if present), and the answers. (to be replaced by NULL if not present).
 * 
 */

// main trivia function to show all the categories and have a loop of rounds which calls each individual trivia function.
async function trivia(message, queue) {
    // EMBED MESSAGE THAT DISPLAYS welcome to trivia message, show categories, etc.
    //console.log("hvnt");
    const textChannel = message.channel;
    var triviaLobby = new Discord.MessageEmbed().setColor('#65E0F1').setTitle("Trivia Lobby").setTimestamp(Date.now()).setAuthor(
        'Kaede', 'https://vignette.wikia.nocookie.net/aobuta/images/5/5e/Kaede_regains_original_memories.png/revision/latest?cb=20181221013117' /* if have kaede website link put here*/).setDescription(
        'Click on the cruise ship icon to join the trivia game!').setFooter('Did you know Kaede has a website? Click on the link on Kaede\'s name!', 'https://external-preview.redd.it/PmVd8MTMoW70-aUU92H2YlHKO9ilnubtdyzVugj18vI.jpg?auto=webp&s=4150b336b0280d8934cbd3682f298c8750819273');
    textChannel.send(triviaLobby).then(async (message) => {
        message.react('🚢');
        const filter = (reaction) => reaction.emoji.name === '🚢' && !message.author.bot;
        let joiningPeople = await message.awaitReactions(filter, {time : HALF_MIN});
        joiningPeople.last().users //get user manager then fetch it to get map of users bla bla tomorrow la
    });
    l
    checkVoiceChannel(message, queue);
    //console.log("pass");
    
}

//trivia categories : check trivia.json file.
async function animeTrivia() {

}

async function songsTrivia() {

}
//etc etc add on functions.

/**
 * Helper function to check in start of every trivia game whether music is playing. 
 * Returns a boolean value representing whether music is successfully stopped.
 * @param {Object} message message object sent.
 * @param {Map<String, Object>} queue map that maps servers to its music queues.
 * @return {Boolean} To state whether the music has been stopped or not.
 */
async function checkVoiceChannel(message, queue) {
    const serverQueue = queue.get(message.guild.id);
    if (serverQueue && serverQueue.connection != null) {
        message.channel.send("Kaede cannot continue with the trivia game unless music is interrupted, is it okay?");
        const filter = m => {
            let msg = m.content.toLowerCase();
            let cond = msg === "yes" || msg === "no" || msg === "y" || msg === "n";
            return cond;
        }
        try {
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : HALF_MIN / 2, errors: ['time']});
            if (collected.first().content === "n" || collected.first().content === "no") {
                message.channel.send("Kaede cannot start trivia then!");
                return false;
            }
            else {
                serverQueue.voiceChannel.leave();
                queue.delete(message.guild.id);
                return true;
            }
        } catch (error) {
            message.channel.send("Kaede waited too long for this!");
            return false;
        }
    }
    return true;
}