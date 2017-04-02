/*
* IoT Hub Intel Edison NodeJS - Microsoft Sample Code - Copyright (c) 2016 - Licensed MIT
*/
'use strict';

var gulp = require('gulp');
var gulpCommon = require('gulp-common');
var helper = gulpCommon.all;

var doesReadStorage = require('get-gulp-args')()['read-storage'];
var receiveMessages = doesReadStorage ? require('./azure-table.js').readAzureTable : require('./iot-hub.js').readIoTHub;
var cleanup = doesReadStorage ? require('./azure-table.js').cleanup : require('./iot-hub.js').cleanup;

var configPostfix = "edison";
/**
 * Setup common gulp tasks: init, deploy, run
 */
gulpCommon(gulp, 'edison-node', {
  appName: 'lesson-3',
  configTemplate: {
    "device_host_name_or_ip_address": "[device hostname or IP adress]",
    "device_user_name": "root",
    "device_password": "[device password]",
    "iot_hub_connection_string": "[IoT hub connection string]",
    "iot_device_connection_string": "[IoT device connection string]",
    "azure_storage_connection_string": "[Azure storage connection string]",
    "iot_hub_consumer_group_name": "cg1"
  },
  configPostfix: configPostfix,
  appParams: ' "' + helper.getDeviceConnectionString(configPostfix) + '"'
});

/**
 * Gulp task to clean up resources
 */
gulp.task('cleanup', false, cleanup);

/**
 * Gulp task to start device to send device-to-cloud messages
 */
gulp.task('send-device-to-cloud-messages', false, function () {
  require('run-sequence').use(gulp)('run-internal', 'cleanup');
});

/**
 * Override 'run' task with customized behavior
 */
if (doesReadStorage) {
  gulp.task('query-table-storage', false, () => { receiveMessages(gulp.config); });
  gulp.task('run', 'Runs deployed sample on the board', ['query-table-storage', 'send-device-to-cloud-messages']);
} else {
  gulp.task('query-iot-hub-messages', false, () => { receiveMessages(gulp.config); });
  gulp.task('run', 'Runs deployed sample on the board', ['query-iot-hub-messages', 'send-device-to-cloud-messages']);
}
