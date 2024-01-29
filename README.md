# Air Quality Monitoring System with Discord Notification

## Project Overview
This project involves an air quality monitoring system that uses MQ-4 and MQ-7 gas sensors for detecting methane (CH4) and carbon monoxide (CO) levels, respectively. It includes an Arduino setup for sensor readings and a Discord bot for real-time notifications. The bot is developed using the `discord.js@v13` library and communicates with the Arduino through a serial connection.

## Components
- Arduino (Uno, Mega, or similar)
- MQ-4 Gas Sensor
- MQ-7 Gas Sensor
- Buzzer
- LED
- PC with Node.js and npm installed
- Breadboard and connecting wires

## Setup and Configuration
### Hardware Setup
Follow the instructions in the initial README section.

### Software Setup
1. Install Node.js and npm on your PC.
2. Clone or download the project repository to your local machine.
3. Navigate to the project directory and run `npm install` in the command prompt to install the required dependencies.
4. Update the `TOKEN` and `CHANNEL_ID` in the Discord bot script with your bot's token and the desired channel ID.

## Discord Bot
The Discord bot is programmed to read serial data from the Arduino and send real-time air quality updates to a specified Discord channel.

### Code Explanation
- **Dependencies:** The bot uses the `discord.js` library for Discord interactions and `serialport` for serial communication.
- **Configuration:** The bot requires a valid Discord bot token and a channel ID where messages will be sent.
- **Serial Communication:** It reads data from the specified serial port and processes it line by line.
- **Discord Notification:** Sends air quality data to the specified Discord channel. If the "BuzzerActivated" string is detected, it sends a series of bomb emojis as an additional alert.

## Running the Bot
1. Ensure the Arduino is connected and the air quality monitoring script is uploaded and running.
2. Run the Discord bot script using Node.js.
3. The bot will start sending air quality updates to the specified Discord channel.

## Calibration
Refer to the initial README section for calibration details.

## Safety and Precautions
Follow the safety instructions provided in the initial README section.

