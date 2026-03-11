// // import { Provider } from "react-redux";
// // import { useStateWithCallback } from "./useStateWithCallback";
// // import { useCallback, useEffect, useRef } from "react";


// // export const useWebRTC = (roomId, user) => {
// //     const [clients, setClients] = useStateWithCallback([]);
// //     const audioElements = useRef({});
// //     const connections = useRef({});
// //     const localMediaStream = useRef(null);


// //     const addNewClients = useCallback(
// //         (newClient, cb) => {
// //             const lookingFor = clients.find((client) => client.id === newClient.id);

// //             if (lookingFor === undefined){
// //                 setClients((existingClients) => [...existingClients, newClient], cb);
// //             }

// //         },
// //         [clients, setClients],
// //     )

// //     //capture media from computer

// //     useEffect(() => {
// //         const startCapture = async() => {
// //             localMediaStream.current = await navigator.mediaDevices.getUserMedia({
// //                 audio: true
// //             });
// //         };

// //         startCapture().then(() => {
// //             addNewClients(user, () => {
// //                 const localElement = audioElements.current[user.id];
// //                 if(localElement){
// //                     // localElement.volume = 0;
// //                     localElement.srcObject = localMediaStream.current;
// //                 }
// //             })
// //         })
// //     }, []);


// //     const provideRef = (instance, userId) => {
// //         audioElements.current[userId] = instance;
// //     };

// //     return { clients, provideRef };
// // }


// import { useStateWithCallback } from "./useStateWithCallback";
// import { useCallback, useEffect, useRef } from "react";
// import { socketInit } from '../socket';
// import { ACTIONS } from "../actions";
// // import { connection } from "mongoose";
// import freeice from 'freeice';
// // import { off } from "process";

// export const useWebRTC = (roomId, user) => {

//     const [clients, setClients] = useStateWithCallback([]);
//     const audioElements = useRef({});
//     const connections = useRef({});
//     const localMediaStream = useRef(null);
//     const socket = useRef(null);
//     useEffect(() => {
//         socket.current = socketInit();
//     },[])

//     const captureStarted = useRef(false);

//     const addNewClient = useCallback(
//         (newClient, cb) => {

//             const lookingFor = clients.find(
//                 (client) => client.id === newClient.id
//             );

//             if (lookingFor === undefined) {
//                 setClients((existingClients) => [...existingClients, newClient], cb);
//             }

//         },
//         [clients, setClients]
//     );

//     // Capture microphone

//     useEffect(() => {
//         if (captureStarted.current) return;
//         captureStarted.current = true;

//         const startCapture = async () => {
//             localMediaStream.current =
//                 await navigator.mediaDevices.getUserMedia({
//                     audio: true
//                 });
//         };

//         startCapture().then(() => {
//             addNewClient(user, () => {
//                 const localElement = audioElements.current[user.id];
//                 if (localElement) {
//                     // Mute self audio
//                     localElement.volume = 0;
//                     localElement.srcObject = localMediaStream.current;
//                 }

//                 //SOCKET EMIT JOIN socket io
//                 socket.current.emit(ACTIONS.JOIN, {roomId, user});
//             });
//         });

//         return () => {
//             //leaving the room
//             localMediaStream.current.getTracks().forEach(track => {
//                 track.stop()
//             });

//             socket.current.emit(ACTIONS.LEAVE, {roomId});
//         };
//     }, []);

//     useEffect(() => {
//         const handleNewPeer = async ({peerId, createOffer, user: remoteUser}) => {
//             //if already connected then give warning 
//             if(peerId in connections.current){
//                 return console.warn('You are already connected with ${peerId} (${user.name})');
//             }

//             connections.current[peerId] = new RTCPeerConnection({
//                 iceServers: freeice()
//             });

//             //handle new ice candidate
//             connections.current[peerId].onicecandidate = (event) => {
//                 socket.current.emit(ACTIONS.RELAY_ICE, {
//                     peerId,
//                     icecandidate: event.candidate
//                 })
//             }

//             //handle on track on this connection
//             connections.current[peerId].ontrack = ({
//                 streams: [remoteStream]
//             }) => {
//                 addNewClient(remoteUser, () => {
//                     if(audioElements.current[remoteUser.id]){
//                         audioElements.current[remoteUser.id].srcObject = remoteStream
//                     } else{
//                         let settled = false;
//                         const interval = setInterval(() => {
//                             if(audioElements.current[remoteUser.id]){
//                                 audioElements.current[remoteUser.id].srcObject = remoteStream
//                                 settled = true;
//                             }
//                             if(settled){
//                                 clearInterval(interval);
//                             }
//                         }, 1000)
//                     }
//                 })
//             };

//             //add local track to remote connections
//             localMediaStream.current.getTracks().forEach(track => {
//                 connections.current[peerId].addTrack(track, localMediaStream.current);
//             });

//             //create offer
//             if(createOffer){
//                 const offer = await connections.current[peerId].createOffer();

//                 await connections.current[peerId].setLocalDescription(offer);
//                 //send offer to another client
//                 socket.current.emit(ACTIONS.RELAY_SDP, {
//                     peerId,
//                     sessionDescription: offer
//                 })
//             }
//         };
//         socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);

//         return () => {
//             socket.current.off(ACTIONS.ADD_PEER);
//         }
//     }, []);

//     //handle ice candidate
//     useEffect(() => {
//         socket.current.on(ACTIONS.ICE_CANDIDATE, ({peerId, icecandidate}) => {
//             if(icecandidate){
//                 connections.current[peerId].addIceCandidate(icecandidate);
//             }
//         })

//         return () => {
//             socket.current.off(ACTIONS.ICE_CANDIDATE);
//         }
//     }, []);


//     //handle sdp
//     useEffect(() => {

//         const handleRemoteSdp = async ({peerId, sessionDescription: remoteSessionDescription,}) => {
//             connections.current[peerId].setRemoteDescription(
//                 new RTCSessionDescription(remoteSessionDescription)
//             )

//             //if session description is type of offer then create an answer

//             if(remoteSessionDescription.type === 'offer'){
//                 const connection = connections.current[peerId];
//                 const answer = await connection.createAnswer();

//                 connection.setLocalDescription(answer);


//                 socket.current.emit(ACTIONS.RELAY_SDP, {
//                     peerId,
//                     sessionDescription: answer,
//                 })
//             }

//         };
//         socket.current.on(ACTIONS.SESSION_DESCRIPTION, handleRemoteSdp);

//         return () => {
//             socket.current.off(ACTIONS.SESSION_DESCRIPTION);
//         }
//     }, []);

//     //handle remove peer
//     useEffect(()=> {
//         const handleRemovePeer = async ({peerId, userId}) => {
//             if(connections.current[peerId]){
//                 connections.current[peerId].close();
//             }

//             delete connections.current[peerId];
//             delete audioElements.current[peerId];
//             setClients(list => list.filter(client => client.id !== userId));
//         };
//         socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

//         return () => {
//             socket.current.off(ACTIONS.REMOVE_PEER);
//         };
//     }, [])


//     const provideRef = (instance, userId) => {
//         audioElements.current[userId] = instance;
//     };

//     return { clients, provideRef };
// };


import { useStateWithCallback } from "./useStateWithCallback";
import { useCallback, useEffect, useRef, useState } from "react";
import { socketInit } from "../socket";
import { ACTIONS } from "../actions";
import freeice from "freeice";

export const useWebRTC = (roomId, user) => {

    const [clients, setClients] = useStateWithCallback([]);
    const [messages, setMessages] = useState([]);
    const [reactions, setReactions] = useState([]);
    const audioElements = useRef({});
    const connections = useRef({});
    const localMediaStream = useRef(null);
    const socket = useRef(null);
    const clientsRef = useRef([]);
    const speakingMap = useRef({});

    const captureStarted = useRef(false);

    useEffect(() => {
        socket.current = socketInit();
    }, []);

    const addNewClient = useCallback(
        (newClient, cb) => {
            const lookingFor = clients.find(
                (client) => client.id === newClient.id
            );

            if (lookingFor === undefined) {
                setClients((existingClients) => [...existingClients, newClient], cb);
            }
        },
        [clients, setClients]
    );

    // Capture microphone
    useEffect(() => {

        if (captureStarted.current) return;
        captureStarted.current = true;

        const startCapture = async () => {
            try {
                localMediaStream.current =
                    await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                addNewClient({ ...user, muted: true }, () => {
                    const localElement = audioElements.current[user.id];

                    if (localElement) {
                        localElement.volume = 0;
                        localElement.srcObject = localMediaStream.current;
                    }
                });

                socket.current.emit(ACTIONS.JOIN, { roomId, user });

            } catch (error) {
                console.error("Microphone access error:", error);
            }
        };

        startCapture();

        return () => {

            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            if (socket.current) {
                socket.current.emit(ACTIONS.LEAVE, { roomId });
            }

        };

    }, [addNewClient, roomId, user]);



    // Handle new peer
    useEffect(() => {

        const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {

            if (peerId in connections.current) {
                console.warn(`Already connected with ${peerId} (${remoteUser.name})`);
                return;
            }

            connections.current[peerId] = new RTCPeerConnection({
                iceServers: freeice(),
            });

            // ICE candidate
            connections.current[peerId].onicecandidate = (event) => {
                socket.current.emit(ACTIONS.RELAY_ICE, {
                    peerId,
                    icecandidate: event.candidate,
                });
            };

            // Remote stream
            connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {

                addNewClient({ ...remoteUser, muted: true }, () => {

                    if (audioElements.current[remoteUser.id]) {
                        audioElements.current[remoteUser.id].srcObject = remoteStream;
                    } else {

                        let settled = false;

                        const interval = setInterval(() => {

                            if (audioElements.current[remoteUser.id]) {
                                audioElements.current[remoteUser.id].srcObject = remoteStream;
                                settled = true;
                            }

                            if (settled) clearInterval(interval);

                        }, 500);

                    }

                });

            };

            // Add local tracks
            if (localMediaStream.current) {
                localMediaStream.current.getTracks().forEach((track) => {
                    connections.current[peerId].addTrack(
                        track,
                        localMediaStream.current
                    );
                });
            }

            // Create offer
            if (createOffer) {

                const offer = await connections.current[peerId].createOffer();

                await connections.current[peerId].setLocalDescription(offer);

                socket.current.emit(ACTIONS.RELAY_SDP, {
                    peerId,
                    sessionDescription: offer,
                });

            }

        };

        socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);

        return () => {
            socket.current.off(ACTIONS.ADD_PEER);
        };

    }, [addNewClient]);



    // Handle ICE candidate
    useEffect(() => {

        const handleIceCandidate = ({ peerId, icecandidate }) => {

            if (icecandidate && connections.current[peerId]) {
                connections.current[peerId].addIceCandidate(icecandidate);
            }

        };

        socket.current.on(ACTIONS.ICE_CANDIDATE, handleIceCandidate);

        return () => {
            socket.current.off(ACTIONS.ICE_CANDIDATE);
        };

    }, []);



    // Handle SDP
    useEffect(() => {

        const handleRemoteSdp = async ({ peerId, sessionDescription }) => {

            if (!connections.current[peerId]) return;

            await connections.current[peerId].setRemoteDescription(
                new RTCSessionDescription(sessionDescription)
            );

            if (sessionDescription.type === "offer") {

                const answer = await connections.current[peerId].createAnswer();

                await connections.current[peerId].setLocalDescription(answer);

                socket.current.emit(ACTIONS.RELAY_SDP, {
                    peerId,
                    sessionDescription: answer,
                });

            }

        };

        socket.current.on(ACTIONS.SESSION_DESCRIPTION, handleRemoteSdp);

        return () => {
            socket.current.off(ACTIONS.SESSION_DESCRIPTION);
        };

    }, []);



    // Remove peer
    useEffect(() => {

        const handleRemovePeer = ({ peerId, userId }) => {

            if (connections.current[peerId]) {
                connections.current[peerId].close();
            }

            delete connections.current[peerId];
            delete audioElements.current[userId];

            setClients((list) => list.filter((client) => client.id !== userId));

        };

        socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

        return () => {
            socket.current.off(ACTIONS.REMOVE_PEER);
        };

    }, []);

    useEffect(() => {
        clientsRef.current = clients;
    }, [clients]);

    //Listen for mute/unmute
    useEffect(() => {
        socket.current.on(ACTIONS.MUTE, ({ peerId, userId }) => {
            setMute(true, userId);
        })

        socket.current.on(ACTIONS.UN_MUTE, ({ peerId, userId }) => {
            setMute(false, userId);
        })

        const setMute = (mute, userId) => {
            const clientIdx = clientsRef.current.map(client => client.id).indexOf(userId);

            const connectedClients = JSON.parse(JSON.stringify(clientsRef.current));
            if (clientIdx > -1) {
                connectedClients[clientIdx].muted = mute;
                setClients(connectedClients);
            }
        }
    }, []);

    // Listen for Moderation events (Kick & Remove Room)
    useEffect(() => {
        socket.current.on(ACTIONS.REMOVE_ROOM, () => {
            alert("The Owner has closed this room.");
            window.location.href = '/rooms';
        });

        socket.current.on(ACTIONS.KICK_USER, ({ userId }) => {
            if (user.id === userId) {
                alert("You have been removed from the room by the owner.");
                window.location.href = '/rooms';
            } else {
                setClients((list) => list.filter((client) => client.id !== userId));
            }
        });

        // Role moderation (Visual update & forced local muting if demoted)
        socket.current.on(ACTIONS.MAKE_LISTENER, ({ userId }) => {
            setClients(list => list.map(client => {
                if (client.id === userId) {
                    return { ...client, role: 'listener' };
                }
                return client;
            }));
            
            // If I am the one demoted, force my mic off
            if (user.id === userId) {
                handleMute(true, user.id);
            }
        });

        socket.current.on(ACTIONS.MAKE_SPEAKER, ({ userId }) => {
            setClients(list => list.map(client => {
                if (client.id === userId) {
                    return { ...client, role: 'speaker' };
                }
                return client;
            }));
        });

        return () => {
            socket.current.off(ACTIONS.REMOVE_ROOM);
            socket.current.off(ACTIONS.KICK_USER);
            socket.current.off(ACTIONS.MAKE_LISTENER);
            socket.current.off(ACTIONS.MAKE_SPEAKER);
        };
    }, [user.id, setClients]);

    // Hand raise listeners
    useEffect(() => {
        socket.current.on(ACTIONS.RAISE_HAND, ({ userId }) => {
            setClients(list => list.map(client => {
                if (client.id === userId) return { ...client, handRaised: true };
                return client;
            }));
        });

        socket.current.on(ACTIONS.LOWER_HAND, ({ userId }) => {
            setClients(list => list.map(client => {
                if (client.id === userId) return { ...client, handRaised: false };
                return client;
            }));
        });

        return () => {
            socket.current.off(ACTIONS.RAISE_HAND);
            socket.current.off(ACTIONS.LOWER_HAND);
        };
    }, [setClients]);

    // Chat message listener
    useEffect(() => {
        const handleReceiveMsg = (msgData) => {
            setMessages(prev => [...prev, msgData]);
        };
        
        const handleReceiveReaction = (reactionData) => {
            // Add new reaction to the list. We'll auto-remove them in the UI component
            setReactions(prev => [...prev, reactionData]);
        };

        socket.current.on(ACTIONS.RECEIVE_MSG, handleReceiveMsg);
        socket.current.on(ACTIONS.RECEIVE_REACTION, handleReceiveReaction);

        return () => {
            socket.current.off(ACTIONS.RECEIVE_MSG, handleReceiveMsg);
            socket.current.off(ACTIONS.RECEIVE_REACTION, handleReceiveReaction);
        };
    }, []);

    // Active Speaker Detection via Web Audio API
    useEffect(() => {
        const audioCtxMap = {};
        const analyserMap = {};
        let animFrameId;

        const detectSpeaking = () => {
            const newSpeakingMap = {};
            Object.keys(audioElements.current).forEach(userId => {
                const el = audioElements.current[userId];
                if (!el || !el.srcObject) return;

                if (!analyserMap[userId]) {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const source = ctx.createMediaStreamSource(el.srcObject);
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 512;
                        source.connect(analyser);
                        audioCtxMap[userId] = ctx;
                        analyserMap[userId] = analyser;
                    } catch (e) {
                        return;
                    }
                }

                const analyser = analyserMap[userId];
                const data = new Uint8Array(analyser.fftSize);
                analyser.getByteTimeDomainData(data);

                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    const val = (data[i] - 128) / 128;
                    sum += val * val;
                }
                const rms = Math.sqrt(sum / data.length);
                newSpeakingMap[userId] = rms > 0.02;
            });

            // Only update state if something changed
            let changed = false;
            for (const uid of Object.keys(newSpeakingMap)) {
                if (speakingMap.current[uid] !== newSpeakingMap[uid]) {
                    changed = true;
                    break;
                }
            }

            if (changed) {
                speakingMap.current = newSpeakingMap;
                setClients(list => list.map(c => ({
                    ...c,
                    isSpeaking: !!newSpeakingMap[c.id],
                })));
            }

            animFrameId = requestAnimationFrame(detectSpeaking);
        };

        // Start detection after a short delay to let audio elements set up
        const timeout = setTimeout(() => {
            animFrameId = requestAnimationFrame(detectSpeaking);
        }, 2000);

        return () => {
            clearTimeout(timeout);
            cancelAnimationFrame(animFrameId);
            Object.values(audioCtxMap).forEach(ctx => ctx.close().catch(() => {}));
        };
    }, [clients.length, setClients]);

    const provideRef = (instance, userId) => {
        audioElements.current[userId] = instance;
    };

    //Handling mute
    const handleMute = (isMute, userId) => {
        let settled = false;
        let interval = setInterval(() => {
            if (localMediaStream.current) {
                localMediaStream.current.getTracks()[0].enabled = !isMute;
                if (isMute) {
                    socket.current.emit(ACTIONS.MUTE, { roomId, userId });
                } else {
                    socket.current.emit(ACTIONS.UN_MUTE, { roomId, userId });
                }

                settled = true;
            }

            if (settled) {
                clearInterval(interval);
            }
        }, 200);

    };

    // Moderation emitters for the UI
    const kickUser = (userId) => {
        socket.current.emit(ACTIONS.KICK_USER, { roomId, userId });
    };

    const makeSpeaker = (userId) => {
        socket.current.emit(ACTIONS.MAKE_SPEAKER, { roomId, userId });
    };

    const makeListener = (userId) => {
        socket.current.emit(ACTIONS.MAKE_LISTENER, { roomId, userId });
    };

    const removeRoom = () => {
        socket.current.emit(ACTIONS.REMOVE_ROOM, { roomId });
    };

    // Hand raise emitters
    const raiseHand = () => {
        socket.current.emit(ACTIONS.RAISE_HAND, { roomId, userId: user.id });
    };

    const lowerHand = () => {
        socket.current.emit(ACTIONS.LOWER_HAND, { roomId, userId: user.id });
    };

    // Chat and Reaction emitters
    const sendMessage = (text) => {
        socket.current.emit(ACTIONS.SEND_MSG, { roomId, message: text, user });
    };

    const sendReaction = (emoji) => {
        socket.current.emit(ACTIONS.SEND_REACTION, { roomId, emoji, user });
    };

    return {
        clients, provideRef, handleMute,
        kickUser, makeSpeaker, makeListener, removeRoom,
        raiseHand, lowerHand,
        messages, sendMessage,
        reactions, sendReaction, setReactions
    };
};