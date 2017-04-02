/*
* IoT Hub Intel Edison NodeJS - Microsoft Sample Code - Copyright (c) 2016 - Licensed MIT
*/
'use strict';

var fs = require('fs');
var path = require('path');
var m = require('mraa');
// Load Grove module
var groveSensor = require('jsupm_grove');
// Load Loudness module
var sensorObj = require('jsupm_loudness');

// Use MQTT protocol to communicate with IoT hub
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;
var Protocol = require('azure-iot-device-mqtt').Mqtt;

// GPIO pin of the LED
var LED_PIN = 13;
// AIO pin of the light, sound and temperature
var LIGHT_PIN = 0;
var SOUND_PIN = 1;
var TEMP_PIN = 2;
// Blink interval in ms
var INTERVAL = 5000;
// Total messages to be sent
var MAX_MESSAGE_COUNT = 2000;
var sentMessageCount = 0;

// Prepare for GPIO operations
var myLed = new m.Gpio(LED_PIN);
//set the gpio direction to output
myLed.dir(m.DIR_OUT);

// Create the temperature sensor object using AIO pin 2
var temp = new groveSensor.GroveTemp(TEMP_PIN);
// Create the light sensor object using AIO pin 0
var light = new groveSensor.GroveLight(LIGHT_PIN);
// Instantiate a Loudness sensor on AIO pin 1, with an analog
// reference voltage of 5.0
var sound = new sensorObj.Loudness(SOUND_PIN, 5.0);

// Read device connection string from command line arguments and parse it
var connectionStringParam = process.argv[2];
var connectionString = ConnectionString.parse(connectionStringParam);
var deviceId = connectionString.DeviceId;

// fromConnectionString must specify a transport constructor, coming from any transport package.
var client = Client.fromConnectionString(connectionStringParam, Protocol);

// Configure the client to use X509 authentication if required by the connection string.
if (connectionString.x509) {
  // Read X.509 certificate and private key.
  // These files should be in the current folder and use the following naming convention:
  // [device name]-cert.pem and [device name]-key.pem, example: myraspberrypi-cert.pem
  var options = {
    cert : fs.readFileSync(path.join(__dirname, deviceId + '-cert.pem')).toString(),
    key : fs.readFileSync(path.join(__dirname, deviceId + '-key.pem')).toString()
  };

  client.setOptions(options);

  console.log('[Device] Using X.509 client certificate authentication');
}

/**
 * Start sending messages after getting connected to IoT Hub.
 * If there is any error, log the error message to console.
 * @param {string}  err - connection error
 */
function connectCallback(err) {
  if (err) {
    console.log('[Device] Could not connect: ' + err);
  } else {
    console.log('[Device] Client connected\n');
    // Wait for 5 seconds so that host machine gets connected to IoT Hub for receiving message.
    setTimeout(sendMessage, 5000);
  }
}

/**
 * Blink LED.
 */
function blinkLED() {
  // Light up LED for 100 ms
  myLed.write(1);
  setTimeout(function () {
    myLed.write(0);
  }, 100);
}

/**
 * Construct device-to-cloud message and send it to IoT Hub.
 */
function sendMessage() {
  sentMessageCount++;

  readTempSensorValue();        
  readLightSensorValue();
  readSoundSensorValue();

  var message = new Message(JSON.stringify({ deviceId: deviceId, messageId: sentMessageCount, temp: temp.value(), light: light.value(), sound: sound.loudness() }));
  console.log("[Device] Sending message #" + sentMessageCount + ": " + message.getData());
  client.sendEvent(message, sendMessageCallback);
}

/**
 * Blink LED after message is sent out successfully, otherwise log the error message to console.
 * If sent message count is less than max message count allowed, schedule to send another message.
 * Else, exit process after several seconds.
 * @param {object}  err - sending message error
 */
function sendMessageCallback(err) {
  if (err) {
    console.log('[Device] Message error: ' + err.toString());
  } else {
    // Blink once after successfully sending one message.
    blinkLED();
  }

  if (sentMessageCount < MAX_MESSAGE_COUNT) {
    setTimeout(sendMessage, INTERVAL);
  } else {
    // Wait 10 more seconds to exit so that Azure function has the chance to process sent messages.
    setTimeout(function () {
      process.exit();
    }, 10000);
  }
}

// Read the input and print both the normalized ADC value and a rough
// lux value, waiting INTERVAL second between readings
function readLightSensorValue() {
  console.log(light.name() + " raw value is " + light.raw_value() 
    + ", which is roughly " + light.value() + " lux");
}

// Read the temperature MAX_READ_TIMES times, printing both the Celsius and
// equivalent Fahrenheit temperature, waiting INTERVAL second between readings
function readTempSensorValue() {
  var celsius = temp.value();
  var fahrenheit = celsius * 9.0/5.0 + 32.0;
  console.log(temp.name() + " " + celsius + " degrees Celsius, or " 
    + Math.round(fahrenheit) + " degrees Fahrenheit");
}

function readSoundSensorValue() {
  console.log("Detected loudness (volts): " + sound.loudness());
}

// Connect to IoT Hub and send messages via the callback.
client.open(connectCallback);
