/*
--Dr Music Discord Bot
--Version 1.3.4 
--Created By Sean Kohler
--Date Last Modified 7/1/2021
*/

/*Program Requirements*/
require("dotenv").config();
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search')
const client = new Discord.Client();
client.login(process.env.BOTTOKEN);
const fs = require('fs');
const { send } = require("process");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const { MessageAttachment } = require("discord.js");
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

/*Program Variables*/
const PREFIX = '!';
let colorcounter = 0;
let url = "";
let alreadycalled = 0;
let inChannel = false;
let enableRoles = true;
let code = "";
let cacheIndex = 0;

/*Program Objects*/
var cache = {
    name: [],
    url: [],
    seconds: []
}
var q = {
    channel: {
        id: [],
        channelqueue: [
            song = ['']
        ],
        currentsong: [],
        enablerole: []
    }
}
var cast = {
    text: ''
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
    var id = message.channel.id;
    switch (args[0]) {
        case 'play':
            message.channel.bulkDelete(1);
            if (!message.guild) return;
            if (!args[1]) {
                message.reply('```You Need to Specify the name you want to play!```');
                return;
            }

            var str = concatARGS(args);
            // Only try to join the sender's voice channel if they are in one themselves
            if (message.member.voice.channel) {
                const connection = await message.member.voice.channel.join();
                inChannel = true;
                str = str.toString().trim();
                if (str.substring(0, 30) == 'https://www.youtube.com/watch?') {
                    console.log("URL DETECTED");
                    var requestedURL = str;
                    connection.play(ytdl(requestedURL, { filter: 'audioonly' })).on("finish", () => {
                        playNext(message);
                        cacheToText('queue.json', q);
                    });;//Streams that url audio;
                } else {//IF THE QUERIED STRING WAS NOT A URL

                    alreadycalled = binarySearch(str);//Binary Search to see if this song has been requested before
                    console.log(alreadycalled);

                    if (alreadycalled == true) {
                        alreadycalled = false;
                        let calledurl = cache.url[cacheIndex];
                        q.channel.currentsong[qid] = cache.name[cacheIndex];
                        connection.play(ytdl(calledurl, { filter: 'audioonly' })).on("finish", () => {
                            playNext(message);
                            cacheToText('queue.json', q);
                        });;//Streams that url audio;
                    } else {//IF THE QUERIED SONG IS NEW
                        yts(str, function (err, r) {
                            if (err) throw err;

                            url = r.videos[0].url;//Get the url of the requested video name
                            cache.seconds.push(r.videos[0].seconds);
                            cache.url.push(r.videos[0].url);
                            cache.name.push(str);
                            q.channel.currentsong[qid] = str;
                            insertionSort();
                            cacheToText("cache.json", cache);
                            console.log("<Dr. Music> Added " + str + " to cache");
                            connection.play(ytdl(url, { filter: 'audioonly' })).on("finish", () => {
                                playNext(message);
                                cacheToText('queue.json', q);
                            });;//Streams that url audio
                        })
                    }
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
            var qid = checkQid(id, message, 'CalledFrom:stop');
            if (qid == '__BotMSG__') {
                console.log('do nothing __BotMSG__');
            } else {
                q.channel.currentsong[qid] = 'No current Song';
            }
            break;

        case 'queue':
            if (!args[1]) {
                message.channel.send("```You must enter names of desired songs (NOTE: Use commas ',' to separate desired song names)```");
            } else {
                var current = '';
                for (var i = 1; i < args.length; i++) {
                    current += args[i];
                    if (current.includes(',')) {
                        current = current.replace(',', ' ');
                        console.log("current arg: " + current);
                        //queue.song.push(current);
                        var qid = checkQid(id, message, 'CalledFrom:queue');
                        q.channel.channelqueue[qid].push(current);
                        current = '';
                    } else {
                        current += " ";
                    }
                }
                if (current.localeCompare('') != 0) {
                    //queue.song.push(current);
                    var qid = checkQid(id, message, 'CalledFrom:queue2');
                    //console.log(q);
                    //console.log(qid);
                    q.channel.channelqueue[qid].push(current);
                    console.log("current arg: " + current);
                }
                cacheToText('queue.json', q);
            }

            break;

        case 'skip':
            message.channel.bulkDelete(1);
            playNext(message);
            break;

        case 'song':
            message.channel.bulkDelete(1);
            var qid = checkQid(id, message, 'CalledFrom:song');
            message.channel.send("Song playing is: " + q.channel.currentsong[qid]);
            break;

        case 'game':
            if (message.member.presence.activities.length > 0) {
                message.channel.send(message.member.nickname + " Is Playing: " + message.member.presence.activities[0].name)
            } else {
                message.channel.send(message.member.nickname + " Is Not Currently Playing A Game :/")
            }
            break;

        case 'enablerole':
            var qid = checkQid(id, message, 'CalledFrom:enablerole');
            if (!args[1]) {
                message.channel.send("```Must say true or false```");
            } else {
                if (args[1] == 'true') {
                    q.channel.enablerole[qid] = true;
                } else if (args[1] == 'false') {
                    q.channel.enablerole[qid] = false;
                }
            }
            break;

        case 'help':
            if (!args[1]) {
                message.channel.send('``` !play ______   (Single song name) \n !stop (Will stop playing songs) \n !queue ______, _______, ______ (You must use commas "," to separate songs) \n !skip (Will move to next song in the queue) \n !enablerole _____ (true or false) \n !bot (Add Dr. Music to your Channels!) \n !help ________ (Command name (!help !enablerole)) For more descriptive instruction```');
            } else if (args[1] == '!play') {
                message.channel.send('```Ex). !play yee \n This will search youtube for the first result of "yee". The audio of the video will then be played into the voice channel```');
            } else if (args[1] == '!stop') {
                message.channel.send('``` This will stop playing audio and make Dr. Music leave the voice channel```');
            } else if (args[1] == '!queue') {
                message.channel.send('```Ex). !queue yee, nope.avi, wii shop channel \n This will put 3 songs into the queue. Because I allow song names to have spaces, we must separate the songs with a comma ",". ```');
            } else if (args[1] == '!skip') {
                message.channel.send('```If a song is currently playing it will stop playing that song and play the next song in the queue if there is one```');
            } else if (args[1] == '!enablerole') {
                message.channel.send('```If this command is followed by "true" Dr. Music will take the status of users and create roles out of them and automatically assign them. Type "false" to disable this. (Is false by default)```');
            } else if (args[1] == '!bot') {
                message.channel.send('```Provides a link to add Dr. Music to your server. For help contact me```');
            } else if (args[1] == '!help') {
                message.channel.send('```Help for help. Nice!```');
            }
            break;

        case 'commands':
            message.channel.send('!help');
            break;

        case 'bot':
            message.channel.send("Add me to your server with this link!");
            message.channel.send('https://discord.com/api/oauth2/authorize?client_id=786879633475895317&permissions=8&scope=bot');
            break;

        case 'devop':
            message.channel.bulkDelete(1);
            if (!args[1]) {
                //Give no indication this is a command
            } else {
                var instr = args[1];
                if (instr == process.env.PASSWORD + code && message.member.user.id == '280447857922670592') {
                    grabCache('broadcast.json', cast);
                    setTimeout(makeChannel, 1000 * 5, message);
                    //makeChannel(message);
                } else {
                    if (instr == "gen") {
                        code = Math.random(100).toString();
                        client.channels.cache.get('728868630413967421').send(code);
                        //728868630413967421
                    }
                }
            }
            break;
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
            cache.name[j + 1] = cache.name[j];
            cache.url[j + 1] = cache.url[j];
            cache.seconds[j + 1] = cache.seconds[j];

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
    //console.log(min + " " + mid + " " + high);
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
            } else if (obj == cast) {
                cast = JSON.parse(data);
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
function checkQid(id, message, calledfrom) {
    if (message.member.id == '786879633475895317') {
        console.log("BotMessage");
        return '__BotMSG__';
    } else {
        console.log(calledfrom);
        var exists = false;
        var qid;
        for (var i = 0; i < q.channel.id.length; i++) {
            if (id == q.channel.id[i]) {
                exists = true;
                qid = i;
            }
        }
        if (exists == false) {
            q.channel.id.push(id);
            qid = q.channel.id[q.channel.id.length - 1];
            q.channel.channelqueue.push([]);
            q.channel.currentsong.push('Not yet played song');
            q.channel.enablerole.push(false);
            message.channel.send('Thankyou for using Dr. Music! Use the !bot command to add it to your own servers');
        }
        if (qid == undefined) {//safety net code doesnt always work as we would like it to
            console.log('Undefined');
            checkQid(id, message, 'CalledFrom:self');
        }
        return qid;
    }
}

function makeChannel(message) {
    var str = cast.text;
    for (var i = 0; i < q.channel.id.length; i++) {
        var currentchannel = q.channel.id[i];
        client.channels.cache.get(currentchannel).send(str);
    }

}
function assnRole(message) {
    var id = message.channel.id;
    var qid = checkQid(id, message, 'CalledFrom:assnRole');
    if (qid == '__BotMSG__') {
        console.log('do nothing __BotMSG__');
    } else {
        if (q.channel.enablerole[qid] == true) {
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
    }
}
function waitToAdd(message, str) {
    bot.commands.get('giveRole').execute(message, str);
}
function playNext(message) {
    var id = message.channel.id;
    var qid = checkQid(id, message, 'CalledFrom:playNext');
    if (qid == '__BotMSG__') {
        console.log('do nothing __BotMSG__');
    } else {
        if (q.channel.channelqueue[qid].length > 0) {
            var txt = q.channel.channelqueue[qid][0];
            if (txt == '') {
                removeQueueElement(qid);
                txt = q.channel.channelqueue[qid][0];
            }
            console.log(txt + ': This can be undefined as it may not have anything to playnext');
            removeQueueElement(qid);
            if (txt == undefined || txt == 'undefined') {
                console.log('Next queue element is: ' + undefined);
                message.channel.send('!stop');
                q.channel.currentsong[qid] = 'Not currently playing a song';
            } else {
                message.channel.send('!play ' + txt);
                q.channel.currentsong[qid] = txt;
            }

        } else {
            //message.channel.send('Queue is empty :(');
            message.channel.send('!stop');
        }
    }
}
function removeQueueElement(index) {
    //queue.song.splice(index, 1);
    //q.channel.song[index].song.splice(0,1);
    q.channel.channelqueue[index].splice(0, 1);
}

