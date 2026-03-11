import React, { useState, useEffect, useRef } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import styles from './Room.module.css';
import { getRoom, deleteRoom } from "../../http";
import UserProfileModal from "../../components/UserProfileModal/UserProfileModal";

const Room = () => {
    const { id: roomId } = useParams();
    const user = useSelector((state) => state.auth.user);

    const {
        clients, provideRef, handleMute,
        kickUser, makeSpeaker, makeListener, removeRoom,
        raiseHand, lowerHand,
        messages, sendMessage,
        reactions, sendReaction, setReactions
    } = useWebRTC(roomId, user);

    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [isMute, setMute] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatText, setChatText] = useState('');
    const chatEndRef = useRef(null);
    const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

    useEffect(() => {
        handleMute(isMute, user.id);
    }, [isMute]);

    // Auto-scroll chat to bottom when new messages arrive
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Auto-remove floating reactions after 3 seconds
    useEffect(() => {
        if (reactions.length > 0) {
            const timer = setTimeout(() => {
                setReactions((prev) => prev.slice(1));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [reactions]);

    const handleManualLeave = () => {
        navigate('/rooms');
    }

    const handleDeleteRoom = async () => {
        try {
            await deleteRoom(roomId);
            removeRoom();
            navigate('/rooms');
        } catch (error) {
            console.error('Error deleting room:', error);
            alert("Failed to delete room.");
        }
    }

    useEffect(() => {
        const fetchRoom = async () => {
            const { data } = await getRoom(roomId);
            setRoom((prev) => data);
        };
        fetchRoom();
    }, [roomId]);

    const handleMuteClick = (clientId) => {
        if (clientId !== user.id) return;

        const isOwner = user.id === room?.ownerId;
        const isOriginalSpeaker = room?.speakers?.includes(user.id);
        const myClient = clients.find(c => c.id === user.id);
        const isPromotedSpeaker = myClient?.role === 'speaker';

        if (!isOwner && !isOriginalSpeaker && !isPromotedSpeaker) {
            alert("You are a listener. The room owner must make you a speaker before you can unmute.");
            return;
        }

        setMute((isMute) => !isMute);
    }

    const myClient = clients.find(c => c.id === user.id);
    const isHandRaised = myClient?.handRaised;

    const handleHandRaise = () => {
        if (isHandRaised) {
            lowerHand();
        } else {
            raiseHand();
        }
    };

    const handleSendChat = (e) => {
        e.preventDefault();
        if (!chatText.trim()) return;
        sendMessage(chatText.trim());
        setChatText('');
    };

    return (
        <div>

            <div className="containier">
                <button onClick={handleManualLeave} className={styles.goBack}>
                    <img src="/images/arrow-left.png" alt="arrow-left" />
                    <span>All voice rooms</span>
                </button>
            </div>

            <div className={styles.clientsWrap}>
                <div className={styles.header}>
                    <h2 className={styles.topic}>{room?.topic}</h2>
                    <div className={styles.actions}>
                        {/* Reaction Button */}
                        <div className={styles.reactionWrapper}>
                            <button
                                onClick={() => sendReaction('❤️')}
                                className={styles.actionBtn}
                                title="Send ❤️"
                            >
                                <span>❤️</span>
                            </button>
                            <button
                                onClick={() => sendReaction('🔥')}
                                className={styles.actionBtn}
                                title="Send 🔥"
                            >
                                <span>🔥</span>
                            </button>
                            <button
                                onClick={() => sendReaction('😂')}
                                className={styles.actionBtn}
                                title="Send 😂"
                            >
                                <span>😂</span>
                            </button>
                            <button
                                onClick={() => sendReaction('👏')}
                                className={styles.actionBtn}
                                title="Send 👏"
                            >
                                <span>👏</span>
                            </button>
                        </div>
                        <button
                            onClick={handleHandRaise}
                            className={`${styles.actionBtn} ${isHandRaised ? styles.handRaisedBtn : ''}`}
                        >
                            <img src="/images/palm.png" alt="palm-icon" />
                            {isHandRaised && <span>Lower</span>}
                        </button>
                        <button
                            onClick={() => setChatOpen(!chatOpen)}
                            className={`${styles.actionBtn} ${styles.chatToggle} ${chatOpen ? styles.chatToggleActive : ''}`}
                        >
                            <span>💬</span>
                            <span>Chat</span>
                        </button>
                        <button onClick={handleManualLeave} className={styles.actionBtn}>
                            <img src="/images/win.png" alt="win-icon" />
                            <span>Leave quietly</span>
                        </button>
                        {user.id === room?.ownerId && (
                            <button onClick={handleDeleteRoom} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                <span style={{ marginLeft: 0 }}>Delete Room</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.roomBody}>
                    {/* Floating Reactions overlay */}
                    <div className={styles.floatingReactionsArea}>
                        {reactions.map((reaction) => (
                            <div key={reaction.id} className={styles.floatingEmoji}>
                                <span className={styles.emoji}>{reaction.emoji}</span>
                                <span className={styles.emojiSender}>{reaction.user.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.clientList}>
                        {clients.map((client) => {
                            return (
                                <div className={styles.client} key={client.id}>
                                    <div className={`${styles.userHead} ${client.isSpeaking ? styles.speaking : ''} ${client.handRaised ? styles.handRaised : ''}`}>
                                        <audio
                                            ref={(instance) => provideRef(instance, client.id)}
                                            autoPlay
                                        ></audio>
                                        <img
                                            className={styles.userAvatar}
                                            src={client.avatar ? client.avatar : '/images/monkey-avatar.png'}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/images/monkey-avatar.png';
                                            }}
                                            alt="avatar"
                                            onClick={() => setSelectedProfileUserId(client.id)}
                                            style={{ cursor: 'pointer' }}
                                        />

                                        {client.handRaised && (
                                            <span className={styles.handBadge}>🖐️</span>
                                        )}

                                        <button onClick={() => handleMuteClick(client.id)} className={styles.micBtn}>
                                            {
                                                client.muted ? (
                                                    <img src="/images/mic-mute.png" alt="mute-icon" />
                                                ) : (<img src="/images/mic.png" alt="mic-icon" />)
                                            }
                                        </button>

                                        {/* Creator Moderation Actions */}
                                        {user.id === room?.ownerId && client.id !== user.id && (
                                            <div className={styles.moderationActions}>
                                                <button onClick={() => kickUser(client.id)} className={styles.modKBtn}>Kick</button>

                                                {client.role === 'speaker' || room?.speakers?.includes(client.id) ? (
                                                    <button onClick={() => makeListener(client.id)} className={styles.modBtn}>Make Listener</button>
                                                ) : (
                                                    <button onClick={() => makeSpeaker(client.id)} className={styles.modBtn}>Make Speaker</button>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                    <h4 className={styles.clientName} onClick={() => setSelectedProfileUserId(client.id)} style={{ cursor: 'pointer' }}>
                                        {client.name}
                                        {client.id === room?.ownerId && <span className={styles.roleBadge} title="Owner">👑</span>}
                                        {client.id !== room?.ownerId && (client.role === 'speaker' || room?.speakers?.includes(client.id)) && <span className={styles.roleBadge} title="Speaker">🎙️</span>}
                                        {client.id !== room?.ownerId && client.role !== 'speaker' && !room?.speakers?.includes(client.id) && <span className={styles.roleBadge} title="Listener">🎧</span>}
                                    </h4>
                                </div>
                            );
                        })}
                    </div>

                    {/* Chat Panel */}
                    {chatOpen && (
                        <div className={styles.chatPanel}>
                            <div className={styles.chatHeader}>
                                <h3>Room Chat</h3>
                                <button onClick={() => setChatOpen(false)} className={styles.chatCloseBtn}>✕</button>
                            </div>
                            <div className={styles.chatMessages}>
                                {messages.length === 0 && (
                                    <p className={styles.chatEmpty}>No messages yet. Start the conversation!</p>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`${styles.chatMessage} ${msg.user.id === user.id ? styles.chatMessageSelf : ''}`}>
                                        <div className={styles.chatMsgHeader}>
                                            <img
                                                src={msg.user.avatar || '/images/monkey-avatar.png'}
                                                alt=""
                                                className={styles.chatAvatar}
                                            />
                                            <span className={styles.chatSender}>{msg.user.name}</span>
                                            <span className={styles.chatTime}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={styles.chatText}>{msg.text}</p>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={handleSendChat} className={styles.chatInputWrap}>
                                <input
                                    type="text"
                                    value={chatText}
                                    onChange={(e) => setChatText(e.target.value)}
                                    placeholder="Type a message..."
                                    className={styles.chatInput}
                                />
                                <button type="submit" className={styles.chatSendBtn}>Send</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* User Profile Modal */}
            {selectedProfileUserId && (
                <UserProfileModal
                    userId={selectedProfileUserId}
                    currentUserId={user.id}
                    onClose={() => setSelectedProfileUserId(null)}
                />
            )}
        </div>
    );
};

export default Room;