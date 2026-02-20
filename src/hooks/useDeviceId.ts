import { useState, useEffect } from 'react';

export const useDeviceId = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        let id = localStorage.getItem('kv_device_id');
        if (!id) {
            id = window.crypto.randomUUID();
            localStorage.setItem('kv_device_id', id);
        }
        setDeviceId(id);
    }, []);

    return deviceId;
};
