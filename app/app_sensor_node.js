'use strict';

// AIO pin of the light, sound and temperature
var LIGHT_PIN = 0;
var SOUND_PIN = 1;
var TEMP_PIN = 2;
// Read interval in ms
var INTERVAL = 2000;
// Total read times
var MAX_READ_TIMES = 20;

// Load Grove module
var groveSensor = require('jsupm_grove');
// Load Loudness module
var sensorObj = require('jsupm_loudness');

// Create the temperature sensor object using AIO pin 2
var temp = new groveSensor.GroveTemp(TEMP_PIN);
// Create the light sensor object using AIO pin 0
var light = new groveSensor.GroveLight(LIGHT_PIN);
// Instantiate a Loudness sensor on AIO pin 1, with an analog
// reference voltage of 5.0
var sound = new sensorObj.Loudness(SOUND_PIN, 5.0);


var readTimes = 0;
var waiting = setInterval(function() {

  readTempSensorValue();        
  readLightSensorValue();
  readSoundSensorValue();

  readTimes++;
  if (readTimes == MAX_READ_TIMES) clearInterval(waiting);
}, INTERVAL);
    



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