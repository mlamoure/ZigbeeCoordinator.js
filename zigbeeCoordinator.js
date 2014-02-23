var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');
var path = require('path');
var ZigbeeCoordinatorConfiguration = require("./zigbeeCoordinatorConfiguration.js");
var configFileIncPath = path.join(__dirname + '/configuration.json');

var configuration;

function main() {
	configuration = new ZigbeeCoordinatorConfiguration();
	configuration.setConfiguration(configFileIncPath);
	configuration.on("configComplete", configComplete);
}

function configComplete() {
	var C = xbee_api.constants;
	var xbeeAPI = new xbee_api.XBeeAPI({
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
	xbeeAPI.on("frame_object", function(frame) {
		console.log("OBJ> "+util.inspect(frame));
	});    
}

main();
