var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');
var path = require('path');

var aws = require('aws-sdk');
var AWS_SNS;

var JSONConfigurationController = require("./JSONConfigurationController.js");
var configFileIncPath = path.join(__dirname + '/configuration.json');

var configuration;
var C;
var xbeeAPI;

function main() {
	configuration = new JSONConfigurationController();
	configuration.setConfiguration(configFileIncPath);
	configuration.on("configComplete", configComplete);
}

function coordinateFrame(frame) {
	if (configuration.data.Debug) {
		console.log("** (" + getCurrentTime() + ") Got a frame of type: " + frame.type);
	}

	if (configuration.data.Debug) {
		console.log("** (" + getCurrentTime() + ") frame recieved: ", frame);
	}

	if (frame.type == 144) {
		console.log("** (" + getCurrentTime() + ") Payload: " + String.fromCharCode.apply(null, frame.data));
		try {
			var payloadData = JSON.parse(String.fromCharCode.apply(null, frame.data));
		}
		catch (err) {
			console.log("** (" + getCurrentTime() + ") Error reading the payload.  Might not be JSON format: " + err);
			console.log(err.stack);
		}

		// loop through each device configuration
		for (var deviceConfigurations in configuration.data.DeviceConfiguration) {
			console.log("Looking at configuration file DeviceConfiguration: " + configuration.data.DeviceConfiguration[deviceConfigurations].name);

			// loop through the attributes for each device config
			for(var attributeName in payloadData) {
				console.log("Looking at payloadData attribute: " + attributeName);

				// if the attribute matches the ID field
				if (attributeName == configuration.data.DeviceConfiguration[deviceConfigurations].idField) {

					// if the value of that attribute matches the value
					if (payloadData[attributeName] == configuration.data.DeviceConfiguration[deviceConfigurations].idValue) {

						// Now that we found the correct device, iterate through publication methods
						for (alertMethod in configuration.data.DeviceConfiguration[deviceConfigurations].PublishMethods) {
							if (configuration.data.DeviceConfiguration[deviceConfigurations].PublishMethods[alertMethod].method == "sns") {
								
								if (!configuration.data.FakePublish) {
									configuration.amazonSNSPublisher.publish(
										configuration.data.DeviceConfiguration[deviceConfigurations].PublishMethods[alertMethod].AWSTopicARN,
										JSON.stringify(payloadData)
										);									
								}
								return;
							}
						}
					}
				}
			}
		}
	}	
}

function configComplete() {
	C = xbee_api.constants;
	xbeeAPI = new xbee_api.XBeeAPI({
		api_mode: configuration.data.ZigBeeSerialConfiguration.APMode
	});

	var serialport = new SerialPort(
		configuration.data.ZigBeeSerialConfiguration.SerialPort, {
			baudrate: configuration.data.ZigBeeSerialConfiguration.BaudRate,
			parser: xbeeAPI.rawParser()
		}
	);

	serialport.on("open", function() {
		var frame_obj = { // AT Request to be sent to 
			type: C.FRAME_TYPE.AT_COMMAND,
			command: "NI",
			commandParameter: [],
		};
		serialport.write(xbeeAPI.buildFrame(frame_obj));
	});

	// All frames parsed by the XBee will be emitted here
	xbeeAPI.on("frame_object", coordinateFrame);
}

function getCurrentTime() {
	var dateformat = "YYYY/MM/DD HH:mm:ss";
	return moment().format(dateformat);
}

main();
