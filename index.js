const { Client, GatewayIntentBits, Collection, ChannelType, PermissionsBitField, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});


const { token, prefix } = require("./config.js");

client.command = new Collection();

function getAllCommandFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllCommandFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(fullPath);
        }
    }

    return arrayOfFiles;
}

const commandFiles = getAllCommandFiles(path.join(__dirname, 'command'));

for (const file of commandFiles) {
    const command = require(file);
    client.command.set(command.name, command);
}


function getAllEventFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllEventFiles(filePath));
        } else if (file.endsWith(".js")) {
            results.push(filePath);
        }
    }
    return results;
}

const eventFiles = getAllEventFiles("./events");

for (const file of eventFiles) {
    const event = require(path.resolve(file));

    if (event.name) {
        client.on(event.name, async (...args) => {
            await event.execute(client, ...args);
        });
    }
    
   
    if (event.customId) {
        client.on("interactionCreate", async (interaction) => {
            if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;
            if (interaction.customId !== event.customId) return;
            await event.execute(client, interaction);
        });
    }
}


client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(1).split(/ +/);
    const messageName = args.shift().toLowerCase();  

    const messagess = client.command.get(messageName) || client.command.find(cmd => cmd.aliases && cmd.aliases.includes(messageName));

    if (!messagess) return;

    try {
        messagess.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply(error);
    }
});


client.login(token);

process.on("uncaughtException" , err => {
return;
})

process.on("unhandledRejection" , err => {
return;
})

process.on("rejectionHandled", error => {
  return;
});
