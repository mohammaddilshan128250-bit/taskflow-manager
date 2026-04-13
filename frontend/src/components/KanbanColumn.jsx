import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FiPlus } from 'react-icons/fi';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';

const KanbanColumn = ({ column, tasks, projectId, onEditTask }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    const taskIds = tasks.map(task => task._id);

    return (
        <div className="kanban-column">
            <div className="column-header">
                <div className="column-title">
                    <div
                        className="column-indicator"
                        style={{ backgroundColor: column.color }}
                    ></div>
                    <h3>{column.title}</h3>
                    <span className="task-count">{tasks.length}</span>
                </div>
                <button
                    className="add-task-btn"
                    onClick={() => setShowCreateModal(true)}
                    title={`Add task to ${column.title}`}
                >
                    <FiPlus />
                </button>
            </div>

            <div
                ref={setNodeRef}
                className="column-content"
                style={{ minHeight: '200px', position: 'relative' }}
            >
                <SortableContext
                    items={taskIds}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.length === 0 ? (
                        <div className="empty-column" style={{
                            height: '100%',
                            minHeight: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '2px dashed #e5e7eb',
                            borderRadius: '8px',
                            margin: '8px 0'
                        }}>
                            <p style={{ margin: '8px 0', color: '#6b7280' }}>No tasks yet</p>
                            <button
                                className="create-first-task-btn"
                                onClick={() => setShowCreateModal(true)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '14px',
                                    color: '#6b7280'
                                }}
                            >
                                <FiPlus />
                                Add Task
                            </button>
                        </div>
                    ) : (
                        <>
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onEdit={onEditTask}
                                />
                            ))}
                            {/* Add a drop zone at the bottom of the column */}
                            <div
                                className="column-drop-zone"
                                style={{
                                    height: '60px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#9ca3af',
                                    fontSize: '12px',
                                    borderRadius: '6px',
                                    margin: '8px 0'
                                }}
                            >
                                Drop tasks here
                            </div>
                        </>
                    )}
                </SortableContext>
            </div>

            {showCreateModal && (
                <CreateTaskModal
                    projectId={projectId}
                    defaultColumn={column.id}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
        </div>
    );
};

export default KanbanColumn;