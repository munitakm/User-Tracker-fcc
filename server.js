const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
var jsonParser = bodyParser.urlencoded({extended: false});


// Conecting to MongoDB
mongoose.connect(process.env.MONGO_DB, 
{useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("we're connected...");
});

// Creating a Model for User
const { Schema } = require('mongoose');
const schema = new Schema({username: String, data: Date, duration: Number,
description: String});
const User = mongoose.model('User', schema);

// Aplication:
app.post("/api/users", jsonParser, (req,res) => { 
  const user = req.body.username;
  console.log(req.body.username);
  User.findOne({username: user}, (err, data) => { 
    if(!data) { 
      const userSaved = new User({username: user});
      userSaved.save((err, saved) => { 
        res.json({username: saved.username, _id: saved.id});
      })
    } else { 
      res.send('Username alredy taken')
    }  
  }) 
})
//-------   

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
