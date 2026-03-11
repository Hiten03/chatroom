const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        phone: { type: String, required: true },
        name: { type: String, required: false },
        avatar: {
            type: String,
            required: false,
            default: '/images/monkey-avatar.png',
            get: (avatar) => {
                if (avatar) {
                    // Don't prepend BASE_URL for public image paths
                    if (avatar.startsWith('/images/')) {
                        return avatar;
                    }
                    return `${process.env.BASE_URL}${avatar}`;
                }
                return '/images/monkey-avatar.png';
            },
        },
        activated: { type: Boolean, required: false, default: false },
    },
    {
        timestamps: true,
        toJSON: { getters: true},
    }
);

module.exports = mongoose.model('User', userSchema, 'users');