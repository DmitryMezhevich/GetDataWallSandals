const moment = require('moment');

module.exports = class FilterModel {
    noLessReposts;
    noMoreReposts;
    startDate;
    endDate;
    minDate = 1704067200;

    constructor(module) {
        this.noLessReposts =
            module.noLessReposts.length === 0
                ? 0
                : parseInt(module.noLessReposts);
        this.noMoreReposts =
            module.noMoreReposts.length === 0
                ? Number.MAX_VALUE
                : parseInt(module.noMoreReposts);
        this.startDate =
            module.startDate.length === 0 ? moment(0).unix() : module.startDate;
        this.endDate =
            module.endDate.length === 0 ? moment().unix() : module.endDate;

        if (this.startDate === this.endDate) {
            const dayPlus = moment.unix(this.endDate);
            dayPlus.add(1, 'day');
            this.endDate = dayPlus.unix();
        }
    }
};
