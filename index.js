require("dotenv").config();
const Discord = require('discord.js');
const util = require('minecraft-server-util');
const ytdl = require('ytdl-core');
const yts = require('yt-search')
const client = new Discord.Client();
client.login(process.env.BOTTOKEN);
const fs = require('fs');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));
const PREFIX = '!';
let colorcounter = 0;
let url = "";
let alreadycalled = false;
let inChannel = false;
let cacheIndex = 0;
var cache = {
    name: [],
    url: [],
    seconds: []
}
grabCache();

for (const file of commandFiles) {//for (files that end in .js)
    const command = require(`./commands/${file}`);//Require any file that is in the commands folder
    bot.commands.set(command.name, command);
}

const replies = [
    'Im preparing for musical surgery',
    'Clear to cut into some spicy songs',
    'You are listening to Doctor Music',
    'OH YEAH!'
]
const colors = [
    0xffd700,
    0x25FA34,
    0x00ffff,
    0xff0000,
    0x00d0f0
]


client.on('ready', readyDiscord);

function readyDiscord() {
    console.log('Im Alive');
}

client.on('message', async message => {
    let args = message.content.substring(PREFIX.length).split(' ');

    switch (args[0]) {
        case 'server':
            bot.commands.get('embed').execute(message, util, colors, colorcounter, fs, Discord);//Go and create the role
            if (colorcounter == colors.length) {
                colorcounter = 0;
            } else {
                colorcounter += 1;
            }
            break;

        case 'play':
            if (!message.guild) return;
            if (!args[1]) message.reply('You Need to Specify the name you want to play!');
            var str = '';
            for (var i = 1; i < args.length; i++) {
                str += args[i] + " ";
            }
            // Only try to join the sender's voice channel if they are in one themselves
            if (message.member.voice.channel) {
                const connection = await message.member.voice.channel.join();
                inChannel = true;
                for (var i = 0; i < cache.name.length; i++) {//Loop through the names of songs in the cache
                    cache.name[i] = cache.name[i].trim();
                    if (str == cache.name[i].toString()) {//If the input string = any cached name, It already exists!
                        alreadycalled = true;
                        cacheIndex = i;
                    }
                }
                if (alreadycalled == true) {
                    alreadycalled = false;
                    let calledurl = cache.url[cacheIndex];
                    connection.play(ytdl(calledurl, { filter: 'audioonly' }));
                } else {
                    yts(str, function (err, r) {
                        if (err) throw err;

                        url = r.videos[0].url;//Get the url of the requested video name
                        cache.seconds.push(r.videos[0].seconds);
                        cache.url.push(r.videos[0].url);
                        cache.name.push(str);
                        cacheToText();
                        console.log("Added to cache");
                        connection.play(ytdl(url, { filter: 'audioonly' }));//Streams that url audio
                    })
                }
            } else {
                message.reply('You need to join a voice channel first!');
            }

            break;

        case 'stop':
            message.channel.bulkDelete(1);
            if (message.member.voice.channel) {
                inChannel = true;
            } else {
                inChannel = false;
            }
            if (inChannel == true) {
                message.member.voice.channel.join()
                message.guild.voice.connection.disconnect();
                inChannel = false;
            }
            break;
    }

    //bot.commands.get('defineRole').execute(message);//Make sure Doctors Assistant role exists
})
function grabCache() {//Populate the cache from json file on program startup
    fs.readFile('cache.json', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        if (cache == undefined) {
            console.log("cache undefined");
        } else {
            cache = JSON.parse(data);
        }

    })
}
function cacheToText() {//Write the current cache to the json file
    var jsonData = JSON.stringify(cache);
    fs.writeFile("cache.json", jsonData, function (err) {
        if (err) {
            console.log(err);
        }
    });
}
