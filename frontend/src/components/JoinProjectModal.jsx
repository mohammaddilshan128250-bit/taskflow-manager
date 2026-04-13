import React, { useState } from 'react';
import { FiX, FiUsers, FiSearch } from 'react-icons/fi';
import axios from 'axios';

const JoinProjectModal = ({ onClose }) => {
    const [projectId, setProjectId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleJoinProject = async (e) => {
        e.preventDefault();

        if (!projectId.trim()) {
            setError('Project ID is required');
            return;
        }

        setIsJoining(true);
        setError('');
        setSuccess('');

        try {
            // Use the new join endpoint that allows self-joining
            const response = await axios.post(`http://localhost:5001/api/projects/${projectId.trim()}/join`);

            if (response.data.success) {
                setSuccess('Successfully joined the project!');
                setProjectId('');

                // Close modal after a short delay to show success message
                setTimeout(() => {
                    onClose();
                    // Optionally refresh the page or reload projects
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to join project. Please check the project ID and try again.';
            setError(errorMessage);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiUsers />
                        Join Project
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleJoinProject} className="modal-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message" style={{
                            padding: '12px',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            borderRadius: '6px',
                            marginBottom: '16px'
                        }}>
                            {success}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="projectId">
                            <FiSearch />
                            Project ID
                        </label>
                        <input
                            type="text"
                            id="projectId"
                            name="projectId"
                            value={projectId}
                            onChange={(e) => {
                                setProjectId(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            placeholder="Enter project ID (e.g., 507f1f77bcf86cd799439011)"
                            className={error ? 'error' : ''}
                            disabled={isJoining}
                        />
                        <small className="form-help">
                            Ask the project owner to share the project ID with you
                        </small>
                    </div>

                    <div className="info-section" style={{
                        padding: '12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        marginBottom: '16px'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                            How to join a project:
                        </h4>
                        <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#6b7280' }}>
                            <li>Get the project ID from the project owner</li>
                            <li>Enter the project ID above</li>
                            <li>Click "Join Project" to become a member</li>
                        </ol>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={isJoining}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isJoining || !projectId.trim()}
                        >
                            {isJoining ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <FiUsers />
                                    Join Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinProjectModal;