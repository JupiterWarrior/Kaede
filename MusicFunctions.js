module.exports = {play, skip, skipAll}

const MiscFunctions = require('./MiscFunctions.js');
const ytdl = require('ytdl-core');

async function play(message, serverQueue, queue) {
    const arr = message.content.substring(12).split(' ');
    const searchedVideo = arr[0];
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

    const vidInfo = await ytdl.getInfo(searchedVideo);
    const vid = {
        title : vidInfo.title,
        url : vidInfo.video_url,
    };
    if (typeof serverQueue === "undefined") {
        const queueFields = {
            textChannel : message.channel,
            voiceChannel : voiceChannel,
            connection : null,
            videos : [],
            volume : 5,
        };
        queue.set(message.guild.id, queueFields);
        queueFields.videos.push(vid);
        try {
            var connection = await voiceChannel.join();
            queueFields.connection = connection;
            dispatchVideo(message, queueFields.videos[0], queue); 
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            message.channel.send("Kaede found an error in playing the music!");
            return;
        }
    }
    else {
        serverQueue.videos.push(vid);
        message.channel.send("Kaede has added " + vid.title + " has been added to the queue!");
    }
}
async function dispatchVideo(message, video, queue) {
    const serverQueue = queue.get(message.guild.id);

    if (!video) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        message.channel.send("Kaede's bored.. Leaving now!");
        return;
    }
    const dispatcher = serverQueue.connection.playStream(ytdl(video.url)).on('end', () => {
        message.channel.send("Kaede's song ended!");
        serverQueue.videos.shift();
        play(message, serverQueue.videos[0]);
    }).on('error', () => {
        message.channel.send("Unexpected error occured!! Kaede's scared...");
        console.error(error);
    });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
async function skip() {

}
async function skipAll() {

}