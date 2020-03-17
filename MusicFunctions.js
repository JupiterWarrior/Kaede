module.exports = {play, skip, skipAll, pause, resume, loop, nowPlaying, queue, repeat, remove, first, swap}

const ytdl = require('ytdl-core');
const url = require('url');
const querystring = require('querystring');
const entities = require('html-entities').AllHtmlEntities;
const https = require('https');
const BASE_URL = 'https://www.youtube.com/results?';

async function play(message, serverQueue, queue) {
    const song = message.content.substring(12);
    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) {
        message.channel.send("Kaede cannot play music if you are not in a voice channel!");
        return;
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
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
    const songData = {
        title : songInfo[0].title,
        url : songInfo[0].link,
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
                var connection = await voiceChannel.join();
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

async function dispatchSong(message, song, queue) {
    const serverQueue = queue.get(message.guild.id);

    if (!song) {
        const filter = m => {
            let theMessage = m.content.toLowerCase();
            return theMessage.startsWith("^music play ");
        }
        try {
            await message.channel.awaitMessages(filter, {max: 1, time : 120000, errors : ['time']});
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
            if (!serverQueue.looping && !serverQueue.repeating) {
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

async function skip(message, serverQueue) {
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

async function skipAll(message, serverQueue) {
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

async function pause(message, serverQueue) {
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

async function resume(message, serverQueue) {
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

async function loop(message, serverQueue) {
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

async function nowPlaying(message, serverQueue) {
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

async function queue(message, serverQueue) {
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

async function repeat(message, serverQueue) {
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

async function remove(message, serverQueue, index) {
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

async function first(message, serverQueue, index) {
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

async function swap(message, serverQueue, index1, index2) {
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
/*To do music commands:
Optimize play ( show list of songs to be added everytime before playing | make 2 modes where one is first song the other is list of songs to choose from & please make getInfo run faster)
Lyrics ( lyrics for song )
previous (play previous song (added to last in queue))
MoveTo ( move to a certain time in the youtube vid )
// playlist commands ( playlists are stored in json file for certain diff servers.)
Playlist ( creates a playlist )
Shuffle ( shuffles the playlist )
add (adding to playlist)
remove (from playlist)
list (show playlist)
playlists (show all playlists in server)
*/

// code referenced from https://github.com/TimeForANinja/node-ytsr/blob/master/lib
async function getYoutubeInfo(searchString, callback = null) {
    if (!callback) {
        return new Promise((resolve, reject) => {
            getYoutubeInfo(searchString, (err, info) => {
                if (err) return reject(err);
                resolve(info);
            });
        });
    }
    const link = BASE_URL + querystring.encode({
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
            .filter((item, index) => index < 5);
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