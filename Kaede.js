const GameFunctions = require('./GameFunctions.js'); // modules included and global variables defined.
const MusicFunctions = require('./MusicFunctions.js');
const MiscFunctions = require('./MiscFunctions.js');
const Discord = require('discord.js');
const {prefix, token} = require('./auth.json');
const bot = new Discord.Client();
let gameInProgress = false;
const queue = new Map();

/* bot properties when bot is on */
bot.once('ready', () => {
    console.log('Kaede is at your service.'); 
    bot.user.setPresence({
        status: "online",
        game : {
            name : "^help",
            type : "PLAYING",
        }
    }); 
})

bot.on('message', async message => {
    if (!gameInProgress && message.content.substring(0, 1) === prefix && !message.author.bot) {
        var firstcmd = "help"
        if (message.content.length !== 1) {
            var arr = message.content.substring(1).split(' ');
            var firstcmd = arr[0];
            for (i = 0; i < arr.length; i++) {
                arr[i] = arr[i].toLowerCase();
            }
        }
        switch (firstcmd) {
            case "help":
                message.channel.send("in");
                break;
            case "test":
                message.channel.send("hello");
                break;
            case "play":
                if (arr.length === 1) {
                    message.channel.send(
                        "What game do you want to play? Type `^play [gameCMD]` to play the game.\n" +
                        ">>> Rock, paper & scissors; `= rps`\n" + 
                        "Guess the number; `= guess`\n" + 
                        "Answer most math questions; `= mm`\n" +
                        "hi"
                        );
                }
                else {
                    gameInProgress = true;
                    switch (arr[1]) {
                        case "rps":
                            await GameFunctions.rps(message);
                            break;
                        case "guess":
                            await GameFunctions.guessNumber(message);
                            break;
                        case "mm" :
                            await GameFunctions.mostMath(message);
                            break;
                        default:
                            message.channel.send("Kaede doesn't know that game!! <:illyapout:683110138235977758>");
                            break;
                    }
                    gameInProgress = false;
                }
                break;
            case "music":
                if (arr.length === 1) {
                    message.channel.send("Welcome to Kaede's music mode! Here is list of commands you can do!\n" +
                    "");
                }
                else {
                    const serverQueue = queue.get(message.guild.id);
                    switch (arr[1]) {
                        case "play":
                            MusicFunctions.play(message, serverQueue, queue);
                            break;
                        case "skip":
                            MusicFunctions.skip(message, serverQueue);
                            break;
                        case "pause":
                            MusicFunctions.pause(message, serverQueue);
                            break;
                        case "resume":
                            MusicFunctions.resume(message, serverQueue);
                            break;
                        default:
                            message.channel.send("This command is not in Kaede's music commands!!");
                            break;
                    }
                }
                break;
            default:
                message.channel.send("This is not a valid command.\nType ^ or ^help for Kaede's Kawaii commands! :heart:");
                break;
        }
    }
})

bot.login(token);
