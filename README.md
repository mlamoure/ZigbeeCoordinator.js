Made for use with Raspberry Pi using Node.js.  Requires a XBee radio (configured with Coordinator API firmware) with USB dongle or explorer.  Uses a Jouz's xbee API for most of the magic.

The coordinator will listen for messages from end devices and routers.  When a Tx Request is recieved, a matching algorithm will figure out what to do with the message (configuratble through the configuration file).  Options include publication to Amazon SNS topic.  Others might be added.  My other repositories have strong code bases to do cool things with the Amazon SNS Topic, so getting the Zigbee message into a JSON object and published is a powerful thing.

Requirements
---
npm install xbee-api
See: https://github.com/jouz/xbee-api