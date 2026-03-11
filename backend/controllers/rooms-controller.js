const RoomDto = require('../dtos/room.dto');
const roomService = require("../services/room-service");
const crypto = require('crypto');

class RoomsController {
    async create(req, res) {
        const { topic, roomType, password } = req.body;

        if (!topic || !roomType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const roomData = {
            topic,
            roomType,
            ownerId: req.user._id
        };

        // Hash password for private rooms
        if (roomType === 'private' && password) {
            roomData.password = crypto.createHash('sha256').update(password).digest('hex');
        }

        const room = await roomService.create(roomData);

        return res.json(new RoomDto(room));
    }


    async index(req, res) {
        const rooms = await roomService.getAllRooms(['open', 'social', 'private']);
        const allRooms = rooms.map(room => {
            const dto = new RoomDto(room);
            dto.isPrivate = room.roomType === 'private';
            return dto;
        });
        return res.json(allRooms);
    }

    async show(req, res) {
        const room = await roomService.getRoom(req.params.roomId);
        return res.json(room);
    }

    async join(req, res) {
        const { roomId } = req.params;
        const { password } = req.body;

        try {
            const room = await roomService.getRoom(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }

            if (room.roomType !== 'private') {
                return res.json({ success: true });
            }

            // Owner doesn't need a password
            if (room.ownerId.toString() === req.user._id.toString()) {
                return res.json({ success: true });
            }

            if (!password) {
                return res.status(401).json({ message: 'Password required for this room' });
            }

            const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
            if (hashedInput !== room.password) {
                return res.status(401).json({ message: 'Incorrect password' });
            }

            return res.json({ success: true });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async delete(req, res) {
        const { roomId } = req.params;
        try {
            const room = await roomService.getRoom(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }

            if (room.ownerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Only the room owner can delete this room' });
            }

            await roomService.deleteRoom(roomId);
            return res.json({ message: 'Room deleted successfully' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new RoomsController();