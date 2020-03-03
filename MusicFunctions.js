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
    message.channel.send("getinfo start " + Date.now());
    const songInfo = await getInfo(song);
    const songData = {
        title : songInfo.items[0].title,
        url : songInfo.items[0].webpage_url,
    };
    message.channel.send("getinfo stop " + Date.now());
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
            message.channel.send("join start " + Date.now());
            var connection = await voiceChannel.join();
            message.channel.send("join stop " + Date.now());
            queueFields.connection = connection;
            message.channel.send("dispatch start " + Date.now());
            dispatchSong(message, queueFields.songs[0], queue); 
            message.channel.send("dispatch stop " + Date.now());
        } catch (err) {
            console.log(err);
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
        console.error(error);
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