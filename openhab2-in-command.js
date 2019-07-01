module.exports = function(RED) {

    function Openhab2InCommand(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        var node = this;

        var openhabController = RED.nodes.getNode(config.controller);

        var itemName = config.itemname;

        if (itemName != undefined) itemName = itemName.trim();

        this.refreshNodeStatus = function() {
            var context = node.context();

            var currentCommand = context.currentCommand;
            
            var status = {fill:"blue", shape: "ring", text: "command:" + currentCommand};

            if (!currentCommand) status.fill = "yellow";

            else if (currentCommand == "ON") {
                status.fill = "green";
                status.shape = "dot";
            }
            else if (currentCommand == "OFF") {
                status.fill = "red";
                status.shape = "dot";
            }

            node.status(status);

            if (context.timer) clearTimeout(context.timer);

            context.timer = 
                setTimeout(function() {
                    node.status({
                        fill: status.fill,
                        text: status.text,
                        shape: "ring"
                    });
                }, 120000);
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
