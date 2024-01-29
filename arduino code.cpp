// Pin configuration


/*The script is for a project 
involving gas sensors (MQ-4 and MQ-7), a buzzer, and an LED,
likely intended for air quality monitoring.*/


const int mq4Pin = A0; // Analog pin for MQ4 sensor
const int mq7Pin = A3; // Analog pin for MQ7 sensor
const int buzzerPin = 12; // Digital pin for the buzzer
const int ledPin = 13; // Digital pin for the LED

void setup() {
  Serial.begin(9600);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // Read analog values from sensors
  int mq4Value = analogRead(mq4Pin);
  int mq7Value = analogRead(mq7Pin);

  // Convert analog values to voltage
  float voltage4 = (mq4Value / 1024.0) * 5.0;
  float voltage7 = (mq7Value / 1024.0) * 5.0;

  // Calculate air quality index (calibrate based on your specific sensors)
  int airQualityIndex4 = map(mq4Value, 200, 800, 0, 100);
  int airQualityIndex7 = map(mq7Value, 200, 800, 0, 100);

  Serial.print("MQ-4 Air Quality: ");
  Serial.println(airQualityIndex4);
  Serial.print("MQ-7 Air Quality: ");
  Serial.println(airQualityIndex7);

  // Check air quality and activate buzzer and LED accordingly
if (airQualityIndex4 > 10 || airQualityIndex7 > 10) {
    digitalWrite(buzzerPin, HIGH);
    digitalWrite(ledPin, HIGH);
    Serial.println("BuzzerActivated"); // Add this line
    delay(1000); // Buzzer and LED ON for 1 second
    digitalWrite(buzzerPin, LOW);
    digitalWrite(ledPin, LOW);
}


  delay(5000); // Delay for 5 seconds before the next reading
}