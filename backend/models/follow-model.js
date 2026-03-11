const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followSchema = new Schema(
    {
        follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema, 'follows');
