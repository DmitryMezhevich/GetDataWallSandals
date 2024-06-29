const axios = require('axios');

const sqlRequest = require('../db/requestSQL-helper');
const ItemPostModule = require('../models/itemPostModel');

const TOKEN =
    'vk1.a.KFKmxEKIi-kJiFKL4vbjsc5m2FIGRGEWKXFNvZzAIIKMbohUPGcOUBv812djGZy9H4vIJhVHsBm96QaC4R71fs0cw9FdJxi84v2PjZ0gZ-Vbaa8Debn9wKuJKBads66lO6TnB0FvZxGDXk10ql5JbAYDUozXDS4oLJSohLIjxoUx06n5Hmq0HPYDaVKHoh2KMrJK2Y02BPnVy8f4t49w6g';

class ControllerHelper {
    async getListWall(filter) {
        let list = await sqlRequest.getListGoods();
        list = list.map((item) => item.domain);

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
                listGroups[i].forEach((domain) => {
                    code += `API.wall.get({"domain": "${domain}", "count": ${deep}, "offset": ${
                        y * 10
                    }}),`;
                });
                code = code.slice(0, -1) + '];';

                const _res = await axios.post(
                    'https://api.vk.com/method/execute',
                    null,
                    {
                        headers: { Authorization: `Bearer ${TOKEN}` },
                        params: {
                            v: '5.236',
                            code: `${code}`,
                        },
                    }
                );

                const _list = _res.data.response.map((item, index) => {
                    if (!item) {
                        sqlRequest.changeErrorRequest(listGroups[i][index]);
                    }
                    return item.items ? item.items : [];
                });
                listWall.push(_list.flat());
            }
        }
        listWall = listWall.flat();

        return listWall;
    }

    getUrlList(listWall, filter) {
        const list = {
            allSize: {
                sandals: [],
                sneakers: [],
                other: [],
            },
            notSize: {
                sandals: [],
                sneakers: [],
                other: [],
            },
        };

        listWall.forEach((item) => {
            if (item.hasOwnProperty('copy_history')) {
                item.attachments = item.copy_history[0].attachments;
                item.date = item.copy_history[0].date;
                item.text = item.copy_history[0].text;
            }
            const reposts = item.reposts.count;
            const date = item.date;
            if (
                reposts >= filter.noLessReposts &&
                reposts <= filter.noMoreReposts
            ) {
                if (
                    date >= filter.startDate &&
                    date <= filter.endDate &&
                    date > filter.minDate
                ) {
                    const obj = new ItemPostModule(item);
                    const groupe = this.#cheakGrup(item.text);
                    switch (groupe) {
                        case 'sandals':
                            if (this.#cheakSize(item.text)) {
                                list.allSize.sandals.push(obj);
                            } else {
                                list.notSize.sandals.push(obj);
                            }
                            break;
                        case 'sneakers':
                            if (this.#cheakSize(item.text)) {
                                list.allSize.sneakers.push(obj);
                            } else {
                                list.notSize.sneakers.push(obj);
                            }
                            break;
                        default:
                            if (this.#cheakSize(item.text)) {
                                list.allSize.other.push(obj);
                            } else {
                                list.notSize.other.push(obj);
                            }
                    }
                }
            }
        });

        return list;
    }

    async sendToGoogleSheets(urlList) {
        const urlGoogleSheets =
            'https://script.google.com/macros/s/AKfycby8ckmXFQSyync4CqMZzOWqcLSE0FFpbF-Ij-82hgvFvElR_4nSk-GDVkszn-f4nd2QbQ/exec';
        axios.post(urlGoogleSheets, urlList, {
            headers: { 'Content-Type': 'application/json' },
        });
    }

    #cheakGrup(text) {
        const sandalsGroupe = ['Бос', 'Тап', 'Санд', 'Крок', 'Лоф'];
        const sneakersGroupe = ['Крос'];

        if (sandalsGroupe.some((substring) => text.includes(substring))) {
            return 'sandals';
        }
        if (sneakersGroupe.some((substring) => text.includes(substring))) {
            return 'sneakers';
        }
        return 'other';
    }

    #cheakSize(text) {
        const size = ['37', '38', '39', '40'];

        if (size.every((substring) => text.includes(substring))) {
            return true;
        }
        return false;
    }
}

module.exports = new ControllerHelper();
