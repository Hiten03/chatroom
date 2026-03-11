import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './UserProfileModal.module.css';
import { getUserProfile, toggleFollow } from '../../http';

const UserProfileModal = ({ userId, currentUserId, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data } = await getUserProfile(userId);
            setProfile(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const handleToggleFollow = async () => {
        try {
            const { data } = await toggleFollow(userId);
            setProfile(prev => ({
                ...prev,
                isFollowing: data.isFollowing,
                followerCount: data.isFollowing
                    ? prev.followerCount + 1
                    : prev.followerCount - 1,
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const isSelf = currentUserId === userId;

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {loading ? (
                    <p className={styles.loading}>Loading profile...</p>
                ) : profile ? (
                    <>
                        <button onClick={onClose} className={styles.closeBtn}>✕</button>
                        <div className={styles.avatarWrap}>
                            <img
                                src={profile.avatar || '/images/monkey-avatar.png'}
                                onError={(e) => { e.target.onerror = null; e.target.src = '/images/monkey-avatar.png'; }}
                                alt="avatar"
                                className={styles.avatarImg}
                            />
                        </div>
                        <h2 className={styles.name}>{profile.name}</h2>
                        <p className={styles.joinDate}>
                            Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>

                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.statNum}>{profile.followerCount}</span>
                                <span className={styles.statLabel}>Followers</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.stat}>
                                <span className={styles.statNum}>{profile.followingCount}</span>
                                <span className={styles.statLabel}>Following</span>
                            </div>
                        </div>

                        {!isSelf && (
                            <button
                                onClick={handleToggleFollow}
                                className={`${styles.followBtn} ${profile.isFollowing ? styles.following : ''}`}
                            >
                                {profile.isFollowing ? '✓ Following' : 'Follow'}
                            </button>
                        )}
                    </>
                ) : (
                    <p className={styles.loading}>Could not load profile.</p>
                )}
            </div>
        </div>,
        document.body
    );
};

export default UserProfileModal;
