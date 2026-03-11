const FollowModel = require('../models/follow-model');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');

class FollowController {
    async toggleFollow(req, res) {
        const { userId } = req.params;
        const followerId = req.user._id;

        if (followerId.toString() === userId) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        try {
            const existing = await FollowModel.findOne({
                follower: followerId,
                following: userId,
            });

            if (existing) {
                await FollowModel.deleteOne({ _id: existing._id });
                return res.json({ isFollowing: false, message: 'Unfollowed' });
            } else {
                await FollowModel.create({
                    follower: followerId,
                    following: userId,
                });
                return res.json({ isFollowing: true, message: 'Followed' });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getProfile(req, res) {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        try {
            const user = await userService.findUser({ _id: userId });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const followerCount = await FollowModel.countDocuments({ following: userId });
            const followingCount = await FollowModel.countDocuments({ follower: userId });

            const isFollowing = currentUserId.toString() !== userId
                ? !!(await FollowModel.findOne({ follower: currentUserId, following: userId }))
                : false;

            const userDto = new UserDto(user);

            return res.json({
                ...userDto,
                followerCount,
                followingCount,
                isFollowing,
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new FollowController();
