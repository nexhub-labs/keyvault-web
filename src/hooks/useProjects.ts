import { useState, useEffect, useMemo, useCallback } from 'react';
import { getMyProjectsAPI, createProjectAPI, updateProjectAPI, Project } from '../api/projects';
import { logger } from '../utils/logger';

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMyProjectsAPI();
            setProjects(data);
            setError(null);
        } catch (err) {
            logger.error("Failed to fetch projects", err);
            setError("Could not load projects");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (data: {
        name: string;
        type: 'individual' | 'team' | 'family';
        teamId?: string;
        familyId?: string;
        description?: string;
    }) => {
        try {
            const newProject = await createProjectAPI(data);
            setProjects(prev => [...prev, newProject]);
            return newProject;
        } catch (err) {
            logger.error("Failed to create project", err);
            throw err;
        }
    };

    const renameProject = async (projectId: string, newName: string) => {
        try {
            const updated = await updateProjectAPI(projectId, { name: newName });
            setProjects(prev => prev.map(p => p._id === projectId ? { ...p, name: newName } : p));
            return updated;
        } catch (err) {
            logger.error("Failed to rename project", err);
            throw err;
        }
    };

    const groupedProjects = useMemo(() => {
        return {
            personal: projects.filter(p => p.type === 'individual'),
            team: projects.filter(p => p.type === 'team'),
            family: projects.filter(p => p.type === 'family'),
        };
    }, [projects]);

    return {
        projects,
        groupedProjects,
        loading,
        error,
        createProject,
        renameProject,
        refresh: fetchProjects,
    };
};
