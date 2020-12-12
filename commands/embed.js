module.exports = {
    name: 'embed',
    description: 'This command creates an embed about the user that typed the command',
    execute(message, util, colors, colorcounter, fs, Discord){
        util.status('67.248.183.236') // port is default 25565 //67.248.183.236:25565
                .then((response) => {
                    //let r = Math.floor(Math.random() * colors.length);
                    let msg = response.favicon;
                    let base64Image = msg.split(';base64,').pop();
                    fs.writeFile('image.png', base64Image, {encoding: 'base64'}, function(err) {
                        //console.log('File created');
                    });
                    const attachment = new Discord.MessageAttachment('image.png', 'image.png');
                    let Embed = new Discord.MessageEmbed()
                        .setColor(colors[colorcounter])
                        .setTitle('POG CRAFT')
                        .addField('Server IP', response.host+':25565')
                        .addField('Server Version', response.version)
                        .addField('Online Players', response.onlinePlayers)
                        .attachFiles(attachment)
                        .setImage('attachment://image.png')
                    message.channel.send(Embed);
                })
                .catch((error) => {
                    throw error;
                });
    }
}