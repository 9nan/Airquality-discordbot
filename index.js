/*a discord bot code on discord.js@v13 library */
/*run "npm install" on command prompt*/

const Discord = require('discord.js');
const SerialPort = require('serialport');

const bot = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
    ],
});

const TOKEN = 'MTEwOTQxODE0OTI1MTY2MTgyNQ.GtKpLz.lQYN2xQ9njOz4xC74Ais4_vZwqQaKJTkhY1sAg';
const CHANNEL_ID = '1198479931743674522';
const SERIAL_PORT = 'COM7';

let serialDataBuffer = '';
bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);

    const port = new SerialPort(SERIAL_PORT, { baudRate: 9600 });

    let linesProcessed = 0;

    port.on('data', (data) => {
        serialDataBuffer += data.toString('utf-8');

        // Check if the buffer contains a newline character
        const newlineIndex = serialDataBuffer.indexOf('\n');
        if (newlineIndex !== -1) {
            const fullLine = serialDataBuffer.substring(0, newlineIndex);
            serialDataBuffer = serialDataBuffer.substring(newlineIndex + 1);

            const channel = bot.channels.cache.get(CHANNEL_ID);

            if (channel) {
                channel.send(`${fullLine}`);
                linesProcessed++;

                if (linesProcessed === 2) {
                    if (fullLine.includes("BuzzerActivated")) {
                        channel.send('💣💣💣💣💣💣💣💣💣💣💣💣'); // Bomb emoji
                    }
                    channel.send(`----------------------------------------------------------------------------------------------------`);
                    linesProcessed = 0; // Reset the counter
                }
            }
        }
    });
});

bot.login(TOKEN);
