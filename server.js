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
const schema = new Schema({username: String, logs: [Object] });
const User = mongoose.model('User', schema);

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

//To Add exercises 

const validate = (obj) => { 
  if(!obj.description) { 
  return { validation: false, item: "description", value: obj.description };
  } else if (!obj.duration || parseInt(obj.duration) != obj.duration) {
    return { validation: false, item: "Number", value: obj.duration }
  } else if(typeof Date.parser(obj.date) != Number) { 
    return { validation: false, error: `Cast Number failed for value "${obj}"`
  }
   }else {
    return { validation: true }; 
    }
  }
app.post('/api/users/:id?/exercises', jsonParser, (req,res) => { 
  console.log(req.params);
  console.log(req.body);
  User.findById(req.params.id, (err, found) => { 
    if(!found) { 
      res.send(`Cast to ObjectId failed for value "${req.params.id}" at path
      "_id" for model "Users"`);
    } else {
      Object.keys(req.body).map(i => { 
        if(req.body.i == "") { 
          return res.send(`Path ${i} is required.`)
        }
      })
      const validObj = validate(req.body);
      if(!validObj.validation) { 
        res.send(`Cast to "${validObj.item}" failed for value "${validObj.value}"`)
      } else { 
        User.save({logs: [{date: req.body.date, duration: req.body.duration,
          description: req.body.description}]});
          return res.json({
            _id: found.id,
            username: found.username,
            date: req.body.date,
            duration: req.body.duration,
            description:req.body.description})
      }
    }
  })
})

//-------   

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
