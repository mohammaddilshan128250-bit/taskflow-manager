import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    FiCalendar,
    FiUser,
    FiMessageCircle,
    FiPaperclip,
    FiEdit,
    FiTrash2,
    FiClock
} from 'react-icons/fi';
import { useProject } from '../context/ProjectContext';

const TaskCard = ({ task, isDragging = false, onEdit }) => {
    const { deleteTask } = useProject();
    const [showActions, setShowActions] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || isSortableDragging ? 0.5 : 1,
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#eab308';
            case 'low': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(task._id);
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(task);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`task-card ${isDragging ? 'dragging' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="task-header">
                <div
                    className="priority-indicator"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                    title={`Priority: ${task.priority}`}
                ></div>

                {showActions && (
                    <div className="task-actions" style={{ pointerEvents: 'auto' }}>
                        <button
                            className="task-action-btn"
                            onClick={handleEdit}
                            title="Edit task"
                            style={{ pointerEvents: 'auto' }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <FiEdit />
                        </button>
                        <button
                            className="task-action-btn delete"
                            onClick={handleDelete}
                            title="Delete task"
                            style={{ pointerEvents: 'auto' }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                )}
            </div>

            <div className="task-content">
                <h4 className="task-title">{task.title}</h4>
                {task.description && (
                    <p className="task-description">{task.description}</p>
                )}
            </div>

            <div className="task-footer">
                <div className="task-meta">
                    {task.dueDate && (
                        <div className={`task-due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                            <FiCalendar />
                            <span>{formatDate(task.dueDate)}</span>
                        </div>
                    )}

                    {task.assignee && (
                        <div className="task-assignee" title={`Assigned to ${task.assignee.username}`}>
                            <FiUser />
                            <span>{task.assignee.username}</span>
                        </div>
                    )}
                </div>

                <div className="task-indicators">
                    {task.comments && task.comments.length > 0 && (
                        <div className="task-indicator">
                            <FiMessageCircle />
                            <span>{task.comments.length}</span>
                        </div>
                    )}

                    {task.attachments && task.attachments.length > 0 && (
                        <div className="task-indicator">
                            <FiPaperclip />
                            <span>{task.attachments.length}</span>
                        </div>
                    )}
                </div>
            </div>

            {task.tags && task.tags.length > 0 && (
                <div className="task-tags">
                    {task.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="task-tag">
                            {tag}
                        </span>
                    ))}
                    {task.tags.length > 3 && (
                        <span className="task-tag more">
                            +{task.tags.length - 3}
                        </span>
                    )}
                </div>
            )}


        </div>
    );
};

export default TaskCard;