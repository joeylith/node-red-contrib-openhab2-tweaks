module.exports = function(RED) {

    function Openhab2OutTweak(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        var openhabController = RED.nodes.getNode(config.controller);
        var node = this;

        // handle incoming node-red message
        this.on("input", function(msg) {

            // if a item/topic/payload is specified in the node's configuration, it overrides the item/topic/payload specified in the message
            var item = config.itemname || msg.item;
            var topic = config.topic || msg.topic;
            var payload = config.payload || (typeof msg.payload === 'boolean') ? (msg.payload ? 'ON' : 'OFF') : msg.payload;

            if ( payload != undefined ) {
                // execute the appropriate http POST to send the command to openHAB
                // and update the node's status according to the http response

                openhabController.control(item, topic, payload,
                                          function(body) {
                                              // no body expected for a command or update
                                              node.status({fill: "green", 
                                                           shape: "dot", 
                                                           text: payload + " => " + item + "/" + 
                                                                 topic.replace("Item", "").toLowerCase()});
                                              node.send(msg);
                                          },
                                          function(err) {
                                              node.status({fill:"red", shape: "ring", text: err});
                                              node.warn(String(err));
                                          }
                );

            }
            else
            {
                // no payload specified !
                node.status({fill:"red", shape: "ring", text: "no payload specified"});
                node.warn('onInput: no payload specified');
            }

        });
        this.on("close", function() {
            node.log('close');
        });
    }

    RED.nodes.registerType("openhab2_out_tweak", Openhab2OutTweak);
}
