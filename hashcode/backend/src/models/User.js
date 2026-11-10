import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    // Public, URL-friendly name used for profile pages: /u/jane-doe
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false = the password hash is never returned by queries unless we ask for it
    password: { type: String, required: true, minlength: 6, select: false },
    bio: { type: String, default: '', maxlength: 300 },
    avatar: { type: String, default: '' },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Before saving, hash the password if it was changed. We never store plain passwords.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare a plain password (from the login form) with the stored hash.
userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// When a user is converted to JSON (sent to the browser), remove private fields.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
