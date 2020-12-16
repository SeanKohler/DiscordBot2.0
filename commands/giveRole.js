module.exports = {
    name: 'giveRole',
    description: 'This command is run automatically when a song is requested. Will add the docs assistant role when the criteria is met',
    execute(message, str) {
        if (message.member.roles.cache.some(r => r.name === str)) {
            //console.log(user+" Already has assistant role");
        } else {
            let role = message.guild.roles.cache.find(r => r.name === str);
            //message.channel.send(user + "! You've earned the Doctors Assistant Role!");
            message.member.roles.add(role);
        }
    }
}