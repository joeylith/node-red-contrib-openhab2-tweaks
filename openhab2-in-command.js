module.exports = function(RED) {

    function Openhab2InCommand(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        var node = this;

        var openhabController = RED.nodes.getNode(config.controller);

        var itemName = config.itemname;

        if (itemName != undefined) itemName = itemName.trim();

        this.refreshNodeStatus = function() {
            var currentCommand = node.context().currentCommand;

            if (currentCommand == null)
                node.status({fill:"yellow", shape: "ring", text: "command:" + currentCommand});

            else if (currentCommand == "ON")
                node.status({fill:"green", shape: "dot", text: "command:" + currentCommand});

            else if (currentCommand == "OFF")
                node.status({fill:"green", shape: "ring", text: "command:" + currentCommand});

            else
                node.status({fill:"blue", shape: "ring", text: "command:" + currentCommand});
        };

        this.processRawEvent = function(event) {
            if (event.type != 'ItemCommandEvent') return;

            var context = node.context();
            var currentCommand = event.payload.value;

            // update node's context variable
            context.currentCommand = currentCommand;

            // update node's visual status
            node.refreshNodeStatus();

            // inject the command in the node-red flow
            node.send({_msgid: event._msgid, 
                        topic: event.topic, 
                        payload: currentCommand, 
                        item: itemName, 
                        event: "CommandEvent", 
                        type: event.type});
        };

        node.context().currentCommand = "?";
        openhabController.addListener(itemName + '/RawEvent', node.processRawEvent);

        node.refreshNodeStatus();

        this.on("close", function() {
            openhabController.removeListener(itemName + '/RawEvent', node.processRawEvent);
        });

    }

    RED.nodes.registerType("openhab2-in-command", Openhab2InCommand);
}
