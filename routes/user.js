const User = require('../models/user.js');
const Task = require('../models/tasks.js');

module.exports = function (router) {

    var userRoute = router.route('/users');
    var userIdRoute = router.route('/users/:id');


    userRoute.get(async function (req, res) {
        try{
            const where = req.query.where ? JSON.parse(req.query.where) : {};
            const sort = req.query.sort ? JSON.parse(req.query.sort) : {};
            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const skip = req.query.skip ? parseInt(req.query.skip) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit) : 0;
            const count = req.query.count === 'true';
            if (isNaN(skip) || isNaN(limit)) {
                throw Error('Non-Integer Passed to Integer Argument');
            }
            if(count){ const user=await User.countDocuments(where); return res.json({message:'OK',data:user}); }
            const user=await User.find(where).sort(sort).select(select).skip(skip).limit(limit);
            res.json({ message: 'OK', data:user});
        }
        catch(err){
            if(err.message==='Non-Integer Passed to Integer Argument' || err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });

    userRoute.post(async function (req, res) {
        try{
            const user={
            ...req.body,
            dateCreated:new Date()};
            
            const newUser= new User(user);
            const savedUser = await newUser.save();
            res.json({ message: 'OK', data:savedUser});
        }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError ||err.code==11000){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });

    userIdRoute.get(async function (req, res) {
        const select = req.query.select ? JSON.parse(req.query.select) : {};
        try{const user=await User.findOne({_id:req.params.id}).select(select);
        if(!user){ return res.status(404).json({message: 'ERROR:USER of ID:'+req.params.id+' NOT FOUND',data:{}});}
        res.json({ message: 'OK', data:user});
        }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });

    userIdRoute.put(async function (req, res) {
        try{
            const oldUser=await User.findById(req.params.id);
            if(!oldUser){ return res.status(404).json({message: 'ERROR:USER of ID:'+req.params.id+' NOT FOUND',data:{}});}
            const user=await User.findByIdAndUpdate(req.params.id,req.body,{new: true});
            await Task.updateMany({_id:{$in:oldUser.pendingTasks}},{assignedUser:"",assignedUserName:"unassigned"});
            await Task.updateMany({_id:{$in:user.pendingTasks}},{assignedUser:user._id,assignedUserName:user.name});
            res.json({ message: 'OK', data:user});
        }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError||err.code==11000){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });
    userIdRoute.delete(async function (req, res) {
            try{const user=await User.findByIdAndDelete(req.params.id);
            if(!user){ return res.status(404).json({message: 'ERROR:USER of ID:'+req.params.id+' NOT FOUND',data:{}});}
            await Task.updateMany({assignedUser:user._id},{assignedUser:"",assignedUserName:"unassigned"});
            res.json({ message: 'OK', data:user});
        }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });
    return router;
}
