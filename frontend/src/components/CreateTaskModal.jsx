import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { FiX, FiPlus, FiType, FiFileText, FiFlag, FiCalendar, FiUser } from 'react-icons/fi';

const CreateTaskModal = ({ projectId, defaultColumn = 'todo', onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: ''
    });
    const [errors, setErrors] = useState({});
    const { createTask, isLoading } = useProject();

    const priorityOptions = [
        { value: 'low', label: 'Low', color: '#22c55e' },
        { value: 'medium', label: 'Medium', color: '#eab308' },
        { value: 'high', label: 'High', color: '#f97316' },
        { value: 'urgent', label: 'Urgent', color: '#ef4444' }
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
            project: projectId,
            column: defaultColumn,
            priority: formData.priority,
            dueDate: formData.dueDate || null,
            tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        };

        const result = await createTask(taskData);

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
                        <FiPlus />
                        Create New Task
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FiPlus />
                                    Create Task
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;