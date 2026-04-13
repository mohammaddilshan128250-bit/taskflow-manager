import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { FiX, FiFolder, FiType, FiFileText } from 'react-icons/fi';

const CreateProjectModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        color: '#667eea'
    });
    const [errors, setErrors] = useState({});
    const { createProject, isLoading } = useProject();

    const colorOptions = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
        '#ff9a9e', '#fecfef', '#ffeaa7', '#fab1a0'
    ];

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

    const handleColorSelect = (color) => {
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

        const result = await createProject({
            title: formData.title.trim(),
            description: formData.description.trim(),
            color: formData.color
        });

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

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiFolder />
                        Create New Project
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
                        <label>Project Color</label>
                        <div className="color-picker">
                            {colorOptions.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                    title={color}
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FiFolder />
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;