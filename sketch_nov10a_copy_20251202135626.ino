#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h> // สำหรับสร้าง JSON
#include <DHT.h>       // สำหรับ Sensor

// --- 1. ตั้งค่า ---
const char* WIFI_SSID = "TEST-PUATC";
const char* WIFI_PASS = "12345678";

// (ต้องตรงกับใน server.js)
const char* MQTT_BROKER = "192.168.30.247";
const char* MQTT_TOPIC = "PuaTC/sensor/temp_hum";

// (ตั้งค่า Sensor)
#define DHTPIN D4       // Pin ที่ต่อ Sensor
#define DHTTYPE DHT22  // ชนิดของ Sensor
DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);

// --- 2. Setup ---
void setup() {
    Serial.begin(9600);
    dht.begin();
    
    // เชื่อมต่อ WiFi
    Serial.print("Connecting to WiFi...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" WiFi Connected!");

    // เชื่อมต่อ MQTT
    client.setServer(MQTT_BROKER, 1883);
    Serial.println("Connecting to MQTT Broker...");
    client.connect("arduino-client-123"); // (ตั้งชื่อ Client ID ไม่ซ้ำกัน)
    Serial.println("MQTT Connected!");
}

// --- 3. Loop (ทำงานวนซ้ำ) ---
void loop() {
    // อ่านค่า Sensor
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        Serial.println("Failed to read from DHT sensor!");
        delay(2000);
        return;
    }

    // สร้างข้อมูล JSON
    StaticJsonDocument<100> doc;
    doc["temp"] = temp;
    doc["hum"] = hum;
    
    char buffer[100];
    serializeJson(doc, buffer);

    // 4. (สำคัญ!) ส่งข้อมูลไปที่ Topic
    Serial.print("Sending data: ");
    Serial.println(buffer);
    client.publish(MQTT_TOPIC, buffer);

    String dhtdata = String(temp) + "," + String(hum);
    Serial.print(dhtdata);
    // หน่วงเวลา 10 วินาที
    delay(10000); 
}