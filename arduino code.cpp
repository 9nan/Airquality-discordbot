// Air Quality Monitoring System
// Utilizes MQ-4 and MQ-7 gas sensors, along with a buzzer and LED indicator
// for real-time air quality assessment.

const int mq4Pin = A0; // MQ-4 sensor analog input
const int mq7Pin = A3; // MQ-7 sensor analog input
const int buzzerPin = 12; // Buzzer digital output
const int ledPin = 13; // LED digital output

// Initialization of system components
void setup() {
  Serial.begin(9600); // Start serial communication at 9600 baud rate
  pinMode(buzzerPin, OUTPUT); // Set buzzer pin as output
  pinMode(ledPin, OUTPUT); // Set LED pin as output
}

// Main loop for continuous monitoring
void loop() {
  // Reading sensor values
  int mq4Value = analogRead(mq4Pin);
  int mq7Value = analogRead(mq7Pin);

  // Converting sensor readings to voltage
  float voltage4 = mq4Value * (5.0 / 1024.0);
  float voltage7 = mq7Value * (5.0 / 1024.0);

  // Calculating air quality index - this requires calibration
  int airQualityIndex4 = map(mq4Value, 200, 800, 0, 100);
  int airQualityIndex7 = map(mq7Value, 200, 800, 0, 100);

  // Displaying air quality readings
  Serial.print("MQ-4 Air Quality Index: ");
  Serial.println(airQualityIndex4);
  Serial.print("MQ-7 Air Quality Index: ");
  Serial.println(airQualityIndex7);

  // Activating buzzer and LED if air quality is below threshold
  if (airQualityIndex4 > 10 || airQualityIndex7 > 10) {
    digitalWrite(buzzerPin, HIGH);
    digitalWrite(ledPin, HIGH);
    Serial.println("Warning: Poor Air Quality Detected");
    delay(1000); // Activating alert for 1 second
    digitalWrite(buzzerPin, LOW);
    digitalWrite(ledPin, LOW);
  }

  // Delay before next reading
  delay(5000);
}
