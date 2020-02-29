module.exports = {
    rps, guessNumber, sleep
}

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
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : 10000, errors: ['time']});
            let kaedechoice = Math.ceil(Math.random() * 3);
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
            await sleep(800);
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
                    break;
            }
            if (win === 1 || win === -2) {
                message.channel.send("Kaede always wins <:Hehe:683109333411954767>");
                draw = false;
            }
            else if (win === 2 || win === -1) {
                message.channel.send("You cheated! <:illyapout:683110138235977758>");
                draw = false;
            }
            else if (win === 0) {
                message.channel.send("one more time!");
            }
        } catch (error) {
            message.channel.send("Kaede waited too long!");
            break;
        }
    }
}

async function guessNumber(message) {
    const filter = m => {
        let num = Number(m.content);
        return m.author.id === message.author.id && num !== NaN;
    }
    message.channel.send("You have 3 chances to guess my number! It's between 1 and 10 <:tachi_smile:683109333621669912> Hehehe, you'll never guess it!");
    let guessesLeft = 3;
    let correctNumber = Math.floor(Math.random() * 10 + 1);
    while (guessesLeft > 0) {
        try {
            let collected = await message.channel.awaitMessages(filter, {max: 1, time : 10000, errors: ['time']});
            let numberGuess = Number(collected.first().content);
            if (Number.isInteger(numberGuess) && numberGuess >= 1 && numberGuess <= 10) {
                --guessesLeft;
                let incorrectGuessString;
                if (numberGuess === correctNumber) {
                    message.channel.send("Whaaat, how did you know? <:illyapout:683110138235977758>")
                    return;
                } else if (numberGuess > correctNumber) {
                    incorrectGuessString = "Nope! Kaede's number is lower! :stuck_out_tongue_closed_eyes: ";
                } else {
                    incorrectGuessString = "Nope! Kaede's number is higher! :stuck_out_tongue_closed_eyes: ";
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
    message.channel.send("Hehehe! Kaede wins! You're out of guesses <:02smug:683109333156102159>");
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}