const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true,  unique: true},
  role: { type: String, required: true },
  status: { type: String, required: true },
  owned_service_groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceGroup' }],
  password: { type: String, required: true }
});

UserSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 12);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
