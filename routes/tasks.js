const User = require('../models/user.js');
const Task = require('../models/tasks.js');

module.exports = function (router) {

    var taskRoute = router.route('/tasks');
    var taskIdRoute = router.route('/tasks/:id');


    taskRoute.get(async function (req, res) {
        try{
            const where = req.query.where ? JSON.parse(req.query.where) : {};
            const sort = req.query.sort ? JSON.parse(req.query.sort) : {};
            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const skip = req.query.skip ? parseInt(req.query.skip) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit) : 0;
            const count = req.query.count === 'true';
            console.log(where);
            console.log(count);
            if (isNaN(skip) || isNaN(limit)) {
                throw Error('Non-Integer Passed to Integer Argument');
            }
            if(count){ const task=await Task.countDocuments(where); return res.json({message:'OK',data:task}); }
            const task=await Task.find(where).sort(sort).select(select).skip(skip).limit(limit);
            res.json({ message: 'OK', data:task});
        }
        catch(err){
            if(err.message==='Non-Integer Passed to Integer Argument' || err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});

        }
    });

    taskRoute.post(async function (req, res) {
        try{
            const task={...req.body,dateCreated:new Date()};
            const newTask= new Task(task);
            const savedTask = await newTask.save();
            res.json({ message: 'OK', data:savedTask});
    }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });

    taskIdRoute.get(async function (req, res) {
        try{
            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const task=await Task.findOne({_id:req.params.id}).select(select);
            if(!task){ return res.status(404).json({message: 'ERROR:TASK of ID:'+req.params.id+' NOT FOUND',data:{}});}
            res.json({ message: 'OK', data:task});
        }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });

    taskIdRoute.put(async function (req, res) {
        try{
            const oldTask=await Task.findById(req.params.id);
            if(!oldTask){ return res.status(404).json({message: 'ERROR:TASK of ID:'+req.params.id+' NOT FOUND',data:{}});}
            const task=await Task.findByIdAndUpdate(req.params.id,req.body,{new:true});
            if(oldTask.assignedUser){
                await User.updateOne({_id:oldTask.assignedUser},{$pull:{pendingTasks:req.params.id}});
            }
            if(task.assignedUser){
                await User.updateOne({_id:task.assignedUser},{$addToSet:{pendingTasks:req.params.id}});
            }
            res.json({ message: 'OK', data:task});
        }
        catch(err){
            if(err.name==='CastError' || err.name==='ValidationError'||err instanceof SyntaxError){
                return res.status(400).json({message:"REQUEST ERROR",data:err});
            }
            res.status(500).json({message:"SERVER ERROR",data:err});
        }
    });
    taskIdRoute.delete(async function (req, res) {
        try{const task=await Task.findByIdAndDelete(req.params.id);
        if(!task){ return res.status(404).json({message: 'ERROR:TASK of ID:'+req.params.id+' NOT FOUND',data:{}});}
        if(task.assignedUser){
            await User.updateOne({_id:task.assignedUser},{$pull:{pendingTasks:req.params.id}});
        }
        res.json({ message: 'OK', data:task});
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
