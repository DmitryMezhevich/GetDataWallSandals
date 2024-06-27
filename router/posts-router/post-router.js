const Router = require('express').Router;

const postController = require('../../controllers/post-controller');

const router = new Router();

router.post('/get', postController.get);
router.post('/addNewGroup', postController.addNewGroup);
router.post('/checkGroup', postController.checkGroup);
router.post('/addNewGroup', postController.addNewGroup);
router.post('/removeGroupByURL', postController.removeGroupByURL);

module.exports = router;
