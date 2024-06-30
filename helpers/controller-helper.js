const axios = require('axios');

const sqlRequest = require('../db/requestSQL-helper');
const ItemPostModule = require('../models/itemPostModel');

const TOKEN =
    'vk1.a.KFKmxEKIi-kJiFKL4vbjsc5m2FIGRGEWKXFNvZzAIIKMbohUPGcOUBv812djGZy9H4vIJhVHsBm96QaC4R71fs0cw9FdJxi84v2PjZ0gZ-Vbaa8Debn9wKuJKBads66lO6TnB0FvZxGDXk10ql5JbAYDUozXDS4oLJSohLIjxoUx06n5Hmq0HPYDaVKHoh2KMrJK2Y02BPnVy8f4t49w6g';

class ControllerHelper {
    async getListWall(filter) {
        let listGroups = await sqlRequest.getListGoods();
        listGroups = listGroups.map((item) => item.domain);

        let listWall = [];
        for (const group of listGroups) {
            let offset = 0;
            while (offset >= 0) {
                const list = await this.#getDataWall(group, offset);

                for (const item of list.items) {
                    if (this.#checkDate(filter, item.date)) {
                        listWall.push(item);
                    }
                    if (item.date < filter.startDate && item.is_pinned !== 1) {
                        offset = -2;
                        break;
                    }
                }

                offset += 1;
            }
        }

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
        });

        list.allSize.sandals = list.allSize.sandals.sort(
            (a, b) => a.dateForSort - b.dateForSort
        );
        list.allSize.sneakers = list.allSize.sneakers.sort(
            (a, b) => a.dateForSort - b.dateForSort
        );
        list.allSize.other = list.allSize.other.sort(
            (a, b) => a.dateForSort - b.dateForSort
        );
        list.notSize.sandals = list.notSize.sandals.sort(
            (a, b) => a.dateForSort - b.dateForSort
        );
        list.notSize.sneakers = list.notSize.sneakers.sort(
            (a, b) => a.dateForSort - b.dateForSort
        );
        list.notSize.other = list.notSize.other.sort(
            (a, b) => a.dateForSort - b.dateForSort
        );

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

    async #getDataWall(domain, offset) {
        const res = await axios.post(
            'https://api.vk.com/method/wall.get',
            null,
            {
                headers: { Authorization: `Bearer ${TOKEN}` },
                params: {
                    domain: domain,
                    count: 50,
                    offset: offset * 50,
                    v: '5.236',
                },
            }
        );
        return res.data.response;
    }

    #checkDate(filter, date) {
        return date >= filter.startDate && date <= filter.endDate;
    }
}

module.exports = new ControllerHelper();
