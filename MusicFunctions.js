module.exports = {play, skip, skipAll}

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
        url : songInfo.items[0].url,
    };
    if (typeof serverQueue === "undefined") {
        const queueFields = {
            textChannel : message.channel,
            voiceChannel : voiceChannel,
            connection : null,
            songs : [],
            volume : 5,
        };
        queue.set(message.guild.id, queueFields);
        queueFields.songs.push(songData);
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
        message.channel.send("Kaede has added " + songData.title + " has been added to the queue!");
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
    const dispatcher = serverQueue.connection.playStream(song.url).on('end', () => {
        message.channel.send("Kaede's song ended!");
        serverQueue.songs.shift();
        dispatchSong(message, serverQueue.songs[0], queue);
    }).on('error', () => {
        message.channel.send("Unexpected error occured!! Kaede's scared...");
        //console.error(error);
    });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

async function skip(message, queue) {
    const serverQueue = queue.get(message.guild.id);
    
    serverQueue.songs.shift();
    dispatchSong(message, serverQueue.songs[0], queue);
}
async function skipAll() {

}