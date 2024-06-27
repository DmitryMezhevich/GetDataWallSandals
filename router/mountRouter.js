const postRouter = require('./posts-router/post-router');

module.exports = (app) => {
    app.use('/wall-api', postRouter);
};
