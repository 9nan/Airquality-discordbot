/*a discord bot code on discord.js latest library */
/*run "npm install discord.js serialport" on command prompt*/
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { SerialPort } = require('serialport');

// Create a new client instance with proper intents
const bot = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Replace with your actual token
const TOKEN = 'YOUR_DISCORD_BOT_TOKEN';
// Replace with your actual channel ID
const CHANNEL_ID = 'YOUR_CHANNEL_ID';
// Replace with your actual serial port if needed
const SERIAL_PORT = 'YOUR_SERIAL_PORT';

let serialDataBuffer = '';

// When the client is ready, run this code
bot.once(Events.ClientReady, () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    
    // Connect to the serial port
    const port = new SerialPort({ 
        path: SERIAL_PORT, 
        baudRate: 9600 
    });
    
    let linesProcessed = 0;
    
    port.on('data', (data) => {
        serialDataBuffer += data.toString('utf-8');
        
        // Check if the buffer contains a newline character
        const newlineIndex = serialDataBuffer.indexOf('\n');
        if (newlineIndex !== -1) {
            const fullLine = serialDataBuffer.substring(0, newlineIndex);
            serialDataBuffer = serialDataBuffer.substring(newlineIndex + 1);
            
            // Get the channel and send the message
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

// Login to Discord with your client's token
bot.login(TOKEN);
