import server from '../../../../environment';

export const SERVER_URL = server;

export const PEER_CONFIG_CONNECTIONS = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};
