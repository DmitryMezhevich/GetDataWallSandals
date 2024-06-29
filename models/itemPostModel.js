const moment = require('moment');

module.exports = class ItemPostModule {
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
        this.views = module.views === undefined ? 0 : module.views.count;
        this.text = module.text;
        // this.text = module.text.slice(0, 250);

        if (module.attachments) {
            const attachments = module.attachments;

            const sizeArray = ['z', 'y', 'x', 'm', 's'];

            outerLoop: for (const size of sizeArray) {
                for (const attachment of attachments) {
                    if (attachment.type === 'photo') {
                        innerLoop: for (const item of attachment.photo.sizes) {
                            if (item.type === size) {
                                this.urlImg = item.url;
                                break outerLoop;
                            }
                        }
                    } else if (attachment.type === 'video') {
                        const preview =
                            attachment.video.image[
                                attachment.video.image.length - 1
                            ].url;
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
