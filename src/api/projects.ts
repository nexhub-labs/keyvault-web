import axiosInstance from "../utils/axiosInstance";

export interface Project {
    _id: string;
    name: string;
    type: 'individual' | 'team' | 'family';
    ownerId: string;
    teamId?: string;
    familyId?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export const createProjectAPI = async (data: {
    name: string;
    type: 'individual' | 'team' | 'family';
    teamId?: string;
    familyId?: string;
    description?: string;
}): Promise<Project> => {
    const response = await axiosInstance.post('/projects/create', data);
    return response.data;
};

export const getMyProjectsAPI = async (): Promise<Project[]> => {
    const response = await axiosInstance.get('/projects/my-projects');
    return response.data;
};

export const updateProjectAPI = async (projectId: string, data: { name: string }): Promise<Project> => {
    const response = await axiosInstance.post(`/projects/${projectId}/update`, data);
    return response.data;
};
