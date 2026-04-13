import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { FiX, FiSave, FiType, FiFileText, FiFlag, FiCalendar } from 'react-icons/fi';

const EditTaskModal = ({ task, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: ''
    });
    const [errors, setErrors] = useState({});
    const { updateTask, isLoading } = useProject();

    const priorityOptions = [
        { value: 'low', label: 'Low', color: '#22c55e' },
        { value: 'medium', label: 'Medium', color: '#eab308' },
        { value: 'high', label: 'High', color: '#f97316' },
        { value: 'urgent', label: 'Urgent', color: '#ef4444' }
    ];

    // Initialize form data when task prop changes
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'medium',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                tags: task.tags ? task.tags.join(', ') : ''
            });
        }
    }, [task]);

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
            newErrors.title = 'Task title is required';
        } else if (formData.title.trim().length > 200) {
            newErrors.title = 'Task title must be less than 200 characters';
        }

        if (formData.description.length > 1000) {
            newErrors.description = 'Description must be less than 1000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const taskData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            dueDate: formData.dueDate || null,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };

        const result = await updateTask(task._id, taskData);

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

    if (!task) return null;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiSave />
                        Edit Task
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
                            Task Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter task title"
                            className={errors.title ? 'error' : ''}
                            maxLength={200}
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
                            placeholder="Describe the task"
                            className={errors.description ? 'error' : ''}
                            rows={3}
                            maxLength={1000}
                        />
                        <div className="char-count">
                            {formData.description.length}/1000
                        </div>
                        {errors.description && (
                            <span className="field-error">{errors.description}</span>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="priority">
                                <FiFlag />
                                Priority
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                {priorityOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="dueDate">
                                <FiCalendar />
                                Due Date (Optional)
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="tags">
                            Tags (Optional)
                        </label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            placeholder="Enter tags separated by commas"
                        />
                        <small className="form-help">
                            Separate multiple tags with commas (e.g., frontend, urgent, bug)
                        </small>
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

export default EditTaskModal;