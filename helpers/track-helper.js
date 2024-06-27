const moment = require('moment-timezone');
const bizSdk = require('facebook-nodejs-business-sdk');
const cyrillicToTranslit = require('cyrillic-to-translit-js');

const EventRequest = bizSdk.EventRequest;
const CustomData = bizSdk.CustomData;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;

class TrackHelper {
    createFBEvent(headers, model, accessToken) {
        bizSdk.FacebookAdsApi.init(accessToken);
        let currentTimestamp = moment().tz('Etc/GMT+3').unix();

        const userData = new UserData()
            .setClientIpAddress(
                headers['x-forwarded-for']?.split(',')[0].trim()
            )
            .setClientUserAgent(headers['user-agent'])
            .setExternalId(model.externalID);

        if (model.fbp) {
            userData.setFbp(model.fbp);
        }

        if (model.fbc) {
            userData.setFbc(model.fbc);
        }

        const serverEvent = new ServerEvent()
            .setEventName(model.eventName)
            .setEventId(model.eventID)
            .setEventTime(currentTimestamp)
            .setUserData(userData)
            .setEventSourceUrl(model.eventSourceUrl)
            .setActionSource('website');

        if (model.eventName === 'Purchase') {
            const customData = new CustomData()
                .setCurrency(model.currency)
                .setValue(model.value);

            serverEvent.setCustomData(customData);

            const _phone = this.#formatPhoneNumber(model.phone);
            if (_phone) {
                userData.setPhone(_phone);
            }

            if (model.name && model.name.length > 0) {
                userData.setFirstName(
                    cyrillicToTranslit().transform(model.name)
                );
            }
        }

        const eventsData = [serverEvent];
        const eventRequest = new EventRequest(
            accessToken,
            model.pixelID
        ).setEvents(eventsData);

        if (model.testEventCode) {
            eventRequest.setTestEventCode(model.testEventCode);
        }

        return eventRequest;
    }

    #formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            return null;
        }

        phoneNumber = phoneNumber.replace(/\D/g, '');

        if (phoneNumber.length >= 9) {
            let firstChars = phoneNumber.slice(0, -7);
            const lastSevnChars = phoneNumber.slice(-7);

            if (firstChars.includes('25')) {
                firstChars = '37525';
            }
            if (firstChars.includes('33')) {
                firstChars = '37533';
            } else if (firstChars.includes('44')) {
                firstChars = '37544';
            } else firstChars = '37529';

            return `${firstChars}${lastSevnChars}`;
        } else {
            return null;
        }
    }
}

module.exports = new TrackHelper();
