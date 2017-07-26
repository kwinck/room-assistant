var config = require('config');
var noble = require('noble');
var console = process.console;
var loopcount = 0;
var sendcount = 0;
var lastsentcount=0;
var senttime;
var lastsenttime = new Date();
var KalmanFilter = require('kalmanjs').default;

var channel = config.get('ble.channel');
var updateFreq = parseInt(config.get('ble.update_frequency'), 0);

var lastUpdateTime = new Date();

function BLEScanner(callback) {
    // constructor
    this.callback = callback;
    this.kalmanManager = {};

    this._init();
    console.info('BLE scanner was initialized');
}

BLEScanner.prototype._init = function () {
    noble.on('stateChange', this._startScanning.bind(this));
    noble.on('discover', this._handlePacket.bind(this));
};

BLEScanner.prototype._startScanning = function (state) {
    if (state === 'poweredOn') {
        noble.startScanning([], true);
    }
    else {
        noble.stopScanning();
    }
};

BLEScanner.prototype._handlePacket = function (peripheral) {
    if (updateFreq > 0) {
        var currTime = new Date();
        if ((currTime - lastUpdateTime) < updateFreq) {
	loopcount++;
            return;
        }
        lastUpdateTime = currTime;
    }
if ((currTime - lastsenttime) > parseInt(60000)&& lastsentcount == 1) {
/*var payload = { 'location': 'away',                                                                                                                                                                    
                'time': lastUpdateTime,                                                                                                                                                              
                'sendcount': sendcount,                                                                                                                                                              
                'loopcount': loopcount,                                                                                                                                                              
                'lastsentcount': lastsentcount,                                                                                                                                                      
                'lastsenttime': lastsenttime ,
		'diff': (currTime - lastsenttime)                                                                                                                                                        
};*/
var location='away';
lastsentcount=0;
this.callback(channel, payload);
}                                                                                                                                                                                                   



    var advertisement = peripheral.advertisement;
loopcount++;
    // check if we have a whitelist
    // and if we do, if this id is listed there
    var whitelist = config.get('ble.whitelist') || [];
    if (whitelist.length == 0 || whitelist.indexOf(peripheral.id) > -1) {
        // default hardcoded value for beacon tx power
        var txPower = advertisement.txPowerLevel || -59;
        var distance = this._calculateDistance(peripheral.rssi, txPower);

        // max distance parameter checking
        var maxDistance = config.get('ble.max_distance') || 0;
        if (maxDistance == 0 || distance <= maxDistance) {
            var filteredDistance = this._filter(peripheral.id, distance);
            var id;

            if (config.get('ble.use_mac')) {
                id = peripheral.address;
            } else {
                id = peripheral.id;
            }

    //        var payload = {
    //            id: id,
    //            name: advertisement.localName,
    //            rssi: peripheral.rssi,
    //            distance: filteredDistance
    //        };
    //          var payload = 'HH';
    //         'topic': '/location/knud_nut_d',
    //         'payload': 'HH' 
	//	};
sendcount++;
lastsentcount=1;
lastsenttime= new Date();
/*
var payload = { 'location': 'HH',
		'time': lastUpdateTime,
		'sendcount': sendcount,
		'loopcount': loopcount,
		'lastsentcount': lastsentcount,
		'lastsenttime': lastsenttime ,
		'diff': (currTime - lastsenttime),
		'currTime': currTime
};
*/
var payload = config.get('ble.location'); 
            this.callback(channel, payload);
        }
    }
};

BLEScanner.prototype._calculateDistance = function (rssi, txPower) {
    if (rssi == 0) {
        return -1.0;
    }

    var ratio = rssi * 1.0 / txPower;
    if (ratio < 1.0) {
        return Math.pow(ratio, 10);
    }
    else {
        return (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    }
};

BLEScanner.prototype._filter = function (id, distance) {
    if (!this.kalmanManager.hasOwnProperty(id)) {
        this.kalmanManager[id] = new KalmanFilter({
            R: config.get('ble.system_noise') || 0.01,
            Q: config.get('ble.measurement_noise') || 3
        });
    }

    return this.kalmanManager[id].filter(distance);
};

module.exports = BLEScanner;
