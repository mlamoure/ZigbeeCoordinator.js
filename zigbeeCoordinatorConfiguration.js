var util  = require('util');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var schedule = require('node-schedule');

function ZigbeeCoordinatorConfiguration() {
	var _self = this;
	var _configFile;
	var _configComplete = false;
	var _configCompleteCallback;
	var _dateformat = "YYYY/MM/DD HH:mm:ss";
	var _reCheckConfigurationJob;

	this.data;

	this.setConfiguration = function (configFile) {
		_configFile = configFile;

		this._loadConfiguration();
		this._monitor();
	}

	this.on = function (onEvent, eventFunction) {
		if (onEvent == "configComplete") {
			_configCompleteCallback = eventFunction;

			if (_configComplete) {
				_configCompleteCallback();		
			}
		}
	}

	this._monitor = function () {
	}

	this._loadConfiguration = function () {
		console.log("** (" + this._getCurrentTime() + ") Loading the configuration from " + _configFile);
		
		fs.readFile(_configFile, 'utf8', function (err, fileData) {
			if (err) {
				console.log("** (" + _self._getCurrentTime() + ") ERROR LOADING CONFIGURATION: " + err);
				return;
			}

			try {
				_self.data = JSON.parse(fileData);
			}
			catch (err) {
				console.log("** (" + _self._getCurrentTime() + ") CONFIGURATION: Got an error.  Going to schedule a re-check in 3 minutes. Error: " + err);
				console.log(err.stack);
								
				// going to keep trying until we get it right.
				if (typeof _reCheckConfigurationJob !== 'undefined') {
					_reCheckConfigurationJob.cancel();
					_reCheckConfigurationJob = undefined;
				}

				var recheckTime = moment().add('m', 3).format(_dateformat);

				_reCheckConfigurationJob = schedule.scheduleJob(recheckTime, function() {
					main();

					_reCheckConfigurationJob = undefined;
				});
			}

			_configComplete = true;

			if (typeof(_configCompleteCallback) !== 'undefined') {
				_configCompleteCallback();
			}
		});
	}

	this._getCurrentTime = function () {
		return moment().format(_dateformat);
	}
}

module.exports = ZigbeeCoordinatorConfiguration;