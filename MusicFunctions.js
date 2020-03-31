/*To do music commands:
// playlist commands to do( playlists are stored in json file for certain diff servers) *implementation of a 4D array*
Shuffle ( shuffles the playlist )
remove (from playlist)
delete (delete playlist completely)
rename ( rename the playlist )
list (show the songs in a particular playlist)
playlists (show all playlists in server)
// Additional stuff
TBD: add a next page icon for selection of songs ( make it top 15 or top 20)
TBD: add a password and higher security level for validations of deleting playlist or renaming playlist when doing playlists function
Idea: ASK for password through personal messaging by bot when deleting a certain playlist.
NOTE: playlists can only be modified by the author who created it.
*/

/**
 * Module used to implement the Music Functions.
 */

module.exports = {play, skip, skipAll, pause, resume, loop, nowPlaying, 
queue, repeat, remove, first, swap, previous, createPlaylist, addToPlaylist}

/**
 * Global variables and module imports defined.
 */

const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const url = require('url');
const querystring = require('querystring');
const entities = require('html-entities').AllHtmlEntities;
const https = require('https');
const BASE_URL = 'https://www.youtube.com/results?';
const fs = require('fs');
var prev;

/**
 * The main function used to play music in the Kaede bot.
 * Music is obtained from youtube videos.
 * @param {Object} message the message object used to play music.
 * @param {Object} serverQueue the queue object in the current server.
 * @param {Map<String, Object>} queue a global map that maps servers to its queues.
 */
async function play(message, serverQueue, queue) {
    const song = message.content.substring(6); //takes the string of message from excluding '^play '
    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) {
        message.channel.send("Kaede cannot play music if you are not in a voice channel!");
        return;
    }
    const permissions = voiceChannel.permissionsFor(message.client.user); //check permissions
    if (!permissions.has('CONNECT')) {
        message.channel.send("Kaede is not allowed to join the voice channel!");
    }
    if (!permissions.has('SPEAK')) {
        message.channel.send('Kaede is not allowed to speak in the voice channel!');
    }
    let songInfo;
    try {
        songInfo = await getYoutubeInfo(song); 
    } catch (error) {
        message.channel.send("Kaede cannot find any songs with that title!");
        return;
    }
    const songInfoEmbed = new Discord.RichEmbed().setColor(
    'AQUA').setTitle('Top 5 songs').setAuthor('Kaede', message.client.user.avatarURL /* if have kaede website link put here*/).setImage(
    'https://vignette.wikia.nocookie.net/assassination-classroom/images/f/f0/Kaede_kayano_Profil.jpg/revision/latest/top-crop/width/360/height/450?cb=20160304163916&path-prefix=de')
    .setDescription('Kaede does not know what you want! So you choose...').addField(
    'Song number 1', songInfo[0].title, false).addField(
    'Song number 2', songInfo[1].title, false).addField(
    'Song number 3', songInfo[2].title, false).addField(
    'Song number 4', songInfo[3].title, false).addField(
    'Song number 5', songInfo[4].title, false).setFooter(
    'Tip: Kaede can do more cool stuff than this! Check out ^help!', 'https://www.googlecover.com/_asset/_cover/Anime-Girl-Winking_780.jpg'); // RichEmbed object created to display top 5 songs 
    const chooseFilter = m => {
        let choice = Number(m.content);
        let cond =  m.author.id === message.author.id && !isNaN(choice);
        return cond && choice >= 1 && choice <= 5 && Number.isInteger(choice);
    } 
    message.channel.send(songInfoEmbed);
    try {
        let collected = await message.channel.awaitMessages(chooseFilter, {max: 1, time: 30000, errors : ['time']});
        var index = Number(collected.first().content);
    } catch (error){
        message.channel.send("Kaede waited too long for this!");
        return;
    }
    const songData = {
        title : songInfo[index - 1].title,
        url : songInfo[index - 1].link,
        description : songInfo[index - 1].description,
    };
    if (typeof serverQueue === "undefined") {
        const queueFields = { // queuefields is the same as serverQueue.
            textChannel : message.channel,
            voiceChannel : voiceChannel,
            connection : null,
            songs : [],
            volume : 5,
            playing : true,
            looping: false,
            repeating: false,
        };
        queue.set(message.guild.id, queueFields);
        queueFields.songs.push(songData);
        message.channel.send("Kaede has added " + songData.title + " to the queue!");
        try {
            var connection = await voiceChannel.join();
            queueFields.connection = connection;
            dispatchSong(message, queueFields.songs[0], queue); 
        } catch (error) {
            //console.log(error);
            queue.delete(message.guild.id);
            message.channel.send("Kaede found an error in playing the music!");
            return;
        }
    }
    else {
        serverQueue.songs.push(songData);
        message.channel.send("Kaede has added " + songData.title + " to the queue!");
        if (!serverQueue.connection) {
            try {
                var connection = await voiceChannel.join(); //wait for Kaede to join voice channel
                serverQueue.connection = connection;
            } catch (error) {
                //console.log(error);
                queue.delete(message.guild.id);
                message.channel.send("Kaede found an error in playing the music!");
                return;
            }
        }
    }
}

/**
 * A helper function used to play the video stream and to check for next songs.
 * @param {Object} message message object which is sent by the user to play a song.
 * @param {Object} song the song object to be played in the stream.
 * @param {Map<String, Object>} queue a global map used to map servers to certain serverQueues.
 */
async function dispatchSong(message, song, queue) {
    const serverQueue = queue.get(message.guild.id);

    if (!song) {
        const filter = m => {
            let theMessage = m.content.toLowerCase();
            return theMessage.startsWith("^play ");
        }
        try {
            await message.channel.awaitMessages(filter, {max: 1, time : 120000, errors : ['time']}); // Kaede waits 2 minutes for new songs to be played before leaving the voice channel
            // will trigger play from Kaede.js, we check every second until added to queue
            var checkIfPlayDone = setInterval(() => {
                if (serverQueue.songs && serverQueue.songs[0]) {
                    dispatchSong(message, serverQueue.songs[0], queue);
                    clearInterval(checkIfPlayDone);
                }
            }, 1000);
            // in case cannot find music with that name
            var checkPreviousInterval = setInterval(() => {
                clearInterval(checkIfPlayDone);
                clearInterval(checkPreviousInterval);
            }, 10000);
        } catch (error) {
            //console.log(error);
            serverQueue.voiceChannel.leave();
            queue.delete(message.guild.id);
            message.channel.send("Kaede's bored.. Leaving now!");
            return;
        }
    } else {
        const dispatcher = serverQueue.connection.playStream(ytdl(song.url)).on('end', () => { 
            if (!serverQueue.looping && !serverQueue.repeating) { // on end of stream, check whether it is looping or repeating ( to check whether array is shifted or not )
                prev = serverQueue.songs[0];
                serverQueue.songs.shift();
            }
            if (serverQueue.repeating) {
                serverQueue.repeating = false;
            }
            dispatchSong(message, serverQueue.songs[0], queue);
        }).on('error', () => {
            message.channel.send("Unexpected error occured!! Kaede's scared...");
            //console.error(error);
        });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }
}
/**
 * Music function implemented to skip songs for the Kaede bot.
 * @param {Object} message message object sent to skip a song.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function skip(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot skip unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to skip!");
        return;
    }
    serverQueue.connection.dispatcher.end();
    message.channel.send("Kaede Skip!")
}

/**
 * Music function implemented to skip all the songs in the server queue.
 * @param {Object} message message object sent to skip all the songs.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function skipAll(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot skip all the songs unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to skip!");
        return;
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    message.channel.send("Kaede skip all!");
}

/**
 * Music function implemented to pause the music.
 * @param {Object} message message object sent to pause the music.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function pause(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot pause unless you're in a voice channel !");
        return;
    }
    if (!serverQueue) {
        message.channel.send("No song is playing!");
        return;
    }
    if (!serverQueue.playing) {
        message.channel.send("Kaede paused already!");
        return;
    }
    serverQueue.connection.dispatcher.pause();
    serverQueue.playing = !serverQueue.connection.dispatcher.paused;
    message.channel.send("Kaede pause!");
}

/**
 * Music function implemented to resume (unpause) the music.
 * @param {Object} message message object sent to unpause the music.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function resume(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot resume unless you're in a voice channel !");
        return;
    }
    if (!serverQueue) {
        message.channel.send("No song is paused!");
        return;
    }
    if (serverQueue.playing) {
        message.channel.send("Kaede is playing music already!");
        return;
    }
    serverQueue.connection.dispatcher.resume();
    serverQueue.playing = !serverQueue.connection.dispatcher.paused;
    message.channel.send("Kaede resume!");
}

/**
 * Music function implemented to loop the currently playing song.
 * @param {Object} message message object sent to loop the song.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function loop(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot start looping songs unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to loop!");
        return;
    }
    serverQueue.looping = !serverQueue.looping;
    serverQueue.repeating = false;
    if (serverQueue.looping) {
        message.channel.send("Song is now looping!");
    } else {
        message.channel.send("Song is no longer looping!");
    }
}

/**
 * Music function implemented to display the currently playing song
 * @param {Object} message message object sent to show the "now playing"
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function nowPlaying(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot show the songs playing unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song playing!");
        return;
    }

    message.channel.send("Kaede is currently playing " + serverQueue.songs[0].title);
}

/**
 * Music function implemented to show the queue of songs.
 * @param {Object} message message object sent to display the queue.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function queue(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot show the songs playing unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song playing!");
        return;
    }

    let songsQueueMessage = "Kaede is queueing these songs!\nNow playing: " + serverQueue.songs[0].title + "\n";
    for (let i = 1; i < serverQueue.songs.length; ++i) {
        songsQueueMessage += ("" + i + ". " + serverQueue.songs[i].title + "\n");
    }
    message.channel.send(songsQueueMessage);
}

/**
 * Music function implemented to repeat the song. Repeating the song only repeats the song once.
 * @param {Object} message message object sent to repeat the music.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function repeat(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot start repeating songs unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to repeat!");
        return;
    }
    if (serverQueue.looping) {
        message.channel.send("Song is already looping!");
        return;
    }
    if (serverQueue.repeating) {
        message.channel.send("Kaede is repeating the song!\nTo repeat the song forever use ^music loop!");
        return;
    }
    message.channel.send("Kaede repeat!");
    serverQueue.repeating = true;
}
/**
 * Music function implemented to remove a certain song from the queue. The song must not be currently playing.
 * @param {Object} message message object sent to remove a song from the queue.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 * @param {Number} index the index of the song in the queue.
 */
function remove(message, serverQueue, index) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot remove a song unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to remove!");
        return;
    }
    if ((!index && index !== 0) || isNaN(index)) { // index = 0 makes !index true
        message.channel.send("Kaede has no idea which song to remove!");
        return;
    }
    if (index < 1 || index >= serverQueue.songs.length) {
        message.channel.send("Kaede cannot find that song in the queue!");
        return;
    }
    serverQueue.songs.splice(index, 1);
    message.channel.send("Kaede remove!");
}
/**
 * Music function implemented to prioritize a certain song from the queue. 
 * @param {Object} message message object sent to prioritize a particular song.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 * @param {Number} index the index of the song in the queue.
 */
function first(message, serverQueue, index) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot prioritize a song unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to prioritize!");
        return;
    }
    if ((!index && index !== 0) || isNaN(index)) { // index = 0 makes !index true
        message.channel.send("Kaede has no idea which song to prioritize!");
        return;
    }
    if (index < 1 || index >= serverQueue.songs.length) {
        message.channel.send("Kaede cannot find that song in the queue!");
        return;
    }
    if (index === 1) {
        message.channel.send("The song will play right after the current song already! Don't make Kaede state obvious things!!");
        return;
    }
    message.channel.send("Kaede first!");
    let temp = serverQueue.songs[1];
    serverQueue.songs[1] = serverQueue.songs[index];
    serverQueue.songs[index] = temp;
}

/**
 * Music function implemented to swap the 2 positions of songs in the queue.
 * @param {Object} message message object sent to swap 2 songs.
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 * @param {Number} index1 the index position of the first song.
 * @param {Number} index2 the index position of the second song.
 */
function swap(message, serverQueue, index1, index2) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot swap 2 songs unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no songs for Kaede to swap!");
        return;
    }
    if ((!index1 && index1 !== 0) || isNaN(index1) || (!index2 && index2 !== 0) || isNaN(index2)) { // index = 0 makes !index true
        message.channel.send("Kaede has no idea which songs to swap!");
        return;
    }
    if (index1 < 1 || index2 < 1 || index2 >= serverQueue.songs.length || index1 >= serverQueue.songs.length) {
        message.channel.send("Kaede cannot find those songs in the queue!");
        return;
    }
    if (index1 === index2) {
        message.channel.send("Kaede is confused why you are swapping the same songs?");
        return;
    }
    let temp = serverQueue.songs[index1];
    serverQueue.songs[index1] = serverQueue.songs[index2];
    serverQueue.songs[index2] = temp;
    message.channel.send("Kaede Swap!");
}

/**
 * Music function implemented to add the previously played song back into the queue. If the previous song is undefined, then no song will be
 * added into the queue.
 * @param {Object} message message object sent to add the previous song
 * @param {Object} serverQueue an object used to store all the properties, including an array containing the list of songs to be played.
 */
function previous(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot skip all the songs unless you're in a voice channel !");
        return;
    }
    if (!serverQueue || !serverQueue.songs || serverQueue.songs.length == 0) {
        message.channel.send("There's no song for Kaede to skip!");
        return;
    }
    if (!prev) {
        message.channel.send("There is no previous song!");
        return;
    }
    serverQueue.songs.push(prev);
    message.channel.send("Kaede has added " + prev.title + " back into the queue!");
}

/* Playlist functions */

/**
 * Function to create a playlist of songs and store the playlist inside a JSON file.
 * @param {Object} message message object sent to create the playlist.
 * @param {String} name the name of the playlist to be created.
 */
async function createPlaylist(message, name) {
    fs.readFile('Playlists.json', 'utf8', async (error, data) => {
        if (error){
            console.log(error);
        } 
        else {
            playlists = JSON.parse(data);
            if (!playlists[message.guild.id]) {
                playlists[message.guild.id] = {};
            }
            if (!playlists[message.guild.id][message.author.id]) {
                playlists[message.guild.id][message.author.id] = {};
            }
            if (!playlists[message.guild.id][message.author.id][name]) {
                playlists[message.guild.id][message.author.id][name] = [];
            }
            else {
                message.channel.send("Kaede has already created a playlist with this name!");
                return;
            }
            playlists[message.guild.id][message.author.id][name] = []; //4D array with server, author, name of playlist and songs as its dimensions
            json_format_string = JSON.stringify(playlists);
            fs.writeFile('Playlists.json', json_format_string, 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            });
            message.channel.send("Kaede has created a playlist of name " + name + ", requested by " + message.author.username + "!");
        }
    })
}

/**
 * Function to add a particular song into the a specific playlist. Only the author of the playlist can add song to the playlist.
 * @param {Object} message message object sent to add a song to the playlist.
 * @param {String} playlistName the name of the playlist to add the song into.
 * @param {String} songName the name of song to be added.
 */
async function addToPlaylist(message, playlistName, songName) {
    fs.readFile('Playlists.json', 'utf8', async (error, data) => {
        if (error){
            console.log(error);
        } 
        else {
            playlists = JSON.parse(data);
            if (!playlists[message.guild.id]) {
                message.channel.send("Kaede cannot find any playlists in this server!");
                return;
            }
            if (!playlists[message.guild.id][message.author.id]) {
                message.channel.send("Kaede cannot find any playlists created by " + message.author.username + "!");
                return;
            }
            if (!playlists[message.guild.id][message.author.id][playlistName]) {
                message.channel.send("Kaede cannot find any playlists created by " + message.author.username + " with the name " + playlistName + "!");
                return;
            }
            let songInfo;
            try {
                songInfo = await getYoutubeInfo(songName);
            } catch (error) {
                message.channel.send("Kaede cannot find any songs with that title!");
                return;
            }
            const songInfoEmbed = new Discord.RichEmbed().setColor(
            '#F8C300').setTitle('Top 5 songs to be added to playlist').setAuthor('Kaede', message.client.user.avatarURL /* if have kaede website link put here*/).setImage( //create a RichEmbed to display top 5 songs.
            'https://manga.tokyo/wp-content/uploads/2019/12/5dea5f4fecea9.jpg')
            .setDescription('Kaede does not know what you want to put in! So you choose...').addField(
            'Song number 1', songInfo[0].title, false).addField(
            'Song number 2', songInfo[1].title, false).addField(
            'Song number 3', songInfo[2].title, false).addField(
            'Song number 4', songInfo[3].title, false).addField(
            'Song number 5', songInfo[4].title, false).setFooter(
            'Tip: Kaede can do more cool stuff than this! Check out ^help!', 'https://www.googlecover.com/_asset/_cover/Anime-Girl-Winking_780.jpg');
            const chooseFilter = m => {
                let choice = Number(m.content);
                let cond =  m.author.id === message.author.id && !isNaN(choice);
                return cond && choice >= 1 && choice <= 5 && Number.isInteger(choice);
            }
            message.channel.send(songInfoEmbed);
            try {
                let collected = await message.channel.awaitMessages(chooseFilter, {max: 1, time: 30000, errors : ['time']});
                var index = Number(collected.first().content);
            } catch (error){
                message.channel.send("Kaede waited too long for this!");
                return;
            }
            const songData = {
                title : songInfo[index - 1].title,
                url : songInfo[index - 1].link, // please note that in playlist we dont create a property of description since JSON file has a limited memory space.
            };
            playlists[message.guild.id][message.author.id][playlistName].push(songData);
            json_format_string = JSON.stringify(playlists);
            fs.writeFile('Playlists.json', json_format_string, 'utf8', (error) => {
                if (error) {
                    console.log(error);
                }
            });
            message.channel.send("Kaede has added a song of name " + songData.title + " to the playlist " + playlistName + "!");
        }
    });
}

/**
 * Helper Functions to help getting the youtube top 5 URL for the play function (most are referrenced from other codes)
 */

// code referenced from https://github.com/TimeForANinja/node-ytsr/blob/master/lib

async function getYoutubeInfo(searchString, callback = null) {
    if (!callback) { // returning callback since async await does not work here
        return new Promise((resolve, reject) => {
            getYoutubeInfo(searchString, (err, info) => {
                if (err) return reject(err);
                resolve(info);
            });
        });
    }
    const link = BASE_URL + querystring.encode({ //encode for language and region
        search_query: searchString,
        spf: 'navigate',
        gl: 'CA',
        hl: 'en',
    });
    getPage(link, (err, body) => {
        if (err) return callback(err);
        let content;
        try {
            const parsed = JSON.parse(body);
            content = parsed[parsed.length - 1].body.content;
        } catch (error) {
            return callback(error);
        }

        // Get the table of items and parse it(remove null items where the parsing failed)
        const items = 
            between(content, '<ol id="item-section-', '\n</ol>')
            .split('</li>\n\n<li>')
            .filter(item => {
            let condition1 = !item.includes('<div class="pyv-afc-ads-container" style="visibility:visible">');
            let condition2 = !item.includes('<span class="spell-correction-corrected">');
            let condition3 = !item.includes('<div class="search-message">');
            let condition4 = !item.includes('<li class="search-exploratory-line">');
            return condition1 && condition2 && condition3 && condition4;
            })
            .map(item => parseItem(item))
            .filter(item => item) // removes null
            .filter((item, index) => index < 5); //filter to 5
        return callback(null, items);
    });
}

// Start of parsing an item, only want type video

function parseItem(item) {
  const titles = between(item, '<div class="', '"');
  const type = between(titles, 'yt-lockup yt-lockup-tile yt-lockup-', ' ');
  if (type === 'video') {
    const rawDesc = between(between(item, '<div class="yt-lockup-description', '</div>'), '>');
    return {
        title: removeHtml(between(between(item, '<a href="', '</a>'), '>')),
        link: url.resolve(BASE_URL, removeHtml(between(item, 'href="', '"'))),
        description: removeHtml(rawDesc) || null,
      };
  }
  return null;
};

// Taken from https://github.com/fent/node-ytdl-core/

function between(haystack, left, right) {
  let pos;
  pos = haystack.indexOf(left);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(pos + left.length);
  if (!right) { return haystack; }
  pos = haystack.indexOf(right);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(0, pos);
  return haystack;
};

// Cleans up html text

function removeHtml(string) {
    return new entities().decode(
        string.replace(/\n/g, ' ')
            .replace(/\s*<\s*br\s*\/?\s*>\s*/gi, '\n')
            .replace(/<\s*\/\s*p\s*>\s*<\s*p[^>]*>/gi, '\n')
            .replace(/<.*?>/gi, ''),
        ).trim();
}
// get the HTML page of a certain URL link

function getPage(link, callback) {
  const request = https.get(link, resp => {
    if (resp.statusCode !== 200) return callback(new Error(`Status Code ${resp.statusCode}`));
    const respBuffer = [];
    resp.on('data', d => respBuffer.push(d));
    resp.on('end', () => {
        callback(null, Buffer.concat(respBuffer).toString());
    });
  });
  request.on('error', callback);
};