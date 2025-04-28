// AirGuardian Discord Bot - Advanced Air Quality Monitoring System
// Enhanced version with interactive commands, data visualization, and storage
// Compatible with discord.js v14

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, Events, ActivityType } = require('discord.js');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const path = require('path');

// Bot configuration - update these values
const CONFIG = {
  token: 'YOUR_DISCORD_BOT_TOKEN',
  primaryChannelId: 'YOUR_CHANNEL_ID',
  adminUserId: 'YOUR_ADMIN_USER_ID',   // Discord user ID who can control the bot
  serialPort: 'YOUR_SERIAL_PORT',      // e.g. 'COM3' on Windows or '/dev/ttyACM0' on Linux
  baudRate: 9600,
  dataLogPath: './air_quality_logs',   // Directory for data logs
  alertInterval: 10000,                // Minimum time between alerts (ms)
  normalColor: '#43B581',              // Green color for normal status
  warningColor: '#FAA61A',             // Yellow color for warning status
  dangerColor: '#F04747'               // Red color for danger status
};

// Create required directories
if (!fs.existsSync(CONFIG.dataLogPath)) {
  fs.mkdirSync(CONFIG.dataLogPath, { recursive: true });
}

// Create a new client instance with expanded intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Serial port setup
let serialPort;
let parser;

// Data storage
const airQualityData = {
  methane: [],
  carbonMonoxide: [],
  status: 'Normal',
  lastStatus: 'Normal',
  buzzerActive: false,
  lastAlertTime: 0
};

// Keeps track of the last status message for updating
let lastStatusMessage = null;

// Command cooldowns
const cooldowns = new Collection();

// Bot initialization
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Set bot status
  client.user.setPresence({
    activities: [{ 
      name: 'air quality', 
      type: ActivityType.Watching 
    }],
    status: 'online'
  });
  
  // Initialize serial connection
  initializeSerialConnection();
  
  // Start daily log rotation
  setInterval(rotateLogs, 24 * 60 * 60 * 1000); // 24 hours
});

// Initialize serial port connection
function initializeSerialConnection() {
  try {
    // Connect to the serial port
    serialPort = new SerialPort({ 
      path: CONFIG.serialPort, 
      baudRate: CONFIG.baudRate 
    });
    
    // Create parser
    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    // Set up event listeners
    serialPort.on('open', () => {
      console.log(`Serial port ${CONFIG.serialPort} opened`);
      sendToChannel('AirGuardian monitoring system connected and ready.');
    });
    
    serialPort.on('error', (err) => {
      console.error('Serial port error:', err.message);
      sendToChannel(`⚠️ Serial connection error: ${err.message}`);
      
      // Try to reconnect after a delay
      setTimeout(initializeSerialConnection, 10000);
    });
    
    parser.on('data', processSerialData);
    
  } catch (error) {
    console.error('Failed to initialize serial connection:', error);
    sendToChannel('❌ Failed to connect to AirGuardian device. Will retry in 10 seconds.');
    
    // Try to reconnect after a delay
    setTimeout(initializeSerialConnection, 10000);
  }
}

// Process serial data from Arduino
function processSerialData(data) {
  // Log raw data for debugging
  console.log(`Raw data: ${data}`);
  
  try {
    // Check if this is formatted data
    if (data.includes('DATA_BEGIN|') && data.includes('|DATA_END')) {
      // Extract data section
      const dataSection = data.substring(data.indexOf('DATA_BEGIN|') + 11, data.indexOf('|DATA_END'));
      const dataParts = dataSection.split('|');
      
      // Create an object to store parsed values
      const parsedData = {};
      
      // Parse each data part
      dataParts.forEach(part => {
        const [key, value] = part.split(':');
        parsedData[key] = value;
      });
      
      // Store readings in history arrays (limit to 60 entries for graphing)
      const methaneReading = parseInt(parsedData.CH4);
      const coReading = parseInt(parsedData.CO);
      
      if (!isNaN(methaneReading)) {
        airQualityData.methane.push(methaneReading);
        if (airQualityData.methane.length > 60) airQualityData.methane.shift();
      }
      
      if (!isNaN(coReading)) {
        airQualityData.carbonMonoxide.push(coReading);
        if (airQualityData.carbonMonoxide.length > 60) airQualityData.carbonMonoxide.shift();
      }
      
      // Update status
      airQualityData.lastStatus = airQualityData.status;
      airQualityData.status = parsedData.STATUS || 'Normal';
      airQualityData.buzzerActive = parsedData.BUZZER === 'ON';
      
      // Log data to file
      logAirQualityData({
        timestamp: new Date().toISOString(),
        methane: methaneReading,
        carbonMonoxide: coReading,
        status: airQualityData.status,
        mq4Voltage: parseFloat(parsedData.MQ4_V || '0'),
        mq7Voltage: parseFloat(parsedData.MQ7_V || '0')
      });
      
      // Send updates to Discord
      updateDiscordStatus(parsedData);
      
    } else if (data.trim() !== '') {
      // Forward other messages (like help text or command responses)
      sendToChannel(`📟 Arduino: ${data}`);
    }
  } catch (error) {
    console.error('Error processing serial data:', error);
  }
}

// Update Discord status with new air quality data
function updateDiscordStatus(data) {
  const now = Date.now();
  const channel = client.channels.cache.get(CONFIG.primaryChannelId);
  if (!channel) return;
  
  const statusChanged = airQualityData.status !== airQualityData.lastStatus;
  
  // Update visualization
  if (airQualityData.status === 'Danger') {
    // Send alert for danger status
    if (statusChanged || (now - airQualityData.lastAlertTime > CONFIG.alertInterval)) {
      airQualityData.lastAlertTime = now;
      
      // Create danger alert embed
      const alertEmbed = new EmbedBuilder()
        .setTitle('🚨 DANGER: HAZARDOUS AIR QUALITY DETECTED 🚨')
        .setDescription('High levels of hazardous gases detected! Take immediate action.')
        .setColor(CONFIG.dangerColor)
        .addFields(
          { name: 'Methane (CH₄)', value: `${data.CH4}/100 - **HIGH**`, inline: true },
          { name: 'Carbon Monoxide (CO)', value: `${data.CO}/100 - **HIGH**`, inline: true },
          { name: 'Status', value: 'CRITICAL - Evacuation Recommended', inline: false }
        )
        .setTimestamp();
      
      channel.send({ content: '💣💣💣 @here ALERT: DANGEROUS AIR QUALITY 💣💣💣', embeds: [alertEmbed] });
    }
  } else {
    // Regular status update (every minute or on status change)
    const statusColor = airQualityData.status === 'Warning' ? CONFIG.warningColor : CONFIG.normalColor;
    const statusIcon = airQualityData.status === 'Warning' ? '⚠️' : '✅';
    
    const statusEmbed = new EmbedBuilder()
      .setTitle(`${statusIcon} Air Quality Status`)
      .setColor(statusColor)
      .addFields(
        { name: 'Methane (CH₄)', value: `${data.CH4}/100`, inline: true },
        { name: 'Carbon Monoxide (CO)', value: `${data.CO}/100`, inline: true },
        { name: 'Status', value: airQualityData.status, inline: false },
        { name: 'Last Updated', value: new Date().toLocaleTimeString(), inline: false }
      )
      .setTimestamp();
    
    // Update the existing message if available, otherwise send a new one
    if (lastStatusMessage && now - lastStatusMessage.createdTimestamp < 60000 && !statusChanged) {
      lastStatusMessage.edit({ embeds: [statusEmbed] }).catch(console.error);
    } else {
      channel.send({ embeds: [statusEmbed] }).then(msg => {
        lastStatusMessage = msg;
      }).catch(console.error);
    }
  }
}

// Log air quality data to file
function logAirQualityData(data) {
  // Create today's log file name
  const date = new Date();
  const fileName = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.csv`;
  const filePath = path.join(CONFIG.dataLogPath, fileName);
  
  // Check if file exists and create header if needed
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'timestamp,methane,carbonMonoxide,status,mq4Voltage,mq7Voltage\n');
  }
  
  // Append data
  const logLine = `${data.timestamp},${data.methane},${data.carbonMonoxide},${data.status},${data.mq4Voltage},${data.mq7Voltage}\n`;
  fs.appendFileSync(filePath, logLine);
}

// Rotate logs daily
function rotateLogs() {
  console.log('Rotating logs...');
  // This function is called daily, so nothing more is needed
  // as we use date-based filenames
}

// Send messages to the primary channel
function sendToChannel(message) {
  const channel = client.channels.cache.get(CONFIG.primaryChannelId);
  if (channel) {
    channel.send(message).catch(console.error);
  }
}

// Send commands to the Arduino
function sendArduinoCommand(command) {
  if (serialPort && serialPort.isOpen) {
    serialPort.write(command + '\n', (err) => {
      if (err) {
        console.error('Error sending command to Arduino:', err);
        return false;
      }
      return true;
    });
  } else {
    console.error('Serial port not open');
    return false;
  }
}

// Message handler
client.on(Events.MessageCreate, async message => {
  // Ignore messages from bots and messages not starting with !air
  if (message.author.bot || !message.content.startsWith('!air')) return;
  
  // Parse command
  const args = message.content.slice('!air'.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Command handling
  if (commandName === 'status') {
    handleStatusCommand(message);
  }
  else if (commandName === 'help') {
    handleHelpCommand(message);
  }
  else if (commandName === 'graph') {
    handleGraphCommand(message);
  }
  else if (commandName === 'test') {
    handleTestCommand(message);
  }
  else if (commandName === 'set') {
    handleSetCommand(message, args);
  }
  else if (commandName === 'restart') {
    handleRestartCommand(message);
  }
  else if (commandName === 'logs') {
    handleLogsCommand(message);
  }
});

// Command handler functions

function handleStatusCommand(message) {
  const statusEmbed = new EmbedBuilder()
    .setTitle('AirGuardian System Status')
    .setDescription('Current air quality monitoring system status')
    .setColor(airQualityData.status === 'Normal' ? CONFIG.normalColor : 
              airQualityData.status === 'Warning' ? CONFIG.warningColor : CONFIG.dangerColor)
    .addFields(
      { name: 'Current Status', value: airQualityData.status, inline: true },
      { name: 'Buzzer', value: airQualityData.buzzerActive ? 'Active' : 'Inactive', inline: true },
      { name: 'Serial Connection', value: serialPort && serialPort.isOpen ? 'Connected' : 'Disconnected', inline: true },
      { name: 'Latest Methane Reading', value: airQualityData.methane.length > 0 ? `${airQualityData.methane[airQualityData.methane.length - 1]}/100` : 'No data', inline: true },
      { name: 'Latest CO Reading', value: airQualityData.carbonMonoxide.length > 0 ? `${airQualityData.carbonMonoxide[airQualityData.carbonMonoxide.length - 1]}/100` : 'No data', inline: true },
      { name: 'System Uptime', value: formatUptime(process.uptime()), inline: true }
    )
    .setTimestamp();
  
  // Create buttons for interactions
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('refresh_status')
        .setLabel('Refresh')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('arduino_status')
        .setLabel('Arduino Status')
        .setStyle(ButtonStyle.Secondary)
    );
  
  message.reply({ embeds: [statusEmbed], components: [row] });
}

function handleHelpCommand(message) {
  const helpEmbed = new EmbedBuilder()
    .setTitle('AirGuardian Commands')
    .setDescription('Available commands for the air quality monitoring system')
    .setColor('#5865F2')
    .addFields(
      { name: '!air status', value: 'Show current system status', inline: false },
      { name: '!air graph', value: 'Show air quality history graph', inline: false },
      { name: '!air test', value: 'Test the alert system', inline: false },
      { name: '!air logs', value: 'Get recent log files', inline: false },
      { name: '!air set [parameter] [value]', value: 'Change system parameters (admin only)', inline: false },
      { name: '!air restart', value: 'Restart serial connection (admin only)', inline: false },
      { name: '!air help', value: 'Show this help message', inline: false }
    )
    .setFooter({ text: 'AirGuardian System v2.0' });
  
  message.reply({ embeds: [helpEmbed] });
}

function handleGraphCommand(message) {
  // Simple text-based graph for now
  if (airQualityData.methane.length === 0 || airQualityData.carbonMonoxide.length === 0) {
    message.reply('Not enough data to generate a graph. Please wait for more readings.');
    return;
  }
  
  // Create ASCII art graph
  let graphText = '```\nAir Quality History (Last readings)\n';
  graphText += '------------------------------------\n';
  
  // CH4 readings
  graphText += 'CH4: ';
  for (let i = Math.max(0, airQualityData.methane.length - 20); i < airQualityData.methane.length; i++) {
    const value = airQualityData.methane[i];
    if (value >= 70) graphText += '█';
    else if (value >= 40) graphText += '▓';
    else if (value >= 20) graphText += '▒';
    else graphText += '░';
  }
  graphText += '\n';
  
  // CO readings
  graphText += 'CO:  ';
  for (let i = Math.max(0, airQualityData.carbonMonoxide.length - 20); i < airQualityData.carbonMonoxide.length; i++) {
    const value = airQualityData.carbonMonoxide[i];
    if (value >= 60) graphText += '█';
    else if (value >= 30) graphText += '▓';
    else if (value >= 15) graphText += '▒';
    else graphText += '░';
  }
  graphText += '\n';
  
  graphText += '------------------------------------\n';
  graphText += 'Legend: █ Danger | ▓ Warning | ▒ Elevated | ░ Normal\n';
  graphText += '```';
  
  message.reply(graphText);
}

function handleTestCommand(message) {
  if (serialPort && serialPort.isOpen) {
    message.reply('Sending test command to Arduino...');
    sendArduinoCommand('test alarm');
  } else {
    message.reply('Cannot send test command - serial port not connected');
  }
}

function handleSetCommand(message, args) {
  // Check if user has admin permissions
  if (message.author.id !== CONFIG.adminUserId) {
    message.reply('❌ You do not have permission to use this command');
    return;
  }
  
  if (args.length < 2) {
    message.reply('Usage: !air set [parameter] [value]');
    return;
  }
  
  const parameter = args[0].toLowerCase();
  const value = args[1];
  
  switch (parameter) {
    case 'mq4warning':
      sendArduinoCommand(`set mq4warning ${value}`);
      message.reply(`Setting MQ4 warning threshold to ${value}`);
      break;
    case 'mq4danger':
      sendArduinoCommand(`set mq4danger ${value}`);
      message.reply(`Setting MQ4 danger threshold to ${value}`);
      break;
    case 'mq7warning':
      sendArduinoCommand(`set mq7warning ${value}`);
      message.reply(`Setting MQ7 warning threshold to ${value}`);
      break;
    case 'mq7danger':
      sendArduinoCommand(`set mq7danger ${value}`);
      message.reply(`Setting MQ7 danger threshold to ${value}`);
      break;
    case 'alertinterval':
      const interval = parseInt(value);
      if (!isNaN(interval) && interval >= 5000) {
        CONFIG.alertInterval = interval;
        message.reply(`Alert interval set to ${interval}ms`);
      } else {
        message.reply('Alert interval must be at least 5000ms (5 seconds)');
      }
      break;
    default:
      message.reply(`Unknown parameter: ${parameter}`);
  }
}

function handleRestartCommand(message) {
  // Check if user has admin permissions
  if (message.author.id !== CONFIG.adminUserId) {
    message.reply('❌ You do not have permission to use this command');
    return;
  }
  
  message.reply('Restarting serial connection...');
  
  // Close existing connection if open
  if (serialPort && serialPort.isOpen) {
    serialPort.close((err) => {
      if (err) {
        console.error('Error closing serial port:', err);
        message.reply('Error closing serial port: ' + err.message);
      } else {
        // Reinitialize after port is closed
        setTimeout(() => {
          initializeSerialConnection();
          message.reply('Serial connection restarted');
        }, 2000);
      }
    });
  } else {
    // Initialize if not already open
    initializeSerialConnection();
    message.reply('Serial connection initialized');
  }
}

function handleLogsCommand(message) {
  // Get list of available log files
  fs.readdir(CONFIG.dataLogPath, (err, files) => {
    if (err) {
      console.error('Error reading log directory:', err);
      message.reply('Error retrieving logs: ' + err.message);
      return;
    }
    
    // Filter for CSV files and sort by date (newest first)
    const logFiles = files
      .filter(file => file.endsWith('.csv'))
      .sort()
      .reverse();
    
    if (logFiles.length === 0) {
      message.reply('No log files found');
      return;
    }
    
    // Create embed with log file list
    const logsEmbed = new EmbedBuilder()
      .setTitle('AirGuardian Log Files')
      .setDescription('Recent log files of air quality data')
      .setColor('#5865F2')
      .setTimestamp();
    
    // Add the most recent logs (up to 10)
    const recentLogs = logFiles.slice(0, 10);
    recentLogs.forEach(file => {
      // Get file stats
      const stats = fs.statSync(path.join(CONFIG.dataLogPath, file));
      const fileSizeKB = Math.round(stats.size / 1024 * 10) / 10;
      
      logsEmbed.addFields({
        name: file,
        value: `Size: ${fileSizeKB}KB | Created: ${new Date(stats.birthtime).toLocaleString()}`,
        inline: false
      });
    });
    
    // Create buttons for downloading logs
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('download_latest_log')
          .setLabel('Download Latest Log')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('view_log_summary')
          .setLabel('View Summary')
          .setStyle(ButtonStyle.Secondary)
      );
    
    message.reply({ embeds: [logsEmbed], components: [row] });
  });
}

// Button interaction handler
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  
  // Handle button clicks
  if (interaction.customId === 'refresh_status') {
    await interaction.deferUpdate();
    handleStatusCommand(interaction.message);
  }
  else if (interaction.customId === 'arduino_status') {
    await interaction.deferUpdate();
    if (serialPort && serialPort.isOpen) {
      sendArduinoCommand('status');
      await interaction.followUp({ content: 'Status request sent to Arduino', ephemeral: true });
    } else {
      await interaction.followUp({ content: 'Serial port not connected', ephemeral: true });
    }
  }
  else if (interaction.customId === 'download_latest_log') {
    await interaction.deferUpdate();
    
    // Get most recent log file
    fs.readdir(CONFIG.dataLogPath, (err, files) => {
      if (err || files.length === 0) {
        interaction.followUp({ content: 'No log files available', ephemeral: true });
        return;
      }
      
      const logFiles = files
        .filter(file => file.endsWith('.csv'))
        .sort()
        .reverse();
      
      if (logFiles.length === 0) {
        interaction.followUp({ content: 'No log files available', ephemeral: true });
        return;
      }
      
      const latestLog = logFiles[0];
      const logPath = path.join(CONFIG.dataLogPath, latestLog);
      
      // Upload file attachment (limited to Discord's file size limits)
      try {
        const stats = fs.statSync(logPath);
        
        if (stats.size > 8 * 1024 * 1024) {
          interaction.followUp({ content: 'Log file too large to upload (>8MB)', ephemeral: true });
          return;
        }
        
        interaction.followUp({ 
          content: `Here's the latest log file: ${latestLog}`,
          files: [{ attachment: logPath, name: latestLog }]
        });
      } catch (error) {
        console.error('Error sending log file:', error);
        interaction.followUp({ content: 'Error sending log file: ' + error.message, ephemeral: true });
      }
    });
  }
  else if (interaction.customId === 'view_log_summary') {
    await interaction.deferUpdate();
    
    // Get most recent log file and generate summary
    fs.readdir(CONFIG.dataLogPath, (err, files) => {
      if (err || files.length === 0) {
        interaction.followUp({ content: 'No log files available', ephemeral: true });
        return;
      }
      
      const logFiles = files
        .filter(file => file.endsWith('.csv'))
        .sort()
        .reverse();
      
      if (logFiles.length === 0) {
        interaction.followUp({ content: 'No log files available', ephemeral: true });
        return;
      }
      
      const latestLog = logFiles[0];
      const logPath = path.join(CONFIG.dataLogPath, latestLog);
      
      // Read and parse log file
      fs.readFile(logPath, 'utf8', (err, data) => {
        if (err) {
          interaction.followUp({ content: 'Error reading log file: ' + err.message, ephemeral: true });
          return;
        }
        
        try {
          // Parse CSV data
          const lines = data.trim().split('\n');
          if (lines.length <= 1) {
            interaction.followUp({ content: 'Log file is empty', ephemeral: true });
            return;
          }
          
          // Skip header line
          const entries = lines.slice(1).map(line => {
            const [timestamp, methane, co, status] = line.split(',');
            return { timestamp, methane: parseFloat(methane), co: parseFloat(co), status };
          });
          
          // Generate summary
          const numEntries = entries.length;
          let dangerCount = 0, warningCount = 0, normalCount = 0;
          let maxMethane = 0, maxCO = 0;
          let avgMethane = 0, avgCO = 0;
          
          entries.forEach(entry => {
            // Count statuses
            if (entry.status === 'Danger') dangerCount++;
            else if (entry.status === 'Warning') warningCount++;
            else normalCount++;
            
            // Track max values
            maxMethane = Math.max(maxMethane, entry.methane);
            maxCO = Math.max(maxCO, entry.co);
            
            // Sum for averages
            avgMethane += entry.methane;
            avgCO += entry.co;
          });
          
          // Calculate averages
          avgMethane = Math.round((avgMethane / numEntries) * 10) / 10;
          avgCO = Math.round((avgCO / numEntries) * 10) / 10;
          
          // First and last timestamps
          const firstTime = new Date(entries[0].timestamp).toLocaleString();
          const lastTime = new Date(entries[entries.length - 1].timestamp).toLocaleString();
          
          // Create summary embed
          const summaryEmbed = new EmbedBuilder()
            .setTitle(`Log Summary: ${latestLog}`)
            .setDescription(`Summary of ${numEntries} readings from ${firstTime} to ${lastTime}`)
            .setColor('#5865F2')
            .addFields(
              { name: 'Status Distribution', value: `🟢 Normal: ${normalCount}\n🟡 Warning: ${warningCount}\n🔴 Danger: ${dangerCount}`, inline: true },
              { name: 'Methane (CH₄)', value: `Avg: ${avgMethane}/100\nMax: ${maxMethane}/100`, inline: true },
              { name: 'Carbon Monoxide (CO)', value: `Avg: ${avgCO}/100\nMax: ${maxCO}/100`, inline: true }
            )
            .setTimestamp();
          
          interaction.followUp({ embeds: [summaryEmbed] });
          
        } catch (error) {
          console.error('Error processing log file:', error);
          interaction.followUp({ content: 'Error processing log file: ' + error.message, ephemeral: true });
        }
      });
    });
  }
});

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  client.destroy();
  process.exit(0);
});

// Start the bot
client.login(CONFIG.token);
