Air Quality Monitoring System
Project Overview
This project is designed to monitor air quality using MQ-4 and MQ-7 gas sensors. The MQ-4 sensor is primarily used for detecting methane (CH4) concentrations in the air, while the MQ-7 sensor is used for detecting carbon monoxide (CO) levels. When poor air quality is detected, the system activates a buzzer and an LED as warning indicators.

Components
Arduino (Uno, Mega, or similar)
MQ-4 Gas Sensor
MQ-7 Gas Sensor
Buzzer
LED
Resistors (if necessary for LED)
Breadboard and connecting wires

Setup and Configuration
Hardware Setup
Connect the MQ-4 sensor to the analog pin A0 on the Arduino.
Connect the MQ-7 sensor to the analog pin A3.
Attach the buzzer to the digital pin 12.
Attach the LED to the digital pin 13.
Ensure all components are securely connected on the breadboard.
Software
Upload the provided C++ code to the Arduino using the Arduino IDE.
Open the serial monitor to view the air quality readings.
Code Explanation
Pin Configuration: The MQ-4 and MQ-7 sensors are connected to analog pins A0 and A3, respectively. The buzzer and LED are connected to digital pins 12 and 13.
Setup: Initializes the serial communication and sets the pin modes.
Main Loop: Reads the analog values from the sensors, converts them to a voltage, calculates an air quality index, and then checks if the air quality is poor. If it is, the buzzer and LED are activated.
Calibration
The map() function in the code is used to convert sensor readings to an air quality index. Adjust the map() parameters based on your calibration tests.
Safety and Precautions
Ensure proper ventilation when testing the sensors, especially for CO.
Avoid direct exposure to high concentrations of gases.

