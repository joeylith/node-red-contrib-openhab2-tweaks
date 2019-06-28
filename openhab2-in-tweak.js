module.exports = function(RED) {

    function Openhab2InTweak(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        var node = this;

        var openhabController = RED.nodes.getNode(config.controller);

        var itemName = config.itemname;

        if (itemName != undefined) itemName = itemName.trim();

        this.refreshNodeStatus = function() {
            var context = node.context();

            var eventtype = context.currentEventType || config.eventtype;
            var currentMessage = context.currentMessage[eventtype] || '?';
            
            if (eventtype == null) return;            

            eventtype = eventtype.replace(/^Item(\S+)Event/,'$1').toLowerCase();

            var status = {fill:"blue", shape: "ring", 
                          text: eventtype == 'statechanged' ? `${eventtype}:${context.oldValue}=>${currentMessage}` : 
                                                              `${eventtype}:${currentMessage}`};

            if (!currentMessage) status.fill = "yellow";

            else if (currentMessage == "ON") {
                status.fill = "green";
                status.shape = "dot";
            }
            else if (currentMessage == "OFF") {
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
                }, 30000);
        };

        this.processRawEvent = function(event) {
            if (config.eventtype && event.type != config.eventtype) return;

            var context = node.context();
            var currentMessage = event.payload.value;

            if ( !config.outputall && context.currentMessage[event.type] == currentMessage ) return;

            // update node's context variable
            context.currentMessage[event.type] = currentMessage;
            context.currentEventType = event.type;
            context.oldValue = event.payload.oldValue;

            // update node's visual status
            node.refreshNodeStatus();

            // inject the command in the node-red flow
            node.send({_msgid: event._msgid, 
                        topic: event.topic, 
                        payload: currentMessage, 
                        item: itemName, 
                        event: event.type.replace(/^Item/,''), 
                        oldValue: event.type == 'ItemStateChangedEvent' ? event.payload.oldValue : undefined,
                        type: event.type});
        };

        var context = node.context();
        context.currentMessage = {};

        openhabController.addListener(itemName + '/RawEvent', node.processRawEvent);

        // only set status at startup if eventtype is defined
        if (config.eventtype != null) node.refreshNodeStatus();

        this.on("close", function() {
            openhabController.removeListener(itemName + '/RawEvent', node.processRawEvent);
        });

    }

    RED.nodes.registerType("openhab2-in-tweak", Openhab2InTweak);
}
