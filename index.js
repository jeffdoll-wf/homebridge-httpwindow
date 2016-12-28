var request = require("request");
var fs = require("fs");
var Service, Characteristic;

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory("homebridge-httpwindow", "Httpwindow", WindowAccessory);
};

function WindowAccessory(log, config) {
	this.log = log;
	this.name = config["name"];
	this.deviceID = config["deviceID"];
	this.statusURL = config["statusURL"];

	this.windowservice = new Service.ContactSensor(this.name);

	this.windowservice
		.getCharacteristic(Characteristic.ContactSensorState)
		.on('get', this.getState.bind(this));
}

function parseStateResponse(body, deviceID)
{
	var windowState = null;
	var x = body.split('\n')[4];
	var statuses = x.substring(0, x.length - 9).split(",");
	var l = statuses.length;
	for (var i = 0; i < l; i++)
	{
		if (statuses[i].indexOf(deviceID) >= 0)
		{
			var state = statuses[i].split("|")[1];
			if (state == "0")
			{
				windowState = "closed";
				console.log("window is closed")
			}
			else if (state == "1")
			{
				windowState = "open";
				console.log("window is open")
			}
		}
	}
	return state;
}

WindowAccessory.prototype.getState = function(callback) {
	this.log("Getting current state...");

	request.get({
		url: this.statusURL
	}, function(err, response, body) {
		if (!err && response.statusCode == 200) {
			var pollState = parseStateResponse(body, this.deviceID);
			var closed = pollState == "closed";
			callback(null, closed); // success
		} else {
			this.log("Error getting state: %s", err);
			callback(err);
		}
	}.bind(this));
};

//DoorAccessory.prototype.setState = function(state, callback) {
//	var doorState = (state == Characteristic.TargetDoorState.CLOSED) ? "closed" : "open";
//	this.log("Set state to %s", doorState);
//	request.get({
//		url: this.controlURL
//	}, function(err, response, body) {
//		if (!err && response.statusCode == 200) {
//			this.log("State change complete.");
//			var currentState = (state == Characteristic.TargetDoorState.CLOSED) ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN;
//			this.windowservice
//			.setCharacteristic(Characteristic.CurrentDoorState, currentState);
//
//			callback(null); // success
//		} else {
//			this.log("Error '%s' setting door state. Response: %s", err, body);
//			callback(err || new Error("Error setting door state."));
//		}
//	}.bind(this));
//};

WindowAccessory.prototype.getServices = function() {
	return [this.windowservice];
};