const mongo = require('mongodb');
const mongoose = require('mongoose');
const shortid = require('shortid')
mongoose.connect(process.env.MLAB_URI || 'mongodb://icomad:w9MBzF62@ds253243.mlab.com:53243/freecodecamp', { useMongoClient: true });
mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    maxlength: [12, 'username too long']
  },
  _id: {
    type: String,
    default: shortid.generate
  }
});
const User = mongoose.model('users', UserSchema);

const ExerciseSchema = mongoose.Schema({
  userId: {
    type: String,
    ref: 'users',
    index: true,
  },
  username: {
    type: String,
  },
  description: {
    type: String,
    required: true,
    maxlength: [30, 'description too long'],
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  }
});
ExerciseSchema.pre('save', function (next) {
  mongoose.model('users').findById(this.userId, (err, user) => {
    if (err) return next(err);
    if (!user) {
      const err = new Error('userId not found');
      return next(err);
    }
    this.username = user.username;
    if (!this.date) {
      this.date = Date.now();
    }
    next();
  })
})
const Exercise = mongoose.model('exercises', ExerciseSchema);

exports.retrieveUsers = async () => {
  try {
    const users = await User.find({});
    if (!users.length) return Promise.reject('There are no users');
    return Promise.resolve(users);
  } catch (error) {
    return Promise.reject(error);
  }
}

exports.addUser = async (username) => {
  try {
    const user = new User({
      username,
    });
    const newUser = await user.save();
    return Promise.resolve(newUser);
  } catch (error) {
    return Promise.reject(error);
  }
}

exports.retrieveEx = async (query) => {
  const from = new Date(query.from);
  const to = new Date(query.to);
  try {
    const user = await User.findById(query.userId);
    if (!user) return Promise.reject('userId not found');
    const exercises = await Exercise.find(
      {
        userId: query.userId,
        date: {
          $lt: to != 'Invalid Date' ? to.getTime() : Date.now(),
          $gt: from != 'Invalid Date' ? from.getTime() : 0
        }
      }, { __v: 0, _id: 0 })
      .sort('-date')
      .limit(parseInt(query.limit))
      .exec();
    const json = {
      _id: query.userId,
      username: user.username,
      from: from != 'Invalid Date' ? from.toDateString() : undefined,
      to: to != 'Invalid Date' ? to.toDateString() : undefined,
      count: exercises.length,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString()
      })
      )
    }
    return Promise.resolve(json);

  } catch (error) {
    return Promise.reject(error);
  }
}

exports.addEx = async (body) => {
  try {
    const user = await User.findById(body.userId);
    if (!user) return Promise.reject('userId not found');
    const exercise = new Exercise(body);
    exercise.username = user.username;
    return new Promise((resolve, reject) => {
      exercise.save((err, newEx) => {
        if (err) return reject(err);
        newEx = newEx.toObject();
        newEx._id = newEx.userId;
        newEx.date = (new Date(newEx.date)).toDateString();
        delete newEx.userId;
        delete newEx.__v;
        return resolve(newEx);
      })
    })
  } catch (error) {
    return Promise.reject(error);
  }
}