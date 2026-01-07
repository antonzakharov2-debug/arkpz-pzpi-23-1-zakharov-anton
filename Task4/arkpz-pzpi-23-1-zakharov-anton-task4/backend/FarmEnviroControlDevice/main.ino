#include <WiFi.h>
#include <HTTPClient.h>

// ====== PINS ======
#define LED_PIN     2
#define BUZZER_PIN  4

// ====== WIFI ======
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// ====== API ======
const char* apiUrl = "http://localhost:5000/api/sensors";

// ====== LIMITS ======
const float TEMP_CRITICAL = 39.5;
const int   PULSE_CRITICAL = 110;

void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("FarmEnviroControl ESP32 Simulator");
  Serial.println("Connecting to WiFi...");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
}

void loop() {
  // ====== SIMULATED DATA ======
  float temperature = random(370, 420) / 10.0; // 37.0 - 42.0
  int pulse = random(70, 130);                 // bpm

  bool tempCritical = temperature > TEMP_CRITICAL;
  bool pulseCritical = pulse > PULSE_CRITICAL;

  String state = "GOOD";

  Serial.println("\n----------------------------");
  Serial.print("Temp: ");
  Serial.print(temperature);
  Serial.print(" °C ");

  if (tempCritical) {
    Serial.print("(CRITICAL > ");
    Serial.print(TEMP_CRITICAL);
    Serial.println(")");
  } else {
    Serial.println("(OK)");
  }

  Serial.print("Pulse: ");
  Serial.print(pulse);
  Serial.print(" bpm ");

  if (pulseCritical) {
    Serial.print("(CRITICAL > ");
    Serial.print(PULSE_CRITICAL);
    Serial.println(")");
  } else {
    Serial.println("(OK)");
  }

  // ====== STATE LOGIC ======
  if (tempCritical || pulseCritical) {
    state = "BAD";

    Serial.println("STATE: BAD");
    Serial.println("ALERT: Animal health is CRITICAL");
    Serial.println("Reason:");

    if (tempCritical) Serial.println(" - High temperature");
    if (pulseCritical) Serial.println(" - High pulse");

    digitalWrite(LED_PIN, HIGH);
    tone(BUZZER_PIN, 1000);

    Serial.println("Buzzer: ON");
    Serial.println("LED: ON");
  } else if (temperature >= 38.0) {
    state = "NORMAL";

    Serial.println("STATE: NORMAL");
    Serial.println("Animal condition requires observation");

    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);

    noTone(BUZZER_PIN);
    Serial.println("LED: BLINK");
  } else {
    state = "GOOD";

    Serial.println("STATE: GOOD");
    Serial.println("Animal is healthy");

    digitalWrite(LED_PIN, LOW);
    noTone(BUZZER_PIN);
  }

  Serial.println("Sending data to API...");
  Serial.print("State sent: ");
  Serial.println(state);

  delay(5000);
}

