// AirGuardian Configuration
// This file contains all configurable settings for the AirGuardian system
// Create a .env file in the root directory to override these settings

require('dotenv').config();

module.exports = {
  // Discord Bot Settings
  discord: {
    token: process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN',
    primaryChannelId: process.env.DISCORD_CHANNEL_ID || 'YOUR_CHANNEL_ID',
    adminUserId: process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID',
    dangerEmoji: '💣',
    warningEmoji: '⚠️',
    normalEmoji: '✅',
    notificationCooldown: parseInt(process.env.NOTIFICATION_COOLDOWN) || 300000, // 5 minutes
    statusUpdateInterval: parseInt(process.env.STATUS_UPDATE_INTERVAL) || 60000, // 1 minute
  },
  
  // Serial Communication Settings
  serial: {
    port: process.env.SERIAL_PORT || 'COM3', // Change to your Arduino port
    baudRate: parseInt(process.env.BAUD_RATE) || 9600,
    reconnectDelay: parseInt(process.env.RECONNECT_DELAY) || 10000, // 10 seconds
  },
  
  // Sensor Settings
  sensors: {
    // Default thresholds (these can be overridden by Arduino)
    methaneWarningThreshold: parseInt(process.env.METHANE_WARNING) || 40,
    methaneDangerThreshold: parseInt(process.env.METHANE_DANGER) || 70,
    coWarningThreshold: parseInt(process.env.CO_WARNING) || 30,
    coDangerThreshold: parseInt(process.env.CO_DANGER) || 60,
    
    // Data storage settings
    maxDataPoints: parseInt(process.env.MAX_DATA_POINTS) || 1440, // 24 hours at 1 reading per minute
  },
  
  // Logging Settings
  logging: {
    dataLogPath: process.env.LOG_PATH || './air_quality_logs',
    logRotationInterval: parseInt(process.env.LOG_ROTATION) || 86400000, // 24 hours
    enableConsoleLogging: process.env.CONSOLE_LOGGING !== 'false',
  },
  
  // UI Settings
  ui: {
    normalColor: process.env.NORMAL_COLOR || '#43B581', // Green
    warningColor: process.env.WARNING_COLOR || '#FAA61A', // Yellow/Orange
    dangerColor: process.env.DANGER_COLOR || '#F04747',  // Red
  }
};
