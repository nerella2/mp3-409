module.exports = function (router) {

    var userRoute = router.route('/');
    var userRoute = router.route('/:id');


    userRoute.get(function (req, res) {
        var connectionString = process.env.TOKEN;
        res.json({ message: 'My connection string is ' + connectionString });
    });

    return router;
}
