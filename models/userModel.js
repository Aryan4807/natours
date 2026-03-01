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
// 1) Query Middleware: Filter out inactive users
userSchema.pre(/^find/, function() {
  this.where({ active: { $ne: false } });
});

// 2) Password Changed At: Logic for reset password
userSchema.pre('save', async function() {
  // If password isn't modified or user is new, don't do anything
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangeAt = Date.now() - 1000;
});

// 3) Password Hashing: Secure the password
userSchema.pre('save', async function() {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return;

  // Hashing the password with cost of 12
  // Note: I switched to the ASYNC version (hash) instead of hashSync
  this.password = await brcypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
});
const User = mongoose.model('User', userSchema);
module.exports = User;
