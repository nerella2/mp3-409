const User = require('../models/user.js');

module.exports = function (router) {

    var userRoute = router.route('/');
    var userIdRoute = router.route('/:id');


    userRoute.get(async function (req, res) {
        var connectionString = process.env.TOKEN;
        const user=await User.find();
        res.json({ message: 'My connection string is ' + connectionString, data:user});
    });

    return router;
}
