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
const jsonParser = bodyParser.urlencoded({extended: false});

// Functions:
const dateEmpty = (d) => { 
  if(!d) {
    return new Date();
  } else {
    return new Date(d); 
    } 
};

//---------------------
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
const schema = new Schema({username: {type: String, unique: true}});
const User = mongoose.model('User', schema);

// Creating a Model Exercise for User 
const eSchema = new Schema({
  username: {
    type: String, 
  },  
  description: {
    type: String,
    required: true
  },
  
  duration: {
    type: Number,
    min: 0,
    required: true
  },
  
  date: {
    type: Date,
    required: true
  }
})
const Exercise = mongoose.model('Exercise', eSchema)

// Aplication:
// For New User
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
// To list all the Users
app.get("/api/users", (req,res) => { 
  User.find((err,found) => { 
    res.json(found)
  })
})
//To Add exercises 

app.post('/api/users/:id?/exercises', jsonParser, (req,res) => { 
  const body = req.body;
  console.log(req.body);
  User.findById(req.params.id, (err, found) => { 
    if(!found) { 
      res.send(`Cast to ObjectId failed for value "${req.params.id}" at path
      "_id" for model "Users"`);
    } else {
// validate the fields...
      const newExercise = new Exercise({ 
        username: found.username,
        description: body.description,
        duration: body.duration,
        date: dateEmpty(body.date)
      })
      newExercise.save((err,saved) => {
        if(err) { 
         console.log(err);
        return res.json(err.message)
        } else {
        let formatedDate = saved.date.toDateString();
        res.json({ 
          _id: found.id,
          username: found.username,
          date: formatedDate, 
          duration: saved.duration,
          description: saved.description
        })
      }      
    })
  }      
})
})
//-------   
// Creating the Log of an User
app.get('/api/users/:id?/logs',  (req,res) => { 
  const {from, to, limit} = req.query
  console.log(req.query)
  User.findById(req.params.id, (err,found) => { 
    if(err) return res.send('User not found')
    Exercise.find({username: found.username}, 
      {date: {
        $gte: new Date(from),
        $lte: new Date(to),  
      }})
      .select(['description', 'date', 'duration', '-_id'])
      .limit(+limit)
      .exec((err, data) => { 
        if(err) return res.json(err);
      let size = data.length;
        res.json({ 
        username: found.username,
        _id: found.id,
        count: size,
        log: data
      })
    }) 
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
