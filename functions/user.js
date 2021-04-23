const mongoose = require('mongoose');
const express = require('express');
const User = require('../schema/User')

const app = express();

app.post('/signup', async (req, res) => {
    const {name, email, password} = req.body;

    try{
        const user = new User({ name, email, password });
        await user.save();
        res.status(200).json({ message: "Success"});
    }
    catch(err){
        res.status(200).json({ message: "Error"});
    }
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({ email });

    if(!user)
        res.status(200).send({message:"No email found"});
    else{
        if(password === user.password)
            res.status(200).json({message: "Success"})
        else
            res.status(200).json({message: "Incorrect Password"});
    }
})

module.exports = app;
