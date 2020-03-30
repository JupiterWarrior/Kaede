const GameFunctions = require('./GameFunctions.js'); // modules included and global variables defined.
const MusicFunctions = require('./MusicFunctions.js');
const MiscFunctions = require('./MiscFunctions.js');
const Discord = require('discord.js');
const {prefix, token} = require('./auth.json');
const bot = new Discord.Client();
const fs = require('fs');
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
    if (message.content.substring(0, 1) === prefix && !message.author.bot) {
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
                message.channel.send("in progress");
                break;
            case "test":
                message.channel.send("hellooo <3");
                break;
            case "play":
                if (!gameInProgress) {
                    if (arr.length === 1) {
                        message.channel.send(
                            "What game do you want to play? Type `^play gameCMD` to play the game. Kaede hint: GameCMD is the one in a different font.\n" +
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
            case "music":
                if (arr.length === 1) {
                    message.channel.send("Welcome to Kaede's music mode! Here is list of commands you can do!\n" +
                    "");
                }
                else {
                    const serverQueue = queue.get(message.guild.id);
                    switch (arr[1]) {
                        case "p":
                        case "play":
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
                            MusicFunctions.remove(message, serverQueue, Number(arr[2]));
                            break;
                        case "f":
                        case "first":
                            MusicFunctions.first(message, serverQueue, Number(arr[2]));
                            break;
                        case "sw":
                        case "swap":
                            MusicFunctions.swap(message, serverQueue, Number(arr[2]), Number(arr[3]));
                            break;
                        case "prev":
                        case "previous":
                            MusicFunctions.previous(message, serverQueue);
                            break;
                        case "playlist":
                        case "plist":
                            MusicFunctions.createPlaylist(message, arr[2]);
                            break;
                        case "add":
                            if (arr.length == 3) {
                                message.channel.send("Please choose a song name!");
                                break;
                            }
                            var songStr = "";
                            for (i = 3; i < arr.length; ++i) {
                                songStr = songStr + arr[i] + " ";
                            }
                            songStr = songStr.trim();
                            console.log(songStr);
                            MusicFunctions.addToPlaylist(message, arr[2], songStr);
                            break;
                        default:
                            message.channel.send("This command is not in Kaede's music commands!!");
                            break;
                    }
                }
                break;
            case "profile":
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
                message.channel.send("This is not a valid command.\nType ^ or ^help for Kaede's Kawaii commands! :heart:");
                break;
        }
    }
})

bot.login(token);
