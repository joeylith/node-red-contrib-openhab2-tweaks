module.exports = function(RED) {

    function Openhab2InState(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        var node = this;

        var openhabController = RED.nodes.getNode(config.controller);

        var itemName = config.itemname;

        if (itemName != undefined) itemName = itemName.trim();

        this.refreshNodeStatus = function() {
            var context = node.context();

            var currentState = context.currentState;
            
            var status = {fill:"blue", shape: "ring", text: "state:" + currentState};

            if (!currentState) status.fill = "yellow";

            else if (currentState == "ON") {
                status.fill = "green";
                status.shape = "dot";
            }
            else if (currentState == "OFF") {
                status.fill = "red";
                status.shape = "dot";
            }

            node.status(status);

            if (context.timer) clearTimeout(context.timer);

            context.flow.ringstatus_timeout = context.flow.ringstatus_timeout || 120000;

            context.timer =
                setTimeout(function() {
                    node.status({
                        fill: status.fill,
                        text: status.text,
                        shape: "ring"
                    });
                }, context.flow.ringstatus_timeout);
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

    RED.nodes.registerType("openhab2-in-state", Openhab2InState);
}
