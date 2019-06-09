module.exports = function(RED) {

    function Openhab2InState(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        var node = this;

        var openhabController = RED.nodes.getNode(config.controller);

        var itemName = config.itemname;

        if (itemName != undefined) itemName = itemName.trim();

        this.refreshNodeStatus = function() {
            var currentState = node.context().currentState;

            if (currentState == null)
                node.status({fill:"yellow", shape: "ring", text: "state:" + currentState});

            else if (currentState == "ON")
                node.status({fill:"green", shape: "dot", text: "state:" + currentState});

            else if (currentState == "OFF")
                node.status({fill:"green", shape: "ring", text: "state:" + currentState});

            else
                node.status({fill:"blue", shape: "ring", text: "state:" + currentState});
        };

        this.processStateEvent = function(event) {

            var context = node.context();
            var currentState = event.state;

            if ( context.currentState != currentState ) {

                // update node's context variable
                context.currentState = currentState;

                // update node's visual status
                node.refreshNodeStatus();

                // inject the state in the node-red flow
                node.send({_msgid: event._msgid, 
                            topic: 'smarthome/items/' + itemName + '/state', 
                            payload: currentState, 
                            item: itemName, 
                            event: "StateEvent", 
                            type: event.type});
            }

        };

        node.context().currentState = "?";
        openhabController.addListener(itemName + '/StateEvent', node.processStateEvent);

        node.refreshNodeStatus();

        this.on("close", function() {
            openhabController.removeListener(itemName + '/StateEvent', node.processStateEvent);
        });

    }

    RED.nodes.registerType("openhab2_in_state", Openhab2InState);
}
