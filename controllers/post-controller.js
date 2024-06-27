const axios = require('axios');
const moment= require('moment');
const logger = require('../logger');

const sqlRequest = require('../db/requestSQL-helper');

const TOKEN = 'vk1.a.KFKmxEKIi-kJiFKL4vbjsc5m2FIGRGEWKXFNvZzAIIKMbohUPGcOUBv812djGZy9H4vIJhVHsBm96QaC4R71fs0cw9FdJxi84v2PjZ0gZ-Vbaa8Debn9wKuJKBads66lO6TnB0FvZxGDXk10ql5JbAYDUozXDS4oLJSohLIjxoUx06n5Hmq0HPYDaVKHoh2KMrJK2Y02BPnVy8f4t49w6g';

class TarckController {
    // Отправляем события просмотра в телеграм
    async get(req, res, next) {
        try {
            const filter = {
                deep: req.body.deep.length === 0 ? 10 : parseInt(req.body.deep),
                noLessReposts: req.body.noLessReposts.length === 0 ? 0 : parseInt(req.body.noLessReposts),
                noMoreReposts: req.body.noMoreReposts.length === 0 ? Number.MAX_VALUE : parseInt(req.body.noMoreReposts),
                startDate: req.body.startDate.length === 0 ? moment(0).unix() : moment(req.body.startDate, 'DD-MM-YYYY').unix(),
                endDate: req.body.endDate.length === 0 ? moment().unix() : moment(req.body.endDate, 'DD-MM-YYYY').unix(),
                minDate: 1704067200,
            }

            if (filter.startDate === filter.endDate) {
                const dayPlus = moment.unix(filter.endDate);
                dayPlus.add(1, 'day');
                filter.endDate = dayPlus.unix();
            }

            let list = await sqlRequest.getListGoods();
            list = list.map(item => item.domain);

            let listGroups = [];
            for (let i = 0; i < list.length; i += 10) {
                listGroups.push(list.slice(i, i + 10));
            }

            const deepStep = Math.floor(filter.deep / 10);
            
            let listWall = [];
            for (let i = 0; i < listGroups.length; i += 1) {

                for (let y = 0; y <= deepStep; y += 1) {

                    let deep = 10;
                    if (y === deepStep) {
                        deep = filter.deep - deepStep * 10;
                        if (deep === 0) {
                            break;
                        }
                    }

                    let code = 'return [';
                    listGroups[i].forEach(domain => {
                        code += `API.wall.get({"domain": "${domain}", "count": ${deep}, "offset": ${y * 10}}),`;
                    });
                    code = code.slice(0, -1) + '];';

                    const _res = await axios.post('https://api.vk.com/method/execute', null, {
                        headers: { 'Authorization': `Bearer ${TOKEN}`},
                        params: {
                            'v': '5.236',
                            'code': `${code}`
                        }
                    });

                    const _list = _res.data.response.map((item, index) => {
                        if (!item) {
                            sqlRequest.changeErrorRequest(listGroups[i][index]);
                        }
                        return item.items ? item.items : [];
                    });
                    listWall.push(_list.flat())
                }
            }
            listWall = listWall.flat();

            let urlList = listWall.flatMap((item) => {
                class ItemPost {
                    date;
                    url;
                    likes;
                    reposts;
                    views;
                    text;
                    urlImg = null;
                    typeVideo = false;

                    constructor(module) {
                        this.date = moment.unix(module.date).format('DD.MM.YYYY');
                        this.url = `https://vk.com/wall${module.from_id}_${module.id}`;
                        this.reposts = module.reposts.count;
                        this.likes = module.likes.count;
                        this.views = module.views.count;
                        this.text = module.text.slice(0, 250);

                        if (module.attachments) {
                            const attachments = module.attachments;

                            const sizeArray = ['z', 'y', 'x', 'm', 's'];

                            outerLoop:
                            for (const size of sizeArray) {
                                for (const attachment of attachments) {
                                    if (attachment.type === 'photo') {
                                        innerLoop:
                                        for (const item of attachment.photo.sizes) {
                                            if (item.type === size) {
                                                this.urlImg = item.url;
                                                break outerLoop;
                                            }
                                        }
                                    } else if (attachment.type === 'video') {
                                        const preview = attachment.video.image[attachment.video.image.length - 1].url;
                                        this.urlImg = preview ? preview : null;
                                        if (!this.urlImg) {
                                            this.typeVideo = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

                const reposts = item.reposts.count;
                const date = item.date;
                if (reposts >= filter.noLessReposts && reposts <= filter.noMoreReposts) {
                    if (date >= filter.startDate && date <= filter.endDate && date > filter.minDate) {
                        return new ItemPost(item);
                    }
                }
                return [];
            });
            urlList = urlList.sort((a, b) => b.reposts - a.reposts);


            const urlGoogleSheets = 'https://script.google.com/macros/s/AKfycbxEffBnaCWp4Izit7vhGmIvZprScT4ZsWVhsTdj3NvVF_kItVJvdp2I5kqyL6SVPZQGjQ/exec';
            await axios
                .post(urlGoogleSheets, urlList, {
                    headers: {"Content-Type": 'application/json'}
                })

            res.status(200).json({ 
                counts: urlList.length,
                list: urlList,
             });
        } catch (err) {
            logger.error(`Error: ${err.message}`);
            res.status(500).json({ err: err.message });
        }
    }

    async addNewGroup(req, res, next) {
        try {
            const {url, type} = req.body;
            const data ={
                id: null,
                domain: null,
                url: null,
                name: null,
            };

            switch (type) {
                case 'group':
                    data.id = url;

                    const _resGroup = await axios.post('https://api.vk.com/method/groups.getById', null, {
                            headers: { 'Authorization': `Bearer ${TOKEN}`},
                            params: {
                                'group_ids': `${data.id.replace(/\D/g, '')}`,
                                'v': '5.236'
                            }
                        });

                    data.domain = _resGroup.data.response.groups[0].screen_name;
                    data.url = `https://vk.com/${data.domain}`;
                    data.name = _resGroup.data.response.groups[0].name;
                    break;
                case 'user':
                    data.id = url;

                    const _resUser = await axios.post('https://api.vk.com/method/users.get', null, {
                            headers: { 'Authorization': `Bearer ${TOKEN}`},
                            params: {
                                'user_ids': `${data.id.replace(/\D/g, '')}`,
                                'fields': 'status,screen_name',
                                'v': '5.236'
                            }
                        });

                    data.domain = _resUser.data.response[0].screen_name;
                    data.url = `https://vk.com/${data.domain}`;
                    data.name = _resUser.data.response[0].status;
                    break;
                case 'screen':
                    const _resScreen = await axios.post('https://api.vk.com/method/utils.resolveScreenName', null, {
                        headers: { 'Authorization': `Bearer ${TOKEN}`},
                        params: {
                            'screen_name': `${url}`,
                            'v': '5.236'
                        }
                    });

                    data.domain = url;
                    data.url = `https://vk.com/${url}`;

                    if (_resScreen.data.response.type === 'group') {
                        data.id = `-${_resScreen.data.response.object_id}`;
                        const __resScreen = await axios.post('https://api.vk.com/method/groups.getById', null, {
                            headers: { 'Authorization': `Bearer ${TOKEN}`},
                            params: {
                                'group_ids': `${data.id.replace(/\D/g, '')}`,
                                'v': '5.236'
                            }
                        });

                        data.name = __resScreen.data.response.groups[0].name;
                    } else {
                        data.id = `${_resScreen.data.response.object_id}`;
                        const __resScreen = await axios.post('https://api.vk.com/method/users.get', null, {
                            headers: { 'Authorization': `Bearer ${TOKEN}`},
                            params: {
                                'user_ids': `${data.id.replace(/\D/g, '')}`,
                                'fields': 'status',
                                'v': '5.236'
                            }
                        });

                        data.name = __resScreen.data.response[0].status;
                    }
                    break;
                default:
                    break;
            }

            const _res = await axios.post('https://api.vk.com/method/groups.getById', null, {
                headers: { 'Authorization': `Bearer ${TOKEN}`},
                params: {
                    'group_ids': `${req.body.url.split('/').pop()}`,
                    'v': '5.236'
                }
            });

            const result = await sqlRequest.addNewGroup(data.id, data.domain, data.url, data.name);

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
            const {url, type} = req.body;

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