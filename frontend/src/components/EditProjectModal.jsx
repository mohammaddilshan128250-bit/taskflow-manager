import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiType, FiFileText } from 'react-icons/fi';
import { useProject } from '../context/ProjectContext';

const EditProjectModal = ({ project, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        color: '#667eea'
    });
    const [errors, setErrors] = useState({});
    const { updateProject, isLoading } = useProject();

    const colorOptions = [
        { name: 'Purple', value: '#667eea' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Green', value: '#10b981' },
        { name: 'Orange', value: '#f59e0b' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Pink', value: '#ec4899' },
        { name: 'Indigo', value: '#6366f1' },
        { name: 'Teal', value: '#14b8a6' }
    ];

    // Initialize form data when project prop changes
    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title || '',
                description: project.description || '',
                color: project.color || '#667eea'
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

    const handleColorChange = (color) => {
        setFormData(prev => ({
            ...prev,
            color
        }));
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
            description: formData.description.trim(),
            color: formData.color
        };

        const result = await updateProject(project._id, projectData);

        if (result.success) {
            onClose();
        } else {
            setErrors({ submit: result.error });
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!project) return null;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiSave />
                        Edit Project
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {errors.submit && (
                        <div className="error-message">
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
                        />
                        <div className="char-count">
                            {formData.description.length}/500
                        </div>
                        {errors.description && (
                            <span className="field-error">{errors.description}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>
                            Project Color
                        </label>
                        <div className="color-options">
                            {colorOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`color-option ${formData.color === option.value ? 'selected' : ''}`}
                                    style={{ backgroundColor: option.value }}
                                    onClick={() => handleColorChange(option.value)}
                                    title={option.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
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
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProjectModal;