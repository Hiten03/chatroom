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

        // Check if the avatar is already a valid path (e.g., our default monkey avatar)
        if (avatar.startsWith('/images/')) {
            finalImagePath = avatar;
        } else {
            // Image Base64 processing
            const buffer = Buffer.from(
                avatar.replace(/^data:image\/\w+;base64,/, ''),
                'base64'
            );
            const imagePath = `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}.png`;

            try {
                // 1. Ensure the 'storage' folder actually exists!
                const storagePath = path.resolve(__dirname, '../storage');
                if (!fs.existsSync(storagePath)) {
                    fs.mkdirSync(storagePath, { recursive: true });
                }

                // 2. Read, resize, and save the image
                const jimResp = await Jimp.read(buffer);
                jimResp.resize({ w: 150 });
                await jimResp.write(path.resolve(storagePath, imagePath));

                finalImagePath = `/storage/${imagePath}`;
            } catch (err) {
                console.error(err);
                // 3. IMPORTANT: return here so it doesn't save a broken URL to the DB
                return res.status(500).json({ message: 'Could not process the image' });
            }
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
            const buffer = Buffer.from(
                avatar.replace(/^data:image\/\w+;base64,/, ''),
                'base64'
            );
            const imagePath = `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}.png`;

            try {
                const storagePath = path.resolve(__dirname, '../storage');
                if (!fs.existsSync(storagePath)) {
                    fs.mkdirSync(storagePath, { recursive: true });
                }

                const jimResp = await Jimp.read(buffer);
                jimResp.resize({ w: 150 });
                await jimResp.write(path.resolve(storagePath, imagePath));

                finalImagePath = `/storage/${imagePath}`;
            } catch (err) {
                console.error(err);
                return res.status(500).json({ message: 'Could not process the image' });
            }
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