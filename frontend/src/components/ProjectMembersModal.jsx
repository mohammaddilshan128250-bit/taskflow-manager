import React, { useState } from 'react';
import { FiX, FiUserPlus, FiMail, FiTrash2, FiUser, FiUsers, FiStar } from 'react-icons/fi';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProjectMembersModal = ({ project, onClose }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();

        if (!inviteEmail.trim()) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(inviteEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsInviting(true);
        setError('');

        try {
            const response = await axios.post(`http://localhost:5001/api/projects/${project._id}/members`, {
                email: inviteEmail.trim(),
                role: 'member'
            });

            if (response.data.success) {
                setInviteEmail('');
                // The project data will be updated via socket events
                // You might want to show a success message here
                console.log('Member invited successfully');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to invite member. Please try again.';
            setError(errorMessage);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm('Are you sure you want to remove this member from the project?')) {
            try {
                const response = await axios.delete(`http://localhost:5001/api/projects/${project._id}/members/${memberId}`);

                if (response.data.success) {
                    console.log('Member removed successfully');
                    // The project data will be updated via socket events
                }
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Failed to remove member';
                console.error('Failed to remove member:', errorMessage);
                // You might want to show an error message to the user
            }
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
            <div className="modal-content members-modal">
                <div className="modal-header">
                    <h2>
                        <FiUsers />
                        Project Members
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '20px' }}>
                    {/* Invite new member section */}
                    {isOwner && (
                        <div className="invite-section" style={{ marginBottom: '24px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Invite New Member</h3>
                            <form onSubmit={handleInviteMember} className="invite-form">
                                <div className="form-group">
                                    <div className="input-with-icon">
                                        <FiMail />
                                        <input
                                            type="email"
                                            placeholder="Enter email address"
                                            value={inviteEmail}
                                            onChange={(e) => {
                                                setInviteEmail(e.target.value);
                                                setError('');
                                            }}
                                            disabled={isInviting}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isInviting}
                                    >
                                        {isInviting ? (
                                            <>
                                                <div className="loading-spinner"></div>
                                                Inviting...
                                            </>
                                        ) : (
                                            <>
                                                <FiUserPlus />
                                                Invite
                                            </>
                                        )}
                                    </button>
                                </div>
                                {error && (
                                    <div className="error-message">{error}</div>
                                )}
                            </form>

                            {/* Project Share Section */}
                            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Share Project</h4>
                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>
                                    Share this project ID with team members so they can join:
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <code style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        flex: 1
                                    }}>
                                        {project._id}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(project._id);
                                            // You could show a toast notification here
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members list */}
                    <div className="members-section">
                        <h3>Current Members ({(() => {
                            if (!project) return 0;
                            const members = project.members || [];
                            const ownerId = project?.owner?._id || project?.owner?.id || project?.owner;

                            // Count unique members (filter out owner if they're in members array)
                            const uniqueMembers = members.filter(member => {
                                const memberId = member.user?._id || member.user?.id || member._id || member.id;
                                return memberId !== ownerId;
                            });

                            // Always count owner (1) + unique additional members
                            return uniqueMembers.length + 1;
                        })()})</h3>
                        <div className="members-list">
                            {/* Project Owner */}
                            <div className="member-item owner" style={{ display: 'flex', alignItems: 'center', padding: '12px', marginBottom: '8px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                <div className="member-avatar" style={{ marginRight: '12px', color: '#fbbf24' }}>
                                    <FiStar size={20} />
                                </div>
                                <div className="member-details" style={{ flex: 1 }}>
                                    <div className="member-name" style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                                        {project?.owner?.username || user?.username || 'You'}
                                    </div>
                                    <div className="member-email" style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                        {project?.owner?.email || user?.email || ''}
                                    </div>
                                    <div className="member-role" style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }}>
                                        Owner
                                    </div>
                                </div>
                            </div>

                            {/* Project Members */}
                            {project?.members?.filter(member => {
                                // Filter out the owner from members list to avoid duplication
                                const memberId = member.user?._id || member.user?.id || member._id || member.id;
                                const ownerId = project?.owner?._id || project?.owner?.id || project?.owner;
                                return memberId !== ownerId;
                            }).map((member) => (
                                <div key={member._id || member.user?._id} className="member-item" style={{ display: 'flex', alignItems: 'center', padding: '12px', marginBottom: '8px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                    <div className="member-avatar" style={{ marginRight: '12px', color: '#6b7280' }}>
                                        <FiUser size={20} />
                                    </div>
                                    <div className="member-details" style={{ flex: 1 }}>
                                        <div className="member-name" style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>
                                            {member.user?.username || member.username || 'Member'}
                                        </div>
                                        <div className="member-email" style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                                            {member.user?.email || member.email || ''}
                                        </div>
                                        <div className="member-role" style={{ fontSize: '11px', color: '#6366f1', fontWeight: '500' }}>
                                            {member.role || 'Member'}
                                        </div>
                                    </div>
                                    {isOwner && (
                                        <button
                                            className="remove-member-btn"
                                            onClick={() => handleRemoveMember(member._id || member.user?._id)}
                                            title="Remove member"
                                            style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {(!project?.members || project.members.length === 0) && (
                                <div className="no-members">
                                    <p>No additional members yet.</p>
                                    {isOwner && (
                                        <p>Invite team members to collaborate on this project.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectMembersModal;