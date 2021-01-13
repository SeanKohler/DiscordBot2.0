/*
--Dr Music Discord Bot
--Version 1.1.0
--Created By Sean Kohler
--Date Last Modified 1/13/2021
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
                str = str.toString().trim();
                alreadycalled=  binarySearch(str);
                console.log(alreadycalled);
                /*
                for (var i = 0; i < cache.name.length; i++) {//Loop through the names of songs in the cache
                    var ci = cache.name[i].toString().trim();
                    str = str.toString().trim();
                    var n = str.localeCompare(ci);
                    if (n==0) {//If the input string = any cached name, It already exists!
                        alreadycalled = 1;
                        cacheIndex = i;
                    }
                }
                */
                if (alreadycalled== true) {
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
                        //sort();
                        insertionSort();
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
                cElement =cElement.replace(/-/g,' ');
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
            message.channel.bulkDelete(1);
            playNext(message);
            break;

        case 'game':
            if (message.member.presence.activities.length > 0) {
                message.channel.send(message.member.user.username + " Is Playing: " + message.member.presence.activities[0].name)
            } else {
                message.channel.send(message.member.user.username + " Is Not Currently Playing A Game :/")
            }

        case 'points':
            readPoints(message,args,0);
            break;

        case 'redeem':
            readPoints(message,args,1);
            break;

        case 'talk':
            var cmd = concatARGS(args);
            ttmc(cmd);
            break;

        case 'poggies':
            message.channel.send("https://tenor.com/view/pepe-the-frog-dance-happy-meme-pixel-gif-17428498");
            break;
    }
})
function sort(){
    for(var i=0; i<cache.name.length; i++){
        for(var j=0; j<cache.name.length; j++){
            if(cache.name[i].localeCompare(cache.name[j]) <0){
                //Swap names
                var temp = cache.name[i];
                cache.name[i] = cache.name[j];
                cache.name[j] = temp;
                //Swap url to match names
                temp =cache.url[i];
                cache.url[i] = cache.url[j];
                cache.url[j] = temp; 
                //Swap seconds to match url
                temp =cache.seconds[i];
                cache.seconds[i] = cache.seconds[j];
                cache.seconds[j] = temp; 
            }
        }
    }
    /*
    for(var x=0; x<cache.name.length; x++){
        console.log(cache.name[x]);
    }
    */
}
function insertionSort(){
    var len = cache.name.length;
    for(var i=0; i<len; i++){
        var keyval = cache.name[i];
        var keyurl = cache.url[i];
        var j = i-1;

        while(j>=0 && cache.name[j].localeCompare(keyval)>0){
            //var temp = cache.name[j+1];
            cache.name[j+1] = cache.name[j];
            cache.url[j+1] = cache.url[j];
            //cache.name[j] = temp;

            j-=1;
        }
        cache.name[j+1] = keyval;
        cache.url[j+1] = keyurl;
    }

    for(var x=0; x<cache.name.length; x++){
        console.log(cache.name[x]);
    }
}
function binarySearch(str) {
    var exists = false;
    var found = false;
    var high = cache.name.length;
    var min = 0;
    var mid = (min + high) / 2;
    mid =Math.floor(mid);
    console.log(min +" "+mid+" "+high);
    console.log(cache.name[mid]);
    console.log(str);
    while (found == false) {
        if (cache.name[mid].localeCompare(str) < 0) {
            min = mid;
            mid = (min + high) / 2;
            mid =Math.floor(mid);
        } else if (cache.name[mid].localeCompare(str) > 0) {
            high = mid;
            mid = (min + high) / 2;
            mid =Math.floor(mid);
        }
        console.log(min +" "+mid+" "+high);
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

    if(exists == false){
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
            setTimeout(waitToAdd,1000*5,message,str);
        } else {
            bot.commands.get('createRole').execute(message, str);//Go and create the role
            setTimeout(waitToAdd,1000*5,message,str);
        }
    } else {
        //Do Nothing
    }
}
function waitToAdd(message,str){
    bot.commands.get('giveRole').execute(message, str);
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
        //message.channel.send('Queue is empty :(');
        message.channel.send('!stop');
    }
}
function removeQueueElement(index){
    queue.message.splice(index,1);
    queue.song.splice(index,1);
    queue.user.splice(index,1);
}
function readPoints(message,args,type) {
    var name = message.member.user.username;
    var arrindex = 0;
    for (var i = 0; i < points.name.length; i++) {
        if (name === points.name[i]) {
            arrindex = i;
        }
    }
    if(type ==0){
      message.reply(name + ": " + "You have " + points.num[arrindex] + " Points!");  
    }else if(type==1){
        var pnts = points.num[arrindex];
        message.reply('You can redeem rewards up to: '+pnts);
        if(!args[1]){
            message.reply('You must specify what reward you want to redeem');
            message.reply('Current Rewards: (role -> 1500), (xp -> 1000)');
        }else if(args[1]=='role'&&pnts >=1500){
            addPoints(message, -1500);
            bot.commands.get('defineRole').execute(message);
            bot.commands.get('giveRole').execute(message,'Doctors Assistant');
            message.reply('Redeemed!');
        }else if(args[1]=='xp'&&pnts >=1000){
            addPoints(message, -1000);
            message.channel.send('!talk xp add '+message.member.nickname+' 30 levels');
            message.reply('Redemmed!');
        }
    }
    
}
function ttmc(cmd) {
    if (cmd == "" || cmd == undefined || cmd == null) {

    } else {
        const MCclient = new util.RCON('192.168.1.163'/*creds.IPADDR*/, { port: 25575, enableSRV: true, timeout: 5000, password: 'test' }); // These are the default options
                //This IP Addr is okay because it is a local IP addr of my Raspberry PI
        MCclient.on('output', (message) => console.log(message));

        MCclient.connect()
            .then(async () => {
                await MCclient.run(cmd); //.run(list)// List all players online
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
