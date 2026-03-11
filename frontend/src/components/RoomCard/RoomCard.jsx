import React, { useState } from 'react';
import styles from './RoomCard.module.css';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../../http';

const RoomCard = ({ room }) => {

    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleClick = () => {
        if (room.isPrivate) {
            setShowPasswordModal(true);
            setError('');
        } else {
            navigate(`/room/${room.id}`);
        }
    };

    const handleJoinPrivate = async () => {
        try {
            await joinRoom(room.id, { password });
            navigate(`/room/${room.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Incorrect password');
        }
    };

    return (
        <>
            <div onClick={handleClick} className={`${styles.card} ${room.isPrivate ? styles.privateCard : ''}`}>
                {room.isPrivate && <span className={styles.lockIcon}>🔒</span>}
                <h3 className={styles.topic}>{room.topic}</h3>
                <div className={`${styles.speakers} ${room.speakers.length === 1 ? styles.singleSpeaker : ''}`}>
                    <div className={styles.avatars}>
                        {room.speakers.map(speaker => (
                            <img
                                key={speaker.id}
                                src={speaker.avatar ? speaker.avatar : '/images/monkey-avatar.png'}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/monkey-avatar.png';
                                }}
                                alt="speaker-avatar"
                            />

                        ))}
                    </div>

                    <div className={styles.names}>
                        {room.speakers.map(speaker => (
                            <div key={speaker.id} className={styles.nameWrapper}>
                                <span>{speaker.name}</span>
                                <img src="/images/chat-bubble.png" alt="chat-bubble" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.peopleCount}>
                    <span>{room.totalPeople}</span>
                    <img src="/images/user-icon.png" alt="user-icon" />
                </div>
            </div>

            {/* Password Prompt Modal */}
            {showPasswordModal && (
                <div className={styles.passwordOverlay} onClick={() => setShowPasswordModal(false)}>
                    <div className={styles.passwordModal} onClick={e => e.stopPropagation()}>
                        <h3>🔒 Private Room</h3>
                        <p>Enter the password to join <strong>{room.topic}</strong></p>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Room password..."
                            className={styles.passwordInput}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinPrivate()}
                        />
                        {error && <p className={styles.passwordError}>{error}</p>}
                        <div className={styles.passwordActions}>
                            <button onClick={() => setShowPasswordModal(false)} className={styles.passwordCancelBtn}>Cancel</button>
                            <button onClick={handleJoinPrivate} className={styles.passwordJoinBtn}>Join</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default RoomCard;