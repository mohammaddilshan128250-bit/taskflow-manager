import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiSettings, FiUsers } from 'react-icons/fi';
import KanbanBoard from '../components/KanbanBoard';
import ProjectMembersModal from '../components/ProjectMembersModal';
import ProjectSettingsModal from '../components/ProjectSettingsModal';

const ProjectBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { projects, loadProjects } = useProject();
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load project data on mount and when projectId changes
    useEffect(() => {
        if (!projectId) return;

        setIsLoading(true);

        // Try to find project in current projects array
        const project = projects.find(p => p._id === projectId);

        if (project) {
            setCurrentProject(project);
            setIsLoading(false);
        } else if (projects.length === 0) {
            // No projects loaded yet, load them
            loadProjects().then(() => {
                // The next effect will handle finding the project
                setIsLoading(false);
            }).catch(error => {
                console.error('Error loading projects:', error);
                setIsLoading(false);
            });
        } else {
            // Projects are loaded but project not found - redirect
            console.log('Project not found, redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
        }
    }, [projectId]);

    // Separate effect to handle when projects array updates
    useEffect(() => {
        if (projectId && projects.length > 0 && !currentProject) {
            const project = projects.find(p => p._id === projectId);
            if (project) {
                setCurrentProject(project);
            } else {
                // Project not found after loading projects
                console.log('Project not found after loading, redirecting to dashboard...');
                navigate('/dashboard', { replace: true });
            }
        }
    }, [projects.length, projectId, currentProject]);

    // Calculate member count (owner + unique additional members)
    const getMemberCount = () => {
        if (!currentProject) return 0;
        const members = currentProject.members || [];
        const ownerId = currentProject?.owner?._id || currentProject?.owner?.id || currentProject?.owner;

        // Count unique members (filter out owner if they're in members array)
        const uniqueMembers = members.filter(member => {
            const memberId = member.user?._id || member.user?.id || member._id || member.id;
            return memberId !== ownerId;
        });

        // Always count owner (1) + unique additional members
        return uniqueMembers.length + 1;
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Show loading state while checking if project exists
    if (isLoading) {
        return (
            <div className="project-board">
                <div className="loading-container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div className="loading-spinner large"></div>
                    <p>Loading project...</p>
                </div>
            </div>
        );
    }

    // If not loading and no project, we're redirecting (this shouldn't render)
    if (!currentProject) {
        return null;
    }

    return (
        <div className="project-board">
            <header className="project-header">
                <div className="header-left">
                    <button className="back-btn" onClick={handleBackToDashboard}>
                        <FiArrowLeft />
                        Back to Dashboard
                    </button>
                    <div className="project-info">
                        <h1>{currentProject?.title || 'Project Board'}</h1>
                        {currentProject?.description && (
                            <span className="project-description">{currentProject.description}</span>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <button
                        className="header-btn"
                        onClick={() => setShowMembersModal(true)}
                    >
                        <FiUsers />
                        Members ({getMemberCount()})
                    </button>
                    <button
                        className="header-btn"
                        onClick={() => setShowSettingsModal(true)}
                    >
                        <FiSettings />
                        Settings
                    </button>
                </div>
            </header>

            <main className="board-main">
                <KanbanBoard projectId={projectId} />
            </main>

            {showMembersModal && (
                <ProjectMembersModal
                    project={currentProject}
                    onClose={() => setShowMembersModal(false)}
                />
            )}

            {showSettingsModal && (
                <ProjectSettingsModal
                    project={currentProject}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}
        </div>
    );
};

export default ProjectBoard;