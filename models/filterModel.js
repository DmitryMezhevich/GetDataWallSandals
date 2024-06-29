const moment = require('moment');

module.exports = class FilterModel {
    deep;
    noLessReposts;
    noMoreReposts;
    startDate;
    endDate;
    minDate;

    constructor(module) {
        this.deep = module.deep.length === 0 ? 10 : parseInt(module.deep);
        this.noLessReposts =
            module.noLessReposts.length === 0
                ? 0
                : parseInt(module.noLessReposts);
        this.noMoreReposts =
            module.noMoreReposts.length === 0
                ? Number.MAX_VALUE
                : parseInt(module.noMoreReposts);
        this.startDate =
            module.startDate.length === 0
                ? moment(0).unix()
                : moment(module.startDate, 'DD-MM-YYYY').unix();
        this.endDate =
            module.endDate.length === 0
                ? moment().unix()
                : moment(module.endDate, 'DD-MM-YYYY').unix();
        this.minDate = 1704067200;

        if (this.startDate === this.endDate) {
            const dayPlus = moment.unix(this.endDate);
            dayPlus.add(1, 'day');
            this.endDate = dayPlus.unix();
        }
    }
};
