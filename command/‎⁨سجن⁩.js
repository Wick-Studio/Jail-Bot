const { EmbedBuilder } = require("discord.js");
const config = require("../config.js");
const fs = require("fs");
const path = require("path");

const jailPathFile = path.join(__dirname, "..", "data", "jails.json");
const roleDataFile = path.join(__dirname, "..", "data", "roleData.json");

if (!fs.existsSync(jailPathFile)) fs.writeFileSync(jailPathFile, JSON.stringify({}, null, 2));
if (!fs.existsSync(roleDataFile)) fs.writeFileSync(roleDataFile, JSON.stringify({}, null, 2));

function loadJSON(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "سجن",
    async execute(message, args) {      
        const jails = loadJSON(jailPathFile);
        const rolesData = loadJSON(roleDataFile);

        if (!message.member.roles.cache.has(config.allowedRoleId)) return message.react("❌");
        
        const member = message.mentions.members.first();
        if (!member) return message.reply("**منشن المسجون؟**");
        if (message.author.id === member.id) return message.reply("**لا تستطيع أن تسجن نفسك.**");
        if (member.user.bot) return message.reply("**لا تستطيع سجن البوتات.**");
        if (jails[member.id]) return message.reply(`**هذا الشخص مسجون بالفعل.**`);

        const reason = args.slice(1).join(" ") || "بدون سبب";
        
        if (member.id === message.guild.ownerId){
            return message.reply("**لا تستطيع أن تسجن صاحب السيرفر.**");
        };
        
        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply("**لا تستطيع أن تسجن شخص اعلى منك بالرتب.**");
        };    

        rolesData[member.id] = member.roles.cache.map(r => r.id).filter(id => id !== member.guild.id);
saveJSON(roleDataFile, rolesData);

await member.roles.set([config.jailRoleId]);

        

        for (const channel of message.guild.channels.cache.values()) {
    try {
        if (channel.id === config.jailRoomId) {
            await channel.permissionOverwrites.edit(config.jailRoleId, { 
                ViewChannel: true, 
                SendMessages: true 
            });
        } else {
            await channel.permissionOverwrites.edit(config.jailRoleId, { 
                ViewChannel: false, 
                SendMessages: false 
            });
        }
    } catch (e) {
        console.error(`ما قدرت أعدل ${channel.name}:`, e);
    }
}

        jails[member.id] = { reason: reason, time: Date.now() };
        saveJSON(jailPathFile, jails);

        await message.reply(`**تم سجن \`${member.user.username}\` بنجاح.**`);
        
        const logChannel = message.guild.channels.cache.get(config.jailLogId);
        
        const embed = new EmbedBuilder()
        .setAuthor({
            name: message.guild.name,
            iconURL: message.guild.iconURL()
        })
        .setTitle("**تقرير السجن**")
        .addFields(
        {
            name: "**الشخص :**",
            value: `<@${member.id}>`,
            inline: true
        },
            {
                name: "**السبب :**",
                value: `${reason}`,
                inline: true
            },
            {
                name: "**سجن من قبل :**",
            value: `<@${message.author.id}>`,
            inline: true
            }
        )
        .setColor("Red")
        .setFooter({
            text: "Made by Wick® Studio",
            iconURL: "https://www2.0zz0.com/2025/10/03/10/185181864.png"
        });
        
        logChannel.send({
            embeds: [embed]
        });
    },
};