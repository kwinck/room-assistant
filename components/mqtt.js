var config = require('config');
var mqtt = require('mqtt');
var console = process.console;

function MQTTPublisher() {
    var options = {
        username: config.get('mqtt.username'),
        password: config.get('mqtt.password'),
        rejectUnauthorized: config.get('mqtt.reject_unauthorized')
    };

    this.client = mqtt.connect(config.get('mqtt.url'), options);
    console.info('Connected to MQTT server');
}

MQTTPublisher.prototype.publish = function (channel, payload, options) {
    var topic = channel + '/' + config.get('mqtt.topic');

    this.client.publish(topic, JSON.stringify(payload), options);
    //this.client.publish(topic, (payload), options);
};

module.exports = MQTTPublisher;
