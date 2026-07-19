import { useState } from 'react';

export const useChat = (socketRef, socketIdRef) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [showModal, setModal] = useState(false);

    const openChat = () => {
        setModal(true);
        setNewMessages(0);
    };

    const closeChat = () => {
        setModal(false);
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdRef.current && socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    const sendMessage = (username) => {
        if (!message.trim()) return;
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    return {
        messages,
        message,
        setMessage,
        newMessages,
        showModal,
        openChat,
        closeChat,
        addMessage,
        sendMessage
    };
};
