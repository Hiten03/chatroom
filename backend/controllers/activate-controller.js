const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');

class ActivateController {
    async activate(req, res) {
        // Activation logic
        const { name, avatar } = req.body;
        if (!name || !avatar) {
            return res.status(400).json({ message: 'All fields are required!' });
        }

        let finalImagePath;

        if (avatar.startsWith('/images/')) {
            finalImagePath = avatar;
        } else {
            // Just store the Base64 image directly in the database to avoid Render file system crashes
            finalImagePath = avatar;
        }

        const userId = req.user._id;
        // Update user
        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found!' });
            }
            user.activated = true;
            user.name = name;
            user.avatar = finalImagePath;
            await user.save();
            res.json({ user: new UserDto(user), auth: true });
        } catch (err) {
            res.status(500).json({ message: 'Something went wrong!' });
        }
    }

    async updateProfile(req, res) {
        const { avatar } = req.body;
        if (!avatar) {
            return res.status(400).json({ message: 'Avatar is required!' });
        }

        let finalImagePath;

        if (avatar.startsWith('/images/')) {
            finalImagePath = avatar;
        } else {
            // Store the Base64 image directly in the database
            finalImagePath = avatar;
        }

        const userId = req.user._id;
        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found!' });
            }
            user.avatar = finalImagePath;
            await user.save();
            res.json({ user: new UserDto(user), auth: true });
        } catch (err) {
            res.status(500).json({ message: 'Something went wrong!' });
        }
    }
}

module.exports = new ActivateController();