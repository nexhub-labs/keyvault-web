import axiosInstance from "../../utils/axiosInstance";

async function getUserProfile(email: string) {
    const jsonData = JSON.stringify({ email });
    try {
        const response = await axiosInstance.post('/users/profile/me', jsonData);
        return response.data;
    } catch (error) {
        const err = error as { response?: { data?: { message?: string } }, message?: string };
        console.error(err.response?.data?.message || err.message);
        throw err;
    }
}

export { getUserProfile };
