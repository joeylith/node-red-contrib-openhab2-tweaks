module.exports = function(RED) {

    function TweakInNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.on('input', function(msg) {

            msg = { item: msg.item,
                    topic: msg.payload.topic,
                    payload: msg.payload.payload.value,
                    event: msg.payload.type.replace(/Event$/,'') };

            node.status({fill : msg.payload == 'ON' ? "green" : "red",
                         shape : msg.payload == 'ON' ? "dot" : "ring",
                         text : msg.topic + ' : ' + msg.payload});

            switch (msg.event) {
                case 'ItemStateChanged':
                    node.send([msg, null, null, msg]);
                    break;

                case 'ItemState':
                    node.send([null, msg, null, msg]);
                    break;

                case 'ItemCommand':
                    node.send([null, null, msg, msg]);
                    break;

                default:
                    node.send([null, null, null, msg]);
            }
        });
    }

    RED.nodes.registerType("tweak_in", TweakInNode);
}
