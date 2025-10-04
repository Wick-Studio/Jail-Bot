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
    name: "افراج-الجميع",
    aliases: ["افراج-الكل"],
    async execute(message, args) {
        const jails = loadJSON(jailPathFile);
        const rolesData = loadJSON(roleDataFile);

        if (!message.member.roles.cache.has(config.allowedRoleId)) return message.react("❌");

        const jailedMembers = Object.keys(jails);
        if (jailedMembers.length === 0) return message.reply("**لايوجد مساجين حالياً.**");

        for (const memberId of jailedMembers) {
            const member = await message.guild.members.fetch(memberId).catch(() => null);
            if (member) {
                const previousRoles = rolesData[member.id] || [];
                await member.roles.set(previousRoles).catch(() => {});
                delete rolesData[member.id];
            }
            delete jails[memberId];
        }

        saveJSON(jailPathFile, jails);
        saveJSON(roleDataFile, rolesData);

        message.reply(`**تم الافراج عن \`${jailedMembers.length}\` من المساجين بنجاح.**`);
        
        const logChannel = message.guild.channels.cache.get(config.jailLogId);
        
        const embed = new EmbedBuilder()
        .setAuthor({
            name: message.guild.name,
            iconURL: message.guild.iconURL()
        })
        .setTitle("**تقرير الافراج**")
        .addFields(
        {
            name: "**العدد :**",
            value: `${jailedMembers.length}`,
            inline: true
        },
            {
    name: "**الوقت :**",
    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
    inline: true
            },
            {
                name: "**افرج من قبل :**",
                value: `<@${message.author.id}>`,
                inline: true
            }
        )
        .setColor("Green")
        .setFooter({
            text: "Made by Wick® Studio",
            iconURL: "https://www2.0zz0.com/2025/10/03/10/185181864.png"
        });
        
        logChannel.send({
            embeds: [embed]
        });
    },
};
