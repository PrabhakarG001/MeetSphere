import server from '../../../../environment';

export const SERVER_URL = server;

export const PEER_CONFIG_CONNECTIONS = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" },
        { "urls": "stun:stun1.l.google.com:19302" },
        { "urls": "stun:stun2.l.google.com:19302" },
        { "urls": "stun:stun3.l.google.com:19302" },
        { "urls": "stun:stun4.l.google.com:19302" },
        { "urls": "stun:stun.services.mozilla.com" },
        { "urls": "stun:stun.global.stun.twilio.com:3478" }
    ],
    "iceCandidatePoolSize": 10
};
