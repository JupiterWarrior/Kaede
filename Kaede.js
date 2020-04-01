/**
 * Main javascript file for the Kaede bot.
 * COPYRIGHT 2020 Elbert Ng, Jamie Sebastian ALL RIGHTS RESERVED.
 * Note from Elbert : Please check for the running times of certain algorithms in the code and see
 * whether the asymptotic running times of algorithms can be reduced; Please also make error handling better, we do not want the bot
 * to stop running just because of an error; Messages sent in the channel should be neater, more professional-looking and if possible, implement 
 * RichEmbed objects.
 */
 
/* Module Imports. */
const GameFunctions = require('./GameFunctions.js'); 
const MusicFunctions = require('./MusicFunctions.js');
const MiscFunctions = require('./MiscFunctions.js');
const Discord = require('discord.js');
const {prefix, token} = require('./auth.json');
const fs = require('fs');

/* Global Variables */
const bot = new Discord.Client();
let gameInProgress = false; // flag used to pause all actions when a game is in progress.
const queue = new Map(); // queue used to map servers to a certain 'serverQueue' for music.

/**
 *  What bot does when its "READY".
 */
bot.once('ready', () => {
    console.log('Kaede is at your service.'); 
    bot.user.setPresence({
        status: "online",
        activity : {
            name : "^help",
            type : "PLAYING",
        }
    }); 
})
/* Take actions when messages start with '^' and then execute if any commands satisfy the bot's available commands */
bot.on('message', async message => {
    if (message.content.substring(0, 1) === prefix && !message.author.bot) { //check prefix
        var firstcmd = "help"
        if (message.content.length !== 1) {
            var arr = message.content.substring(1).split(' ');
            var firstcmd = arr[0];
            for (i = 0; i < arr.length; i++) {
                arr[i] = arr[i].toLowerCase();
            } // split message in arrays where each element is classified by white spaces
        } // strings are also lower-cased to make case insensitive commands
        const serverQueue = queue.get(message.guild.id); // get the value associated with the server key
        switch (firstcmd) {
            case "help":
                message.channel.send("in progress"); // A RichEmbed structure that displays all the commands of kaede
                break;
            case "test":
                message.channel.send("hellooo <3"); // used for debugging, and etc ( temporary CMD )
                break;
            case "game": 
                if (!gameInProgress) {
                    if (arr.length === 1) {
                        message.channel.send(
                            "What game do you want to play? Type `^game gameCMD` to play the game. Kaede hint: GameCMD is the one in a different font.\n" +
                            ">>> Rock, paper & scissors; `rps`\n" + 
                            "Guess the number; `guess`\n" + 
                            "Answer most math questions; `mm`\n" +
                            "Best Game Incoming..."
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
                            case "mm":
                                await GameFunctions.mostMath(message);
                                break;
                            case "bjack":
                                await GameFunctions.blackJack(message);
                                break;
                            default:
                                message.channel.send("Kaede doesn't know that game!! <:illyapout:683110138235977758>");
                                break;
                        }
                        gameInProgress = false;
                    }
                }
                break;
            case "play":
            case "p":
                MusicFunctions.play(message, serverQueue, queue);
                break;
            case "s":
            case "skip":
                MusicFunctions.skip(message, serverQueue);
                break;
            case "ps":
            case "pause":
                MusicFunctions.pause(message, serverQueue);
                break;
            case "r":
            case "resume":
                MusicFunctions.resume(message, serverQueue);
                break;
            case "sall":
            case "skipall":
                MusicFunctions.skipAll(message, serverQueue);
                break;
            case "l":
            case "loop":
                MusicFunctions.loop(message, serverQueue);
                break;
            case "np":
            case "nowplaying":
                MusicFunctions.nowPlaying(message, serverQueue);
                break;
            case "q":
            case "queue":
                MusicFunctions.queue(message, serverQueue);
                break;
            case "rep":
            case "repeat":
                MusicFunctions.repeat(message, serverQueue);
                break;
            case "rem":
            case "remove":
                MusicFunctions.remove(message, serverQueue, arr.splice(1));
                break;
            case "f":
            case "first":
                MusicFunctions.first(message, serverQueue, Number(arr[1]));
                break;
            case "sw":
            case "swap":
                MusicFunctions.swap(message, serverQueue, Number(arr[1]), Number(arr[2]));
                break;
            case "prev":
            case "previous":
                MusicFunctions.previous(message, serverQueue, queue);
                break;
            case "playlist":
                switch (arr[1]) {
                    case "create":
                        MusicFunctions.createPlaylist(message, arr[2]);
                        break;
                    case "add":
                        MusicFunctions.addToPlaylist(message, arr);
                        break;
                    case "remove":
                        //TBD: if possible tiff do this so get familiar
                        break;
                    case "shuffle":
                        MusicFunctions.shufflePlaylist(message, arr[2], serverQueue, queue);
                        break;
                    default:
                        message.channel.send("This command is not in Kaede's playlist commands!!");
                        break;
                }
                break;
            case "profile": // used to display game profile stats by accessing appropriate JSON file
                fs.readFile('KaedeGameStats.json', 'utf8', (error, data) => {
                    if (error){
                        console.log(err);
                    } else {
                    gameStatsObj = JSON.parse(data);
                        
                    let playerId = message.author.id;
                    if (!gameStatsObj[playerId]) {
                        gameStatsObj[playerId] = {};
                    }
                    message.channel.send(message.author.username + "\n"
                     + "Rock Paper Scissors wins: " + (gameStatsObj[playerId]["rpsWins"] ? gameStatsObj[playerId]["rpsWins"] : 0) + "\n"
                     + "Guess Number wins: " + (gameStatsObj[playerId]["guessNumberWins"] ? gameStatsObj[playerId]["guessNumberWins"] : 0) + "\n"
                     + "Most Math Highscore: " + (gameStatsObj[playerId]["mostMathHighscore"] ? gameStatsObj[playerId]["mostMathHighscore"] : 0) + "\n"
                    );
                    
                }});
                break;
            default:
                message.channel.send("This is not a valid command.\nType ^ or ^help for Kaede's Kawaii commands! :heart:"); // if no commands match
                break;
        }
    }
})

bot.login(token); //Login to bot
