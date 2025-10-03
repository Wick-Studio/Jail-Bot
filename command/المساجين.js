const config = require("../config.js");
const fs = require("fs");
const path = require("path");

const jailPathFile = path.join(__dirname, "..", "data", "jails.json");

function loadJails() {
    return JSON.parse(fs.readFileSync(jailPathFile, "utf8"));
}

module.exports = {
    name: "المساجين",
    aliases: ["مساجين"],
    async execute(message, args) {
        
        if (!message.member.roles.cache.has(config.allowedRoleId)) return message.react("❌");
        
        const jails = loadJails();
        const entries = Object.entries(jails);      
        

        if (entries.length === 0) {
            return message.reply("**لايوجد مساجين حالياً.**");
        }

        let index = 1;
        let list = entries.map(([id, data]) => {
            const member = message.guild.members.cache.get(id);
            const username = member ? member.user.username : "**غير معروف**";
            return `**${index++} - <@${id}> ( ${username} ) : ${data.reason}**`;
        });

        let chunk = "";
        let firstMsg;
        for (const line of list) {
            if (chunk.length + line.length + 1 > 2000) {
                if (!firstMsg) {
                    firstMsg = await message.reply(chunk);
                } else {
                    await firstMsg.reply(chunk);
                }
                chunk = "";
            }
            chunk += line + "\n";
        }

        if (chunk.length > 0) {
            if (!firstMsg) {
                await message.reply(chunk);
            } else {
                await firstMsg.reply(chunk);
            }
        }
    },
};