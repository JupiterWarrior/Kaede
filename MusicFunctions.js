module.exports = {play, skip, skipAll, pause, resume}

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
    const songInfo = await getInfo(song);
    const songData = {
        title : songInfo.items[0].title,
        url : songInfo.items[0].webpage_url,
    };
    /* console.log(songData.url);
    console.log(songData.title); */
    if (typeof serverQueue === "undefined") {
        const queueFields = {
            textChannel : message.channel,
            voiceChannel : voiceChannel,
            connection : null,
            songs : [],
            volume : 5,
            playing : true,
        };
        queue.set(message.guild.id, queueFields);
        queueFields.songs.push(songData);
        message.channel.send("Kaede has added " + songData.title + " to the queue!");
        try {
            var connection = await voiceChannel.join();
            queueFields.connection = connection;
            dispatchSong(message, queueFields.songs[0], queue); 
        } catch (err) {
            //console.log(err);
            queue.delete(message.guild.id);
            message.channel.send("Kaede found an error in playing the music!");
            return;
        }
    }
    else {
        serverQueue.songs.push(songData);
        message.channel.send("Kaede has added " + songData.title + " to the queue!");
    }
}

async function dispatchSong(message, song, queue) {
    const serverQueue = queue.get(message.guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(message.guild.id);
        message.channel.send("Kaede's bored.. Leaving now!");
        return;
    }
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url)).on('end', () => {
        serverQueue.songs.shift();
        dispatchSong(message, serverQueue.songs[0], queue);
    }).on('error', () => {
        message.channel.send("Unexpected error occured!! Kaede's scared...");
        //console.error(error);
    });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
async function skip(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot skip unless you're in a voice channel !");
    }
    if (!serverQueue) {
        message.channel.send("There's no song for Kaede to skip!");
    }
    serverQueue.connection.dispatcher.end();
    message.channel.send("Kaede Skip!")
}
async function skipAll() {

}
async function pause(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot pause unless you're in a voice channel !");
    }
    if (!serverQueue) {
        message.channel.send("No song is playing!");
    }
    if (!serverQueue.playing) {
        message.channel.send("Kaede paused already!");
    }
    serverQueue.connection.dispatcher.pause();
    serverQueue.playing = !serverQueue.connection.dispatcher.paused;
    message.channel.send("Kaede pause!");
}
async function resume(message, serverQueue) {
    if (!message.member.voiceChannel) {
        message.channel.send("Kaede cannot resume unless you're in a voice channel !");
    }
    if (!serverQueue) {
        message.channel.send("No song is playing!");
    }
    if (serverQueue.playing) {
        message.channel.send("Kaede is playing music already!");
    }
    serverQueue.connection.dispatcher.resume();
    serverQueue.playing = !serverQueue.connection.dispatcher.paused;
    message.channel.send("Kaede resume!");
}
/*To do music commands:
Optimize play ( kaede leaves too soon )
Skipall ( skips all song but kaede stays in connection )
queue ( show the queue of songs )
np (show what song is currently playing)
Repeat ( repeat curr song once)
loop (repeat curr song forever)
swap (change the orders of song)
first (make a song to go to the first order)
Remove ( remove a certain song in queue )
Lyrics ( lyrics for song )
MoveTo ( move to a certain time in the youtube vid )
// playlist commands ( playlists are stored in json file for certain diff servers.)
Playlist ( creates a playlist )
Shuffle ( shuffles the playlist )
add (adding to playlist)
remove (from playlist)
list (show playlist)
playlists (show all playlists in server)
*/