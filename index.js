/*
--Dr Music Discord Bot
--Version 1.0.6
--Created By Sean Kohler
--Date Last Modified 12/29/2020
*/
require("dotenv").config();
const Discord = require('discord.js');
var creds = require('./config');//config.js contains my bot keys
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
let alreadycalled = 0;
let inChannel = false;
let cacheIndex = 0;
var cache = {
    name: [],
    url: [],
    seconds: []
}
var queue = {
    song: [],
    user: [],
    message: []
}
var points = {
    name: [],
    num: []
}
//<Dr. Music>
grabCache('cache.json', cache);
grabCache('points.json', points);
console.log("Loaded the Following Functions: ");
console.log("---------------------");
for (const file of commandFiles) {//for (files that end in .js)
    const command = require(`./commands/${file}`);//Require any file that is in the commands folder
    bot.commands.set(command.name, command);
    console.log(command.name);
}
console.log("---------------------");

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
    //0xff0000,
    0x00d0f0
]


client.on('ready', readyDiscord);

function readyDiscord() {
    console.log('<Dr. Music> Im Alive!');
}

client.on('message', async message => {
    //------------------
    addPoints(message, .25);
    assnRole(message);
    //------------------

    let args = message.content.substring(PREFIX.length).split(' ');

    switch (args[0]) {
        case 'server':
            bot.commands.get('embed').execute(message, util, colors, colorcounter, fs, Discord);//Go and create the role
            if (colorcounter == colors.length) {
                colorcounter = 0;
            } else {
                colorcounter += 1;//This is here to increment the color so it is different each time
            }
            break;

        case 'play':
            message.channel.bulkDelete(1);
            if (!message.guild) return;
            if (!args[1]) {
                message.reply('You Need to Specify the name you want to play!');
                return;
            }
            
            var str = concatARGS(args);
            // Only try to join the sender's voice channel if they are in one themselves
            if (message.member.voice.channel) {
                const connection = await message.member.voice.channel.join();
                inChannel = true;
                for (var i = 0; i < cache.name.length; i++) {//Loop through the names of songs in the cache
                    var ci = cache.name[i].toString().trim();
                    str = str.toString().trim();
                    var n = str.localeCompare(ci);
                    if (n==0) {//If the input string = any cached name, It already exists!
                        alreadycalled = 1;
                        cacheIndex = i;
                    }
                }
                console.log('HERE1');
                if (alreadycalled== true) {
                    console.log('HERE2');
                    alreadycalled = false;
                    let calledurl = cache.url[cacheIndex];
                    addPoints(message, 5);// 5 Points for playing a song that has been played before
                    connection.play(ytdl(calledurl, { filter: 'audioonly' })).on("finish", () => {
                       playNext(message);
                    });;//Streams that url audio;
                } else {
                    yts(str, function (err, r) {
                        if (err) throw err;

                        url = r.videos[0].url;//Get the url of the requested video name
                        cache.seconds.push(r.videos[0].seconds);
                        cache.url.push(r.videos[0].url);
                        cache.name.push(str);
                        cacheToText("cache.json", cache);
                        console.log("<Dr. Music> Added "+str+" to cache");
                        addPoints(message, 6);// 6 Points for playing a new song!
                        connection.play(ytdl(url, { filter: 'audioonly' })).on("finish", () => {
                           playNext(message);
                        });;//Streams that url audio
                    })
                }
            } else {
                message.reply('You need to join a voice channel first!');
            }

            break;

        case 'stop':
            message.channel.bulkDelete(1);
            if (message.member.voice.channel) {
                message.member.voice.channel.join()
                message.guild.voice.connection.disconnect();
            }
            break;

        case 'queue':
            for(var i=0; i<args.length; i++){
                var cElement = args[i];
                if(args[i]=='queue'){
                    console.log('Start of Queue');
                }else{
                    queue.song.push(cElement);
                    queue.user.push(message.member.nickname);
                    queue.message.push(message);
                    //----------------
                    console.log('## '+cElement+" By: "+message.member.nickname);
                    //----------------
                }
            }
            break;
        
        case 'skip':
            playNext(message);
            break;

        case 'game':
            if (message.member.presence.activities.length > 0) {
                message.channel.send(message.member.user.username + " Is Playing: " + message.member.presence.activities[0].name)
            } else {
                message.channel.send(message.member.user.username + " Is Not Currently Playing A Game :/")
            }

        case 'points':
            readPoints(message);
            break;

        case 'talk':
            var cmd = concatARGS(args);
            ttmc(cmd);
            break;
    }
})
function grabCache(str, obj) {//Populate the cache from json file on program startup
    fs.readFile(str, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        if (obj == undefined) {
            console.log("<Dr. Music> cache undefined");
        } else {
            if (obj == cache) {
                cache = JSON.parse(data);
            } else if (obj == points) {
                points = JSON.parse(data);
            }
        }
    })
}
function cacheToText(str, obj) {//Write the current cache to the json file
    var jsonData = JSON.stringify(obj);
    fs.writeFile(str, jsonData, function (err) {
        if (err) {
            console.log(err);
        }
    });
}
function concatARGS(args) {
    var str = '';
    for (var i = 1; i < args.length; i++) {
        str += args[i] + " ";
    }
    return str;
}
function assnRole(message) {
    if (message.member.presence.activities.length > 0) {
        var str = message.member.presence.activities[0].name;
        str = str.trim();
        if (str.substring(0, 9) == 'Minecraft') {// I do this so it will count regardless of what verion is being played
            str = 'Minecraft';
            bot.commands.get('createRole').execute(message, str);//Go and create the role
            bot.commands.get('giveRole').execute(message, 'Minecraft');
        } else {
            bot.commands.get('createRole').execute(message, str);//Go and create the role
            bot.commands.get('giveRole').execute(message, str);
        }
    } else {
        //Do Nothing
    }
}
function addPoints(message, num) {
    /* 
    -.25 Points For Typing a message in chat
    -5 Points For Playing an existing song
    -6 Points For Playing a new song
    */
    var name = bot.commands.get('convert').execute(message);
    var exists = false;
    var arrindex = 0;
    for (var i = 0; i < points.name.length; i++) {
        if (name === points.name[i]) {
            exists = true
            arrindex = i;
        }
    }
    if (exists == false) {
        points.name.push(name);
        points.num.push(0);
    } else {
        points.num[arrindex] += num;
    }
    cacheToText('points.json', points);
}
function playNext(message){
    if(queue.song.length>0){
        var txt = queue.song[0];
        var usr = queue.user[0];
        var msg = queue.message[0];
        removeQueueElement(0);
        //queue.song.shift();
        //queue.message.shift();
        //queue.user.shift();
        message.channel.send('!play '+txt);
        addPoints(msg, 7);
    }else{
        message.channel.send('Queue is empty :(');
        message.channel.send('!stop');
    }
}
function removeQueueElement(index){
    queue.message.splice(index,1);
    queue.song.splice(index,1);
    queue.user.splice(index,1);
}
function readPoints(message) {
    var name = message.member.user.username;
    var arrindex = 0;
    for (var i = 0; i < points.name.length; i++) {
        if (name === points.name[i]) {
            arrindex = i;
        }
    }
    message.reply(name + ": " + "You have " + points.num[arrindex] + " Points!");
}
function ttmc(cmd) {
    if (cmd == "" || cmd == undefined || cmd == null) {

    } else {
        const MCclient = new util.RCON('192.168.1.163'/*creds.IPADDR*/, { port: 25575, enableSRV: true, timeout: 5000, password: 'test' }); // These are the default options
                //This IP Addr is okay because it is a local IP addr of my Raspberry PI
        MCclient.on('output', (message) => console.log(message));

        MCclient.connect()
            .then(async () => {
                await MCclient.run(cmd); // List all players online
                setTimeout(connclose,1000*1,MCclient);
                //MCclient.close();
            })
            .catch((error) => {
                throw error;
            });
            //MCclient.close();
    }
}
function connclose(MCclient){
    MCclient.close();
}

