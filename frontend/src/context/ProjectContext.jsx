import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

// Create Project Context
const ProjectContext = createContext();

// Project Actions
const PROJECT_ACTIONS = {
    LOAD_PROJECTS_START: 'LOAD_PROJECTS_START',
    LOAD_PROJECTS_SUCCESS: 'LOAD_PROJECTS_SUCCESS',
    LOAD_PROJECTS_FAILURE: 'LOAD_PROJECTS_FAILURE',
    CREATE_PROJECT_START: 'CREATE_PROJECT_START',
    CREATE_PROJECT_SUCCESS: 'CREATE_PROJECT_SUCCESS',
    CREATE_PROJECT_FAILURE: 'CREATE_PROJECT_FAILURE',
    UPDATE_PROJECT: 'UPDATE_PROJECT',
    DELETE_PROJECT: 'DELETE_PROJECT',
    SET_CURRENT_PROJECT: 'SET_CURRENT_PROJECT',
    LOAD_TASKS_START: 'LOAD_TASKS_START',
    LOAD_TASKS_SUCCESS: 'LOAD_TASKS_SUCCESS',
    LOAD_TASKS_FAILURE: 'LOAD_TASKS_FAILURE',
    CREATE_TASK: 'CREATE_TASK',
    UPDATE_TASK: 'UPDATE_TASK',
    DELETE_TASK: 'DELETE_TASK',
    MOVE_TASK: 'MOVE_TASK',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial State
const initialState = {
    projects: [],
    currentProject: null,
    tasks: [],
    isLoading: false,
    isLoadingTasks: false,
    error: null,
    socket: null
};

// Project Reducer
const projectReducer = (state, action) => {
    switch (action.type) {
        case PROJECT_ACTIONS.LOAD_PROJECTS_START:
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case PROJECT_ACTIONS.LOAD_PROJECTS_SUCCESS:
            return {
                ...state,
                projects: action.payload,
                isLoading: false,
                error: null
            };

        case PROJECT_ACTIONS.LOAD_PROJECTS_FAILURE:
            return {
                ...state,
                projects: [],
                isLoading: false,
                error: action.payload
            };

        case PROJECT_ACTIONS.CREATE_PROJECT_START:
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case PROJECT_ACTIONS.CREATE_PROJECT_SUCCESS:
            return {
                ...state,
                projects: [action.payload, ...state.projects],
                isLoading: false,
                error: null
            };

        case PROJECT_ACTIONS.CREATE_PROJECT_FAILURE:
            return {
                ...state,
                isLoading: false,
                error: action.payload
            };

        case PROJECT_ACTIONS.UPDATE_PROJECT:
            return {
                ...state,
                projects: state.projects.map(project =>
                    project._id === action.payload._id ? action.payload : project
                ),
                currentProject: state.currentProject?._id === action.payload._id
                    ? action.payload
                    : state.currentProject
            };

        case PROJECT_ACTIONS.DELETE_PROJECT:
            return {
                ...state,
                projects: state.projects.filter(project => project._id !== action.payload),
                currentProject: state.currentProject?._id === action.payload
                    ? null
                    : state.currentProject
            };

        case PROJECT_ACTIONS.SET_CURRENT_PROJECT:
            return {
                ...state,
                currentProject: action.payload
            };

        case PROJECT_ACTIONS.LOAD_TASKS_START:
            return {
                ...state,
                isLoadingTasks: true,
                error: null
            };

        case PROJECT_ACTIONS.LOAD_TASKS_SUCCESS:
            return {
                ...state,
                tasks: action.payload,
                isLoadingTasks: false,
                error: null
            };

        case PROJECT_ACTIONS.LOAD_TASKS_FAILURE:
            return {
                ...state,
                tasks: [],
                isLoadingTasks: false,
                error: action.payload
            };

        case PROJECT_ACTIONS.CREATE_TASK:
            return {
                ...state,
                tasks: [...state.tasks, action.payload]
            };

        case PROJECT_ACTIONS.UPDATE_TASK:
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task._id === action.payload._id ? action.payload : task
                )
            };

        case PROJECT_ACTIONS.DELETE_TASK:
            return {
                ...state,
                tasks: state.tasks.filter(task => task._id !== action.payload)
            };

        case PROJECT_ACTIONS.MOVE_TASK:
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task._id === action.payload._id ? action.payload : task
                )
            };

        case PROJECT_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
};

// Project Provider Component
export const ProjectProvider = ({ children }) => {
    const [state, dispatch] = useReducer(projectReducer, initialState);
    const { isAuthenticated, token } = useAuth();

    // Initialize Socket.IO connection
    useEffect(() => {
        if (isAuthenticated && token) {
            const socket = io('http://localhost:5001', {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            // Socket event listeners
            socket.on('project-updated', (project) => {
                dispatch({ type: PROJECT_ACTIONS.UPDATE_PROJECT, payload: project });
            });

            socket.on('project-deleted', (projectId) => {
                dispatch({ type: PROJECT_ACTIONS.DELETE_PROJECT, payload: projectId });
            });

            socket.on('task-created', (task) => {
                dispatch({ type: PROJECT_ACTIONS.CREATE_TASK, payload: task });
            });

            socket.on('task-updated', (task) => {
                dispatch({ type: PROJECT_ACTIONS.UPDATE_TASK, payload: task });
            });

            socket.on('task-moved', (data) => {
                dispatch({ type: PROJECT_ACTIONS.MOVE_TASK, payload: data.task });
            });

            socket.on('task-deleted', (taskId) => {
                dispatch({ type: PROJECT_ACTIONS.DELETE_TASK, payload: taskId });
            });

            socket.on('member-added', (data) => {
                dispatch({ type: PROJECT_ACTIONS.UPDATE_PROJECT, payload: data.project });
            });

            socket.on('member-removed', (data) => {
                dispatch({ type: PROJECT_ACTIONS.UPDATE_PROJECT, payload: data.project });
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [isAuthenticated, token]);

    // Load projects
    const loadProjects = async () => {
        dispatch({ type: PROJECT_ACTIONS.LOAD_PROJECTS_START });

        try {
            const response = await axios.get('http://localhost:5001/api/projects');
            dispatch({
                type: PROJECT_ACTIONS.LOAD_PROJECTS_SUCCESS,
                payload: response.data.data.projects
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to load projects';
            dispatch({
                type: PROJECT_ACTIONS.LOAD_PROJECTS_FAILURE,
                payload: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    };

    // Create project
    const createProject = async (projectData) => {
        dispatch({ type: PROJECT_ACTIONS.CREATE_PROJECT_START });

        try {
            const response = await axios.post('http://localhost:5001/api/projects', projectData);
            dispatch({
                type: PROJECT_ACTIONS.CREATE_PROJECT_SUCCESS,
                payload: response.data.data.project
            });
            return { success: true, project: response.data.data.project };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create project';
            dispatch({
                type: PROJECT_ACTIONS.CREATE_PROJECT_FAILURE,
                payload: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    };

    // Update project
    const updateProject = async (projectId, projectData) => {
        try {
            const response = await axios.put(`http://localhost:5001/api/projects/${projectId}`, projectData);
            dispatch({
                type: PROJECT_ACTIONS.UPDATE_PROJECT,
                payload: response.data.data.project
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update project';
            return { success: false, error: errorMessage };
        }
    };

    // Delete project
    const deleteProject = async (projectId) => {
        try {
            await axios.delete(`http://localhost:5001/api/projects/${projectId}`);
            dispatch({
                type: PROJECT_ACTIONS.DELETE_PROJECT,
                payload: projectId
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete project';
            return { success: false, error: errorMessage };
        }
    };

    // Set current project
    const setCurrentProject = (project) => {
        dispatch({
            type: PROJECT_ACTIONS.SET_CURRENT_PROJECT,
            payload: project
        });
    };

    // Load tasks for a project
    const loadTasks = async (projectId) => {
        dispatch({ type: PROJECT_ACTIONS.LOAD_TASKS_START });

        try {
            const response = await axios.get(`http://localhost:5001/api/tasks/project/${projectId}`);
            dispatch({
                type: PROJECT_ACTIONS.LOAD_TASKS_SUCCESS,
                payload: response.data.data.tasks
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to load tasks';
            dispatch({
                type: PROJECT_ACTIONS.LOAD_TASKS_FAILURE,
                payload: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    };

    // Create task
    const createTask = async (taskData) => {
        try {
            const response = await axios.post('http://localhost:5001/api/tasks', taskData);
            // Immediately update local state for instant UI feedback
            dispatch({
                type: PROJECT_ACTIONS.CREATE_TASK,
                payload: response.data.data.task
            });
            return { success: true, task: response.data.data.task };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create task';
            return { success: false, error: errorMessage };
        }
    };

    // Update task
    const updateTask = async (taskId, taskData) => {
        try {
            const response = await axios.put(`http://localhost:5001/api/tasks/${taskId}`, taskData);
            // Immediately update local state for instant UI feedback
            dispatch({
                type: PROJECT_ACTIONS.UPDATE_TASK,
                payload: response.data.data.task
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update task';
            return { success: false, error: errorMessage };
        }
    };

    // Move task
    const moveTask = async (taskId, column, destinationIndex) => {
        // Optimistically update ALL affected tasks for proper reordering
        const taskToUpdate = state.tasks.find(task => task._id === taskId);
        if (taskToUpdate) {
            const oldColumn = taskToUpdate.column;
            const newColumn = column;

            if (oldColumn === newColumn) {
                // Same column reordering - need to update multiple tasks
                const columnTasks = state.tasks
                    .filter(task => task.column === newColumn)
                    .sort((a, b) => a.order - b.order);

                // Remove the moved task and insert at new position
                const otherTasks = columnTasks.filter(task => task._id !== taskId);
                otherTasks.splice(destinationIndex, 0, taskToUpdate);

                // Update all tasks in the column with new sequential order
                const updatedTasks = otherTasks.map((task, index) => ({
                    ...task,
                    order: index
                }));

                // Dispatch updates for all affected tasks
                updatedTasks.forEach(task => {
                    dispatch({
                        type: PROJECT_ACTIONS.UPDATE_TASK,
                        payload: task
                    });
                });
            } else {
                // Different column - just update the moved task
                const optimisticTask = {
                    ...taskToUpdate,
                    column: column,
                    order: destinationIndex
                };

                dispatch({
                    type: PROJECT_ACTIONS.UPDATE_TASK,
                    payload: optimisticTask
                });
            }
        }

        // Then make the API call in the background
        try {
            const response = await axios.put(`http://localhost:5001/api/tasks/${taskId}/move`, {
                column,
                destinationIndex
            });

            // If successful, the socket events will sync the real data
            // If the optimistic update was wrong, socket events will correct it
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to move task';
            console.error('Move task error:', error);

            // On error, revert the optimistic update
            if (taskToUpdate) {
                dispatch({
                    type: PROJECT_ACTIONS.UPDATE_TASK,
                    payload: taskToUpdate // Revert to original state
                });
            }

            return { success: false, error: errorMessage };
        }
    };

    // Delete task
    const deleteTask = async (taskId) => {
        try {
            await axios.delete(`http://localhost:5001/api/tasks/${taskId}`);
            // Immediately update local state for instant UI feedback
            dispatch({
                type: PROJECT_ACTIONS.DELETE_TASK,
                payload: taskId
            });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete task';
            return { success: false, error: errorMessage };
        }
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: PROJECT_ACTIONS.CLEAR_ERROR });
    };

    const value = {
        ...state,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        loadTasks,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        clearError
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

// Custom hook to use project context
export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};