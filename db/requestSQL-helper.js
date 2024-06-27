const dbRequest = require('./index');

class RequestSQLHelper {
    async getListGoods() {
        try {
            const { rows } = await dbRequest(
                `SELECT * FROM list_sandals;`
            );

            return rows;
        } catch {
            return null;
        }
    }

    async getGroupByDomain(domain) {
        try {
            const { rows } = await dbRequest(
                `SELECT * FROM list_sandals WHERE domain = $1`,
                [domain]
            );

            return rows.length !== 0 ? rows : null;
        } catch {
            return null;
        }
    }

    async getGroupByID(id) {
        try {
            const { rows } = await dbRequest(
                `SELECT * FROM list_sandals WHERE from_id = $1`,
                [id]
            );

            return rows.length !== 0 ? rows : null;
        } catch {
            return null;
        }
    }

    async addNewGroup(id, domain, url, name) {
        try {
            const { rows } = await dbRequest(
                `INSERT INTO list_sandals (from_id, domain, url, name) VALUES ($1, $2, $3, $4)`,
                [id, domain, url, name]
            );

            return rows.length !== 0 ? rows : null;
        } catch {
            return null;
        }
    }

    async removeGroupByURL(url) {
        try {
            const { rows } = await dbRequest(
                `DELETE FROM list_sandals WHERE url = $1`,
                [url]
            );

            return rows.length !== 0 ? rows : null;
        } catch {
            return null;
        }
    }

    async changeErrorRequest(domain) {
        try {
            const { rows } = await dbRequest(
                `UPDATE list_sandals SET error_req = TRUE WHERE domain = $1;`,
                [domain]
            );

            return rows.length !== 0 ? rows : null;
        } catch {
            return null;
        }
    }
}

module.exports = new RequestSQLHelper();
