const { Pool } = require('pg');

const connectionString =
    'postgres://hydjtxzg:5L6Lam7IjQ4aLrsG_QuIUcMwzRXYpRKc@balarama.db.elephantsql.com/hydjtxzg';

const pool = new Pool({ connectionString });

module.exports = (text, params) => pool.query(text, params);
