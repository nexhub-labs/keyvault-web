// src/test/mocks/axiosInstanceMock.ts
const axiosInstanceMock = {
    post: async () => ({ data: {} }),
    get: async () => ({ data: {} }),
    put: async () => ({ data: {} }),
    delete: async () => ({ data: {} }),
    interceptors: {
        request: { use: () => { }, eject: () => { } },
        response: { use: () => { }, eject: () => { } },
    },
};

export default axiosInstanceMock;
