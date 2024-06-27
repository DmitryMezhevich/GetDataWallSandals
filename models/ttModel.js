const moment = require('moment-timezone');
const sha256 = require('js-sha256');

module.exports = class TTModel {
    event_source = 'web';
    event_source_id;
    data;

    constructor(module) {
        this.event_source_id = module.pixelID;
        this.data = [
            {
                event: module.eventName,
                event_time: moment().tz('Etc/GMT+3').unix(),
                event_id: module.eventID,
                user: {
                    external_id: sha256(module.externalID),
                    ip: module.headers['x-forwarded-for']?.split(',')[0].trim(),
                    user_agent: module.headers['user-agent'],
                },
                page: {
                    url: module.eventSourceUrl,
                    referrer: module.eventSourceUrl,
                },
            },
        ];

        if (module.ttclid) {
            this.data[0].user.ttclid = module.ttclid;
        }

        if (module.ttp) {
            this.data[0].user.ttp = module.ttp;
        }

        if (module.phone) {
            this.data[0].user.phone = sha256(module.phone);

            this.data[0].properties = {
                content_type: 'product',
                currency: module.currency,
                value: module.value,
                contents: [
                    {
                        content_id: module.contentID,
                    },
                ],
            };
        }
        if (module.testEventCode) {
            this.test_event_code = module.testEventCode;
        }
    }
};
