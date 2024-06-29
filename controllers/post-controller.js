const axios = require('axios');
const logger = require('../logger');

const sqlRequest = require('../db/requestSQL-helper');
const FilterModel = require('../models/filterModel');
const constrollerHelper = require('../helpers/controller-helper');

const TOKEN =
    'vk1.a.KFKmxEKIi-kJiFKL4vbjsc5m2FIGRGEWKXFNvZzAIIKMbohUPGcOUBv812djGZy9H4vIJhVHsBm96QaC4R71fs0cw9FdJxi84v2PjZ0gZ-Vbaa8Debn9wKuJKBads66lO6TnB0FvZxGDXk10ql5JbAYDUozXDS4oLJSohLIjxoUx06n5Hmq0HPYDaVKHoh2KMrJK2Y02BPnVy8f4t49w6g';

class TarckController {
    // Отправляем события просмотра в телеграм
    async get(req, res, next) {
        try {
            const filter = new FilterModel(req.body);

            const listWall = await constrollerHelper.getListWall(filter);

            const urlList = constrollerHelper.getUrlList(listWall, filter);

            constrollerHelper.sendToGoogleSheets(urlList);

            res.status(200).json({
                list: urlList,
            });
        } catch (err) {
            logger.error(`Error: ${err.message}`);
            res.status(500).json({ err: err.message });
        }
    }

    async addNewGroup(req, res, next) {
        try {
            const { url, type } = req.body;
            const data = {
                id: null,
                domain: null,
                url: null,
                name: null,
            };

            switch (type) {
                case 'group':
                    data.id = url;

                    const _resGroup = await axios.post(
                        'https://api.vk.com/method/groups.getById',
                        null,
                        {
                            headers: { Authorization: `Bearer ${TOKEN}` },
                            params: {
                                group_ids: `${data.id.replace(/\D/g, '')}`,
                                v: '5.236',
                            },
                        }
                    );

                    data.domain = _resGroup.data.response.groups[0].screen_name;
                    data.url = `https://vk.com/${data.domain}`;
                    data.name = _resGroup.data.response.groups[0].name;
                    break;
                case 'user':
                    data.id = url;

                    const _resUser = await axios.post(
                        'https://api.vk.com/method/users.get',
                        null,
                        {
                            headers: { Authorization: `Bearer ${TOKEN}` },
                            params: {
                                user_ids: `${data.id.replace(/\D/g, '')}`,
                                fields: 'status,screen_name',
                                v: '5.236',
                            },
                        }
                    );

                    data.domain = _resUser.data.response[0].screen_name;
                    data.url = `https://vk.com/${data.domain}`;
                    data.name = _resUser.data.response[0].status;
                    break;
                case 'screen':
                    const _resScreen = await axios.post(
                        'https://api.vk.com/method/utils.resolveScreenName',
                        null,
                        {
                            headers: { Authorization: `Bearer ${TOKEN}` },
                            params: {
                                screen_name: `${url}`,
                                v: '5.236',
                            },
                        }
                    );

                    data.domain = url;
                    data.url = `https://vk.com/${url}`;

                    if (_resScreen.data.response.type === 'group') {
                        data.id = `-${_resScreen.data.response.object_id}`;
                        const __resScreen = await axios.post(
                            'https://api.vk.com/method/groups.getById',
                            null,
                            {
                                headers: { Authorization: `Bearer ${TOKEN}` },
                                params: {
                                    group_ids: `${data.id.replace(/\D/g, '')}`,
                                    v: '5.236',
                                },
                            }
                        );

                        data.name = __resScreen.data.response.groups[0].name;
                    } else {
                        data.id = `${_resScreen.data.response.object_id}`;
                        const __resScreen = await axios.post(
                            'https://api.vk.com/method/users.get',
                            null,
                            {
                                headers: { Authorization: `Bearer ${TOKEN}` },
                                params: {
                                    user_ids: `${data.id.replace(/\D/g, '')}`,
                                    fields: 'status',
                                    v: '5.236',
                                },
                            }
                        );

                        data.name = __resScreen.data.response[0].status;
                    }
                    break;
                default:
                    break;
            }

            const _res = await axios.post(
                'https://api.vk.com/method/groups.getById',
                null,
                {
                    headers: { Authorization: `Bearer ${TOKEN}` },
                    params: {
                        group_ids: `${req.body.url.split('/').pop()}`,
                        v: '5.236',
                    },
                }
            );

            const result = await sqlRequest.addNewGroup(
                data.id,
                data.domain,
                data.url,
                data.name
            );

            if (result) {
                res.status(200).json({ status: true });
            } else {
                res.status(200).json({ status: false });
            }
        } catch (err) {
            logger.error(`Error: ${err.message}`);
            res.status(500).json({ err: err.message });
        }
    }

    async checkGroup(req, res, next) {
        try {
            const { url, type } = req.body;

            let result = null;
            switch (type) {
                case 'group':
                case 'user':
                    result = await sqlRequest.getGroupByID(url);
                    break;
                case 'screen':
                    result = await sqlRequest.getGroupByDomain(url);
                    break;
                default:
                    break;
            }

            if (result) {
                res.status(200).json({ exist: true });
            } else {
                res.status(200).json({ exist: false });
            }
        } catch (err) {
            logger.error(`Error: ${err.message}`);
            res.status(500).json({ err: err.message });
        }
    }

    async removeGroupByURL(req, res, next) {
        try {
            await sqlRequest.removeGroupByURL(req.body.url);
            res.status(200).json({ status: true });
        } catch (err) {
            logger.error(`Error: ${err.message}`);
            res.status(500).json({ err: err.message });
        }
    }
}

module.exports = new TarckController();
