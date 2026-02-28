const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const brcypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [40, 'Name must have less or equal then 40 characters'],
      minlength: [10, 'Name must have more or equal then 10 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      trim: true,
      // maxlength: [40, 'Password must have less or equal then 40 characters'],
      minlength: [10, 'Password must have more or equal then 10 characters'],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please provide a password'],
      //  this only works on CREATE and SAVE!!!
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: ' Passwords are not the same!'
      },
      trim: true
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    active: {
      type: Boolean,
      default: true,
      select: false
    }
  }
  // {
  //   versionKey: false // To disable the "__v" field
  // }
);

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await brcypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    return changeTimeStamp > JWTTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
userSchema.pre(/^find/, async function(next) {
  this.find({ active: { $ne: false } });
  next();
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;

  next();
});
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await brcypt.hashSync(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
const User = mongoose.model('User', userSchema);
module.exports = User;
