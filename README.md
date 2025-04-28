# AirGuardian: Advanced Air Quality Monitoring System with Discord Integration

## Project Overview
AirGuardian is a sophisticated air quality monitoring system that utilizes MQ-4 and MQ-7 gas sensors to detect methane (CH₄) and carbon monoxide (CO) levels in the air. The system features an Arduino-based sensor array and a Discord bot for real-time notifications and remote monitoring. The bot is built with the latest discord.js v14 library and communicates with the Arduino through a serial connection.

![AirGuardian System](https://placeholder.com/air-guardian-system)

## Features
- **Real-time air quality monitoring** with automatic alerts
- **Multi-level alerting system** (Normal, Warning, Danger) with visual and audio indicators
- **Discord integration** for remote monitoring and control
- **Customizable thresholds** for different environments
- **Data logging** for historical analysis and trend identification
- **Interactive commands** for system control and data visualization
- **Configurable through environment variables** for easy deployment

## Components
### Hardware Requirements
- **Arduino** (Uno, Mega, or similar)
- **MQ-4 Gas Sensor** (Methane detection)
- **MQ-7 Gas Sensor** (Carbon Monoxide detection)
- **LEDs** (Green, Yellow, Red for status indication)
- **Buzzer** (for audible alerts)
- **PC or Raspberry Pi** (to run the Discord bot)
- **Breadboard and jumper wires** for connections

### Software Requirements
- **Node.js** (v16.9.0 or higher)
- **npm** (Node Package Manager)
- **Arduino IDE** (for uploading the Arduino code)
- **Discord Bot Token** (obtained from the Discord Developer Portal)

## Setup Instructions

### Hardware Setup
1. **Connect the sensors to the Arduino:**
   - MQ-4 sensor analog output to A0
   - MQ-7 sensor analog output to A3
   - Red LED to digital pin 13
   - Yellow LED to digital pin 11
   - Green LED to digital pin 10
   - Buzzer to digital pin 12

2. **Power the Arduino** via USB or external power supply.

3. **Connect the Arduino to your computer** via USB.

### Arduino Setup
1. Open the Arduino IDE.
2. Load the provided `airguardian.ino` file.
3. Select your Arduino board and port.
4. Upload the code to your Arduino.

### Discord Bot Setup
1. **Create a Discord Bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Navigate to the "Bot" tab and click "Add Bot"
   - Copy the token (you'll need this later)
   - Under "Privileged Gateway Intents", enable:
     - Server Members Intent
     - Message Content Intent
     - Presence Intent

2. **Invite the Bot to your server:**
   - Go to the "OAuth2" tab
   - Select "bot" under "Scopes"
   - Select permissions: "Send Messages", "Read Message History", "Use Embedded Activities"
   - Copy the generated URL and open it in your browser
   - Select your server and authorize the bot

3. **Setup the Node.js application:**
   - Clone this repository to your local machine
   - Navigate to the project directory
   - Run `npm install` to install dependencies
   - Create a `.env` file based on the template provided

4. **Configure the application:**
   - In the `.env` file, add:
     ```
     DISCORD_TOKEN=your_bot_token_here
     DISCORD_CHANNEL_ID=your_channel_id_here
     ADMIN_USER_ID=your_discord_user_id
     SERIAL_PORT=your_arduino_port (e.g., COM3 on Windows or /dev/ttyACM0 on Linux)
     ```

5. **Start the application:**
   - Run `npm start` to start the bot
   - Verify that the bot connects to Discord and the Arduino

## Using the Discord Bot

### Basic Commands
- `!air help` - Display available commands
- `!air status` - Show current air quality status
- `!air graph` - Display a graph of recent air quality readings
- `!air logs` - Access logging data
- `!air test` - Test the alarm system

### Admin Commands
- `!air set mq4warning [value]` - Set methane warning threshold
- `!air set mq4danger [value]` - Set methane danger threshold
- `!air set mq7warning [value]` - Set carbon monoxide warning threshold
- `!air set mq7danger [value]` - Set carbon monoxide danger threshold
- `!air restart` - Restart the serial connection

## Sensor Calibration

### MQ-4 Sensor (Methane)
The MQ-4 sensor is primarily sensitive to methane (CH₄) but can also detect other combustible gases. To properly calibrate:

1. **Pre-heat the sensor** for at least 24 hours in clean air for initial stabilization.
2. **Baseline readings:** Take readings in known clean air to establish your baseline.
3. **Adjust thresholds** based on your environment using the `!air set` commands.

### MQ-7 Sensor (Carbon Monoxide)
The MQ-7 sensor is designed to detect carbon monoxide (CO). Proper calibration:

1. **Pre-heat the sensor** for 48 hours for initial stabilization.
2. **Baseline readings:** Take readings in known clean air to establish your baseline.
3. **Periodic recalibration** is recommended every 6 months.

## Data Logging and Analysis
AirGuardian automatically logs all sensor readings to CSV files organized by date. These files are stored in the `air_quality_logs` directory and can be accessed via the `!air logs` command.

Each log entry contains:
- Timestamp
- Methane reading
- Carbon monoxide reading
- Alert status
- Raw sensor voltage values

## Customization

### Environment Variables
All system settings can be customized through environment variables. See `config.js` for the complete list of configurable options.

### Adding Additional Sensors
The system can be extended to support additional sensors:

1. Add the sensor to the Arduino circuit
2. Update the Arduino code to read from the new sensor
3. Modify the serial communication protocol to include the new data
4. Update the Discord bot to display and alert on the new readings

## Troubleshooting

### Common Issues
1. **Serial port not found:**
   - Verify Arduino is connected
   - Check the port name in your `.env` file
   - Ensure you have permission to access the port

2. **Discord bot not responding:**
   - Verify your bot token
   - Check that the bot has proper permissions
   - Ensure the bot is in the correct channel

3. **Sensors giving unusual readings:**
   - Check wiring connections
   - Ensure proper power supply
   - Allow proper warm-up time for sensors

## Safety Considerations
- This system is designed for monitoring purposes only and should not replace professional safety equipment.
- Ensure the system is properly tested before relying on it for safety-critical applications.
- Always follow local safety regulations regarding gas monitoring and alerts.
- In case of emergency, evacuate the area and contact emergency services.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- The MQ series gas sensors manufacturers
- Discord.js library developers
- SerialPort library developers
- Arduino community

## Version History
- v2.0.0 - Complete system overhaul with enhanced features
- v1.0.0 - Initial release
