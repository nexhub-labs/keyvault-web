// src/test/mocks/supabaseMock.ts
export const supabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        refreshSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
    },
};
