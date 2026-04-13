import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiTrash2, FiType, FiFileText, FiAlertTriangle, FiSettings } from 'react-icons/fi';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProjectSettingsModal = ({ project, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [errors, setErrors] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const { updateProject, deleteProject, isLoading } = useProject();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Initialize form data
    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title || '',
                description: project.description || ''
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Project title is required';
        } else if (formData.title.trim().length > 100) {
            newErrors.title = 'Project title must be less than 100 characters';
        }

        if (formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const projectData = {
            title: formData.title.trim(),
            description: formData.description.trim()
        };

        const result = await updateProject(project._id, projectData);

        if (result.success) {
            onClose();
        } else {
            setErrors({ submit: result.error });
        }
    };

    const handleDeleteProject = async () => {
        if (deleteConfirmText !== project.title) {
            setErrors({ delete: 'Project name does not match' });
            return;
        }

        try {
            const result = await deleteProject(project._id);

            if (result.success) {
                console.log('Project deleted successfully, redirecting...');
                onClose();

                // Use replace instead of navigate to ensure we don't go back to deleted project
                navigate('/dashboard', { replace: true });

                // Fallback redirect if navigate doesn't work
                setTimeout(() => {
                    if (window.location.pathname !== '/dashboard') {
                        window.location.href = '/dashboard';
                    }
                }, 500);
            } else {
                console.error('Delete failed:', result.error);
                setErrors({ delete: result.error });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setErrors({ delete: 'An unexpected error occurred while deleting the project' });
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const isOwner = project?.owner?._id === user?._id ||
        project?.owner?._id === user?.id ||
        project?.owner === user?._id ||
        project?.owner === user?.id ||
        project?.owner?.toString() === user?._id?.toString() ||
        project?.owner?.toString() === user?.id?.toString();

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content settings-modal">
                <div className="modal-header">
                    <h2>
                        <FiSettings />
                        Project Settings
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {!showDeleteConfirm ? (
                    <>
                        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '20px' }}>
                            {errors.submit && (
                                <div className="error-message" style={{ marginBottom: '16px' }}>
                                    {errors.submit}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="title">
                                    <FiType />
                                    Project Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter project title"
                                    className={errors.title ? 'error' : ''}
                                    maxLength={100}
                                    disabled={!isOwner}
                                />
                                {errors.title && (
                                    <span className="field-error">{errors.title}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">
                                    <FiFileText />
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your project"
                                    className={errors.description ? 'error' : ''}
                                    rows={3}
                                    maxLength={500}
                                    disabled={!isOwner}
                                />
                                <div className="char-count">
                                    {formData.description.length}/500
                                </div>
                                {errors.description && (
                                    <span className="field-error">{errors.description}</span>
                                )}
                            </div>

                            {!isOwner && (
                                <div className="info-message">
                                    <FiAlertTriangle />
                                    Only the project owner can modify these settings.
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                {isOwner && (
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="loading-spinner"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>

                        {isOwner && (
                            <div className="danger-zone" style={{
                                margin: '20px',
                                padding: '20px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px'
                            }}>
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    color: '#dc2626',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}>
                                    Danger Zone
                                </h3>
                                <div className="danger-section" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div className="danger-info">
                                        <h4 style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#1f2937'
                                        }}>
                                            Delete Project
                                        </h4>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            color: '#6b7280'
                                        }}>
                                            Permanently delete this project and all its tasks. This action cannot be undone.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        style={{
                                            backgroundColor: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginLeft: '16px'
                                        }}
                                    >
                                        <FiTrash2 />
                                        Delete Project
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="delete-confirmation" style={{
                        padding: '32px',
                        textAlign: 'center'
                    }}>
                        <div className="confirmation-content">
                            <div className="warning-icon" style={{
                                fontSize: '48px',
                                color: '#dc2626',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <FiAlertTriangle />
                            </div>
                            <h3 style={{
                                margin: '0 0 16px 0',
                                fontSize: '20px',
                                fontWeight: '600',
                                color: '#1f2937'
                            }}>
                                Delete Project
                            </h3>
                            <p style={{
                                margin: '0 0 16px 0',
                                fontSize: '14px',
                                color: '#6b7280',
                                lineHeight: '1.5'
                            }}>
                                This will permanently delete the project <strong style={{ color: '#dc2626' }}>"{project.title}"</strong> and all its tasks.
                                This action cannot be undone.
                            </p>
                            <p style={{
                                margin: '0 0 16px 0',
                                fontSize: '14px',
                                color: '#374151',
                                fontWeight: '500'
                            }}>
                                Please type <strong style={{ color: '#dc2626' }}>{project.title}</strong> to confirm:
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => {
                                    setDeleteConfirmText(e.target.value);
                                    setErrors(prev => ({ ...prev, delete: '' }));
                                }}
                                placeholder="Type project name here"
                                className={errors.delete ? 'error' : ''}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: `2px solid ${errors.delete ? '#dc2626' : '#d1d5db'}`,
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    marginBottom: '8px',
                                    textAlign: 'center',
                                    fontWeight: '500'
                                }}
                            />
                            {errors.delete && (
                                <div className="field-error" style={{
                                    color: '#dc2626',
                                    fontSize: '12px',
                                    marginBottom: '16px'
                                }}>
                                    {errors.delete}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                            marginTop: '24px'
                        }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                    setErrors(prev => ({ ...prev, delete: '' }));
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDeleteProject}
                                disabled={isLoading || deleteConfirmText !== project.title}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: deleteConfirmText === project.title ? '#dc2626' : '#9ca3af',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: deleteConfirmText === project.title ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 />
                                        Delete Project
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSettingsModal;