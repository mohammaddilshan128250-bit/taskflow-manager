import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { FiLogOut, FiUser, FiPlus, FiFolder, FiEdit, FiTrash2, FiUsers, FiCalendar } from 'react-icons/fi';
import CreateProjectModal from '../components/CreateProjectModal';
import JoinProjectModal from '../components/JoinProjectModal';
import EditProjectModal from '../components/EditProjectModal';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { projects, loadProjects, deleteProject, isLoading } = useProject();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, []);

    // Reload projects when returning to dashboard (e.g., after deleting a project)
    useEffect(() => {
        const handleFocus = () => {
            loadProjects();
        };

        window.addEventListener('focus', handleFocus);

        // Also reload when the component becomes visible again
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadProjects();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadProjects]);

    const handleLogout = async () => {
        await logout();
    };

    const handleDeleteProject = async (projectId, projectTitle) => {
        if (!projectId) {
            console.error('Cannot delete project: missing project ID');
            return;
        }

        const title = projectTitle || 'this project';
        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            const result = await deleteProject(projectId);
            if (!result.success) {
                alert('Failed to delete project: ' + result.error);
            }
        }
    };

    const handleProjectClick = (project) => {
        navigate(`/project/${project._id}`);
    };

    const getProjectStats = () => {
        const totalProjects = projects.length;
        // For now, we'll show 0 for tasks since we haven't loaded them
        // In a real app, you might want to load task counts for each project
        return {
            totalProjects,
            activeTasks: 0,
            completedTasks: 0
        };
    };

    const stats = getProjectStats();

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>TaskFlow</h1>
                    <span className="welcome-text">Welcome back, {user?.username}!</span>
                </div>

                <div className="header-right">
                    <div className="user-info">
                        <FiUser className="user-icon" />
                        <span>{user?.username}</span>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <FiLogOut />
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-content">
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Your Projects</h2>
                            <div className="header-actions">
                                <button
                                    className="create-btn secondary"
                                    onClick={() => setShowJoinModal(true)}
                                >
                                    <FiUsers />
                                    Join Project
                                </button>
                                <button
                                    className="create-btn"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <FiPlus />
                                    New Project
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">
                                <div className="loading-spinner large"></div>
                                <p>Loading projects...</p>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="empty-state">
                                <FiFolder className="empty-icon" />
                                <h3>No projects yet</h3>
                                <p>Create your first project to get started with task management</p>
                                <button
                                    className="create-project-btn"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <FiPlus />
                                    Create Project
                                </button>
                            </div>
                        ) : (
                            <div className="projects-grid">
                                {projects.map((project) => (
                                    <div
                                        key={project._id}
                                        className="project-card"
                                        onClick={() => handleProjectClick(project)}
                                    >
                                        <div className="project-header">
                                            <div
                                                className="project-color"
                                                style={{ backgroundColor: project.color }}
                                            ></div>
                                            <div className="project-actions">
                                                <button
                                                    className="action-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingProject(project);
                                                    }}
                                                >
                                                    <FiEdit />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProject(project?._id, project?.title);
                                                    }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="project-content">
                                            <h3>{project.title}</h3>
                                            {project.description && (
                                                <p className="project-description">{project.description}</p>
                                            )}
                                        </div>

                                        <div className="project-footer">
                                            <div className="project-info">
                                                <span className="info-item">
                                                    <FiUsers />
                                                    {project.members?.length || 0} members
                                                </span>
                                                <span className="info-item">
                                                    <FiCalendar />
                                                    {new Date(project.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <h3>{stats.totalProjects}</h3>
                            <p>Total Projects</p>
                        </div>
                        <div className="stat-card">
                            <h3>{stats.activeTasks}</h3>
                            <p>Active Tasks</p>
                        </div>
                        <div className="stat-card">
                            <h3>{stats.completedTasks}</h3>
                            <p>Completed Tasks</p>
                        </div>
                    </div>
                </div>
            </main>

            {showCreateModal && (
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {showJoinModal && (
                <JoinProjectModal
                    onClose={() => setShowJoinModal(false)}
                />
            )}

            {editingProject && (
                <EditProjectModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;