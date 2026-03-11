import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { logout, updateProfile } from '../../../http';
import styles from './Navigation.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth } from '../../../store/authSlice';
import { useTheme } from '../../../context/ThemeContext';

const Navigation = () => {
    const brandStyle = {
        color: '#fff',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
    };
    const dispatch = useDispatch();
    const { isAuth, user } = useSelector((state) => state.auth);
    const [showProfile, setShowProfile] = useState(false);
    const [newAvatar, setNewAvatar] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState(null);
    const [uploading, setUploading] = useState(false);

    async function logoutUser() {
        try {
            const { data } = await logout();
            dispatch(setAuth(data));
        } catch (err) {
            console.log(err);
        }
    }

    function handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            setNewAvatar(reader.result);
            setPreviewAvatar(reader.result);
        };
    }

    async function handleSaveAvatar() {
        if (!newAvatar) return;
        setUploading(true);
        try {
            const { data } = await updateProfile({ avatar: newAvatar });
            dispatch(setAuth(data));
            setShowProfile(false);
            setNewAvatar(null);
            setPreviewAvatar(null);
        } catch (err) {
            console.error(err);
            alert('Failed to update profile photo.');
        } finally {
            setUploading(false);
        }
    }

    const { theme, toggleTheme } = useTheme();

    return (
        <div className={styles.navbarWrapper}>
            <nav className={`${styles.navbar} container`}>
                <Link style={brandStyle} to="/">
                    <img src="/images/logo.png" alt="logo" width="42" height="42" />
                    <span className={styles.logoText}>ChatRoom</span>
                </Link>

                <div className={styles.navRight}>
                    {/* Theme toggle - always visible */}
                    <button onClick={toggleTheme} className={styles.themeToggle} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {isAuth && (
                        <>
                            <h3>{user?.name}</h3>
                            <div className={styles.avatarClickable} onClick={() => setShowProfile(true)}>
                                <img
                                    className={styles.avatar}
                                    src={
                                        user.avatar
                                            ? user.avatar
                                            : '/images/monkey-avatar.png'
                                    }
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/images/monkey-avatar.png';
                                    }}
                                    width="40"
                                    height="40"
                                    alt="avatar"
                                />
                                <span className={styles.editBadge}>✏️</span>
                            </div>
                            <button
                                className={styles.logoutButton}
                                onClick={logoutUser}
                            >
                                <img src="/images/logout.png" alt="logout" />
                                <span>Logout</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Profile Edit Modal - rendered via portal to avoid sticky navbar clipping */}
            {showProfile && ReactDOM.createPortal(
                <div className={styles.profileOverlay} onClick={() => setShowProfile(false)}>
                    <div className={styles.profileModal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.profileTitle}>Edit Profile Photo</h3>
                        <div className={styles.profileAvatarWrap}>
                            <img
                                src={previewAvatar || user.avatar || '/images/monkey-avatar.png'}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/monkey-avatar.png';
                                }}
                                alt="profile-avatar"
                                className={styles.profileAvatarImg}
                            />
                        </div>
                        <div className={styles.profileUploadArea}>
                            <input
                                type="file"
                                id="profileAvatarInput"
                                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                                onChange={handleAvatarChange}
                                className={styles.profileFileInput}
                            />
                            <label htmlFor="profileAvatarInput" className={styles.profileUploadLabel}>
                                📷 Choose a new photo
                            </label>
                        </div>
                        <div className={styles.profileActions}>
                            <button onClick={() => { setShowProfile(false); setNewAvatar(null); setPreviewAvatar(null); }} className={styles.profileCancelBtn}>Cancel</button>
                            <button
                                onClick={handleSaveAvatar}
                                className={styles.profileSaveBtn}
                                disabled={!newAvatar || uploading}
                            >
                                {uploading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Navigation;