/*
--Dr Music Discord Bot
--Version 1.2.0
--Created By Sean Kohler
--Date Last Modified 1/16/2021
*/

/*Program Requirements*/
require("dotenv").config();
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search')
const client = new Discord.Client();
client.login(process.env.BOTTOKEN);
const fs = require('fs');
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

/*Program Variables*/
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
    song: []
}


//<Dr. Music>
grabCache('cache.json', cache);
//grabCache('points.json', points);
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
    0x00d0f0
]


client.on('ready', readyDiscord);

function readyDiscord() {
    console.log('<Dr. Music> Im Alive!');
}

client.on('message', async message => {
    //------------------
    assnRole(message);
    //------------------

    let args = message.content.substring(PREFIX.length).split(' ');

    switch (args[0]) {
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
                str = str.toString().trim();
                alreadycalled = binarySearch(str);
                console.log(alreadycalled);
                
                if (alreadycalled == true) {
                    alreadycalled = false;
                    let calledurl = cache.url[cacheIndex];
                    //addPoints(message, 5);// 5 Points for playing a song that has been played before
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
                        insertionSort();
                        cacheToText("cache.json", cache);
                        console.log("<Dr. Music> Added " + str + " to cache");
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
            var current = '';
            for (var i = 1; i < args.length; i++) {
                current += args[i];
                if (current.includes(',')) {
                    current = current.replace(',', ' ');
                    console.log("current arg: " + current);
                    queue.song.push(current);
                    current = '';
                } else {
                    current += " ";
                }
            }
            if(current.localeCompare('')!= 0){
                queue.song.push(current);
                console.log("current arg: " + current);
            }
            break;

        case 'skip':
            message.channel.bulkDelete(1);
            playNext(message);
            break;

        case 'game':
            if (message.member.presence.activities.length > 0) {
                message.channel.send(message.member.user.username + " Is Playing: " + message.member.presence.activities[0].name)
            } else {
                message.channel.send(message.member.user.username + " Is Not Currently Playing A Game :/")
            }
    }
})

function insertionSort() {
    var len = cache.name.length;
    for (var i = 0; i < len; i++) {
        var keyval = cache.name[i];
        var keyurl = cache.url[i];
        var keysec = cache.seconds[i];
        var j = i - 1;

        while (j >= 0 && cache.name[j].localeCompare(keyval) > 0) {
            //var temp = cache.name[j+1];
            cache.name[j + 1] = cache.name[j];
            cache.url[j + 1] = cache.url[j];
            cache.seconds[j + 1] = cache.seconds[j];
            //cache.name[j] = temp;

            j -= 1;
        }
        cache.name[j + 1] = keyval;
        cache.url[j + 1] = keyurl;
        cache.seconds[j + 1] = keysec;
    }

    for (var x = 0; x < cache.name.length; x++) {
        console.log(cache.name[x]);
    }
}
function binarySearch(str) {
    var exists = false;
    var found = false;
    var high = cache.name.length;
    var min = 0;
    var mid = (min + high) / 2;
    mid = Math.floor(mid);
    console.log(min + " " + mid + " " + high);
    while (found == false) {
        if (cache.name[mid].localeCompare(str) < 0) {
            min = mid;
            mid = (min + high) / 2;
            mid = Math.floor(mid);
        } else if (cache.name[mid].localeCompare(str) > 0) {
            high = mid;
            mid = (min + high) / 2;
            mid = Math.floor(mid);
        }
        console.log(min + " " + mid + " " + high);
        console.log(cache.name[mid]);
        console.log(str);
        if (cache.name[mid].localeCompare(str) == 0) {
            found = true;
            exists = true;
            cacheIndex = mid;
        } else if (mid == high || mid == min) {
            console.log("Reached end");
            found = true;
            exists = false;

        }
    }

    if (exists == false) {
        console.log("Didnt exist");
    }

    return exists;
}
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
            } //else if (obj == points) {
              //  points = JSON.parse(data);
            //}
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
            setTimeout(waitToAdd, 1000 * 5, message, str);
        } else {
            bot.commands.get('createRole').execute(message, str);//Go and create the role
            setTimeout(waitToAdd, 1000 * 5, message, str);
        }
    } else {
        //Do Nothing
    }
}
function waitToAdd(message, str) {
    bot.commands.get('giveRole').execute(message, str);
}
function playNext(message) {
    if (queue.song.length > 0) {
        var txt = queue.song[0];
        removeQueueElement(0);
        message.channel.send('!play ' + txt);
    } else {
        //message.channel.send('Queue is empty :(');
        message.channel.send('!stop');
    }
}
function removeQueueElement(index) {
    queue.song.splice(index, 1);
}

