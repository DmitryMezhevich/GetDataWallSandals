const url = require('url');
const axios = require('axios');
const moment = require('moment-timezone');
var geoip = require('geoip-lite');

module.exports = class PageViewModel {
    time;
    nameOfProduct;
    sourse;
    message = null;

    constructor(model) {
        this.time = moment().tz('Etc/GMT+3').format('HH:mm DD.MM.YYYY');
        this.nameOfProduct = model.nameOfProduct;

        const parsedUrl = url.parse(model.eventSourceUrl);
        this.sourse = {
            url: parsedUrl.pathname,
            eventID: model.eventID,
            pixelID: model.pixelID,
            chanel: model.chanel,
        };

        const _geo = geoip.lookup(model.req.ip);
        this.geo = {
            ip: model.req.ip,
            country: _geo.country,
            city: _geo.city,
            ll: `${_geo.ll[0]} ${_geo.ll[1]}`,
        };

        const _userAgent = model.req.useragent;
        this.userAgent = {
            browser: _userAgent.browser,
            version: _userAgent.version,
            os: _userAgent.os,
            platform: _userAgent.platform,
        };
    }

    createMessage() {
        let message = `<b>Время: ${this.time}</b>\n`;
        message += `<b>Товар: ${this.nameOfProduct}</b>\n\n`;

        message += `<b>Ресурс: </b>\n`;
        message += `\t Сайт: ${this.sourse.url}\n`;
        message += `\t Канал: ${this.sourse.chanel}\n`;
        message += `\t ID Pixel: ${this.sourse.pixelID}\n`;
        message += `\t ID Event: ${this.sourse.eventID.slice(-7)}\n\n`;

        message += `<b>Клиент: </b>\n`;
        message += `\t Браузер: ${this.userAgent.browser}\n`;
        message += `\t Версия браузера: ${this.userAgent.version}\n`;
        message += `\t ОС: ${this.userAgent.os}\n`;
        message += `\t Платформа: ${this.userAgent.platform}\n\n`;

        message += `<b>ГЕО: </b>\n`;
        message += `\t IP: ${this.geo.ip}\n`;
        message += `\t Строна: ${this.geo.country}\n`;
        message += `\t Город: ${this.geo.city}\n`;
        message += `\t Координаты: ${this.geo.ll}`;

        this.message = message;
    }

    async sendPageViewEvent(URI_API, CHAT_ID) {
        this.createMessage();
        await axios.post(URI_API, {
            chat_id: CHAT_ID,
            parse_mode: 'html',
            text: this.message,
        });
    }
};
