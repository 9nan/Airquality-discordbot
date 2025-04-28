// AirGuardian - Advanced Air Quality Monitoring System
// Enhanced version with improved sensor handling and alert mechanisms
// Supports MQ-4 (methane), MQ-7 (carbon monoxide), and additional sensors

// Pin configuration
const int mq4Pin = A0;      // MQ-4 sensor (methane) analog input
const int mq7Pin = A3;      // MQ-7 sensor (carbon monoxide) analog input
const int tempPin = A1;     // Temperature sensor analog input (optional)
const int humidityPin = A2; // Humidity sensor analog input (optional)
const int buzzerPin = 12;   // Buzzer digital output
const int redLedPin = 13;   // Red LED digital output (danger)
const int yellowLedPin = 11; // Yellow LED digital output (warning)
const int greenLedPin = 10;  // Green LED digital output (normal)

// Configurable thresholds (can be adjusted via serial commands)
int mq4WarningThreshold = 40;   // Warning threshold for MQ-4
int mq4DangerThreshold = 70;    // Danger threshold for MQ-4
int mq7WarningThreshold = 30;   // Warning threshold for MQ-7
int mq7DangerThreshold = 60;    // Danger threshold for MQ-7

// Calibration values - adjust these based on your sensor calibration
const float mq4CalibrationFactor = 1.2;
const float mq7CalibrationFactor = 1.5;
const int mq4BaselineValue = 200;
const int mq7BaselineValue = 180;

// Variables for sensor readings
int mq4Value, mq7Value, tempValue, humidityValue;
float mq4Voltage, mq7Voltage;
int airQualityIndex4, airQualityIndex7;
String alert = "Normal";
boolean buzzerActivated = false;

// Variables for timing
unsigned long lastReadingTime = 0;
const unsigned long readingInterval = 5000; // 5 seconds between readings
unsigned long lastAlertTime = 0;
const unsigned long alertInterval = 1000;  // 1 second alert pattern
boolean alertState = false;

// Buffer for serial commands
String inputString = "";
boolean stringComplete = false;

void setup() {
  Serial.begin(9600);  // Start serial communication
  
  // Set pin modes
  pinMode(buzzerPin, OUTPUT);
  pinMode(redLedPin, OUTPUT);
  pinMode(yellowLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);
  
  // Initialize LED indicators
  digitalWrite(redLedPin, LOW);
  digitalWrite(yellowLedPin, LOW);
  digitalWrite(greenLedPin, HIGH);
  
  // Reserve memory for serial input
  inputString.reserve(50);
  
  // System startup message
  Serial.println("AirGuardian System Initialized");
  Serial.println("Version 2.0");
  Serial.println("Send 'help' for command list");
}

void loop() {
  // Process any serial commands
  processSerialCommands();
  
  // Read sensors at regular intervals
  unsigned long currentTime = millis();
  if (currentTime - lastReadingTime >= readingInterval) {
    lastReadingTime = currentTime;
    readSensors();
    calculateAirQuality();
    sendDataToSerial();
  }
  
  // Manage alert patterns if needed
  manageAlerts(currentTime);
}

void readSensors() {
  // Read raw sensor values
  mq4Value = analogRead(mq4Pin);
  mq7Value = analogRead(mq7Pin);
  
  // Optional temperature and humidity readings
  // Uncomment if you have these sensors connected
  // tempValue = analogRead(tempPin);
  // humidityValue = analogRead(humidityPin);
  
  // Convert readings to voltage
  mq4Voltage = mq4Value * (5.0 / 1024.0);
  mq7Voltage = mq7Value * (5.0 / 1024.0);
}

void calculateAirQuality() {
  // Apply calibration factors
  float calibratedMq4 = (mq4Value - mq4BaselineValue) * mq4CalibrationFactor;
  float calibratedMq7 = (mq7Value - mq7BaselineValue) * mq7CalibrationFactor;
  
  // Calculate air quality indices (0-100 scale, higher = worse)
  airQualityIndex4 = map(max(0, (int)calibratedMq4), 0, 600, 0, 100);
  airQualityIndex7 = map(max(0, (int)calibratedMq7), 0, 600, 0, 100);
  
  // Clamp values to valid range
  airQualityIndex4 = constrain(airQualityIndex4, 0, 100);
  airQualityIndex7 = constrain(airQualityIndex7, 0, 100);
  
  // Determine alert level based on readings
  if (airQualityIndex4 >= mq4DangerThreshold || airQualityIndex7 >= mq7DangerThreshold) {
    alert = "Danger";
    buzzerActivated = true;
    setLedStatus(HIGH, LOW, LOW); // Red on, others off
  }
  else if (airQualityIndex4 >= mq4WarningThreshold || airQualityIndex7 >= mq7WarningThreshold) {
    alert = "Warning";
    buzzerActivated = false;
    setLedStatus(LOW, HIGH, LOW); // Yellow on, others off
  }
  else {
    alert = "Normal";
    buzzerActivated = false;
    setLedStatus(LOW, LOW, HIGH); // Green on, others off
  }
}

void setLedStatus(boolean red, boolean yellow, boolean green) {
  digitalWrite(redLedPin, red);
  digitalWrite(yellowLedPin, yellow);
  digitalWrite(greenLedPin, green);
}

void sendDataToSerial() {
  // Send formatted data for Discord bot parsing
  Serial.print("DATA_BEGIN|");
  Serial.print("CH4:");
  Serial.print(airQualityIndex4);
  Serial.print("|CO:");
  Serial.print(airQualityIndex7);
  Serial.print("|STATUS:");
  Serial.print(alert);
  
  // Add voltage readings for debugging
  Serial.print("|MQ4_V:");
  Serial.print(mq4Voltage, 2);
  Serial.print("|MQ7_V:");
  Serial.print(mq7Voltage, 2);
  
  // Add buzzer status flag
  if (buzzerActivated) {
    Serial.print("|BUZZER:ON");
  } else {
    Serial.print("|BUZZER:OFF");
  }
  
  Serial.println("|DATA_END");
}

void manageAlerts(unsigned long currentTime) {
  // Control buzzer pattern if active
  if (buzzerActivated) {
    if (currentTime - lastAlertTime >= alertInterval) {
      lastAlertTime = currentTime;
      alertState = !alertState;
      digitalWrite(buzzerPin, alertState);
    }
  } else {
    digitalWrite(buzzerPin, LOW);
  }
}

void processSerialCommands() {
  // Check for complete commands
  if (stringComplete) {
    // Trim whitespace
    inputString.trim();
    
    // Process command
    if (inputString.equals("help")) {
      printHelp();
    }
    else if (inputString.startsWith("set mq4warning ")) {
      int value = inputString.substring(14).toInt();
      if (value > 0 && value < 100) {
        mq4WarningThreshold = value;
        Serial.print("MQ4 Warning Threshold set to: ");
        Serial.println(value);
      }
    }
    else if (inputString.startsWith("set mq4danger ")) {
      int value = inputString.substring(13).toInt();
      if (value > 0 && value < 100) {
        mq4DangerThreshold = value;
        Serial.print("MQ4 Danger Threshold set to: ");
        Serial.println(value);
      }
    }
    else if (inputString.startsWith("set mq7warning ")) {
      int value = inputString.substring(14).toInt();
      if (value > 0 && value < 100) {
        mq7WarningThreshold = value;
        Serial.print("MQ7 Warning Threshold set to: ");
        Serial.println(value);
      }
    }
    else if (inputString.startsWith("set mq7danger ")) {
      int value = inputString.substring(13).toInt();
      if (value > 0 && value < 100) {
        mq7DangerThreshold = value;
        Serial.print("MQ7 Danger Threshold set to: ");
        Serial.println(value);
      }
    }
    else if (inputString.equals("status")) {
      printStatus();
    }
    else if (inputString.equals("test alarm")) {
      testAlarm();
    }
    
    // Clear the string for new input
    inputString = "";
    stringComplete = false;
  }
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    // Add to input string if not newline
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

void printHelp() {
  Serial.println("AirGuardian Commands:");
  Serial.println("  help - Show this help message");
  Serial.println("  status - Show current thresholds and readings");
  Serial.println("  set mq4warning [0-100] - Set MQ4 warning threshold");
  Serial.println("  set mq4danger [0-100] - Set MQ4 danger threshold");
  Serial.println("  set mq7warning [0-100] - Set MQ7 warning threshold");
  Serial.println("  set mq7danger [0-100] - Set MQ7 danger threshold");
  Serial.println("  test alarm - Test the alarm system");
}

void printStatus() {
  Serial.println("AirGuardian Status:");
  Serial.print("  MQ4 (Methane) Reading: ");
  Serial.print(airQualityIndex4);
  Serial.print("/100 (Warning: ");
  Serial.print(mq4WarningThreshold);
  Serial.print(", Danger: ");
  Serial.print(mq4DangerThreshold);
  Serial.println(")");
  
  Serial.print("  MQ7 (Carbon Monoxide) Reading: ");
  Serial.print(airQualityIndex7);
  Serial.print("/100 (Warning: ");
  Serial.print(mq7WarningThreshold);
  Serial.print(", Danger: ");
  Serial.print(mq7DangerThreshold);
  Serial.println(")");
  
  Serial.print("  Current Status: ");
  Serial.println(alert);
}

void testAlarm() {
  Serial.println("Testing alarm system...");
  
  // Test LEDs in sequence
  Serial.println("Testing Green LED");
  setLedStatus(LOW, LOW, HIGH);
  delay(1000);
  
  Serial.println("Testing Yellow LED");
  setLedStatus(LOW, HIGH, LOW);
  delay(1000);
  
  Serial.println("Testing Red LED");
  setLedStatus(HIGH, LOW, LOW);
  delay(1000);
  
  // Test buzzer
  Serial.println("Testing Buzzer");
  digitalWrite(buzzerPin, HIGH);
  delay(500);
  digitalWrite(buzzerPin, LOW);
  delay(250);
  digitalWrite(buzzerPin, HIGH);
  delay(500);
  digitalWrite(buzzerPin, LOW);
  
  Serial.println("Alarm test complete");
  
  // Restore normal status
  calculateAirQuality();
}
