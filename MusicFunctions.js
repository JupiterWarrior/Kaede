module.exports = {play, skip, skipAll, pause, resume, loop, nowPlaying, queue, repeat, remove, first, swap}

const MiscFunctions = require('./MiscFunctions.js');
const ytdl = require('ytdl-core');
const {getInfo} = require('ytdl-getinfo');

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
        songInfo = await getInfo(song);
    } catch (error) {
        message.channel.send("Kaede cannot find any songs with that title!");
        return;
    }
    const songData = {
        title : songInfo.items[0].title,
        url : songInfo.items[0].webpage_url,
    };
    //console.log(songData.url);
    //console.log(songData.title);
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
async function getYoutubeInfo(song) {
    
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