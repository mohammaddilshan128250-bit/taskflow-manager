import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
// Note: @dnd-kit/modifiers is not included in @dnd-kit/core
// We'll implement our own simple modifiers instead

// Simple vertical axis restriction modifier
const restrictToVerticalAxis = ({ transform }) => {
    return {
        ...transform,
        x: 0
    };
};

// Simple window edges restriction modifier
const restrictToWindowEdges = ({ transform }) => {
    return transform; // Simplified version - in a real app we'd add boundary checks
};

import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import EditTaskModal from './EditTaskModal';
import { useProject } from '../context/ProjectContext';

const KanbanBoard = ({ projectId }) => {
    const { tasks, loadTasks, moveTask, isLoadingTasks } = useProject();
    const [activeTask, setActiveTask] = useState(null);
    const [editingTask, setEditingTask] = useState(null);

    // Default columns
    const columns = [
        { id: 'todo', title: 'To Do', color: '#6b7280' },
        { id: 'in-progress', title: 'In Progress', color: '#f59e0b' },
        { id: 'review', title: 'Review', color: '#8b5cf6' },
        { id: 'done', title: 'Done', color: '#10b981' }
    ];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (projectId) {
            loadTasks(projectId);
        }
    }, [projectId]);

    // Group tasks by column
    const tasksByColumn = tasks.reduce((acc, task) => {
        if (!acc[task.column]) {
            acc[task.column] = [];
        }
        acc[task.column].push(task);
        return acc;
    }, {});

    // Sort tasks by order within each column
    Object.keys(tasksByColumn).forEach(columnId => {
        tasksByColumn[columnId].sort((a, b) => a.order - b.order);
    });

    const handleDragStart = (event) => {
        const { active } = event;
        const task = tasks.find(t => t._id === active.id);
        setActiveTask(task);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        // Optional: Add visual feedback when dragging over different areas
        console.log('Dragging over:', { activeId: active.id, overId: over.id });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeTask = tasks.find(t => t._id === active.id);
        if (!activeTask) return;

        const overId = over.id;
        let newColumn = activeTask.column;
        let newIndex = 0;

        console.log('Drag ended:', { activeId: active.id, overId, activeTask });

        // Check if dropped over a column (empty area)
        const targetColumn = columns.find(col => col.id === overId);
        if (targetColumn) {
            newColumn = overId;
            newIndex = tasksByColumn[newColumn]?.length || 0;
            console.log('Dropped on column:', { newColumn, newIndex });
        } else {
            // Dropped over a task
            const overTask = tasks.find(t => t._id === overId);
            if (overTask) {
                newColumn = overTask.column;
                const columnTasks = tasksByColumn[newColumn] || [];

                // Find the index where we want to insert
                const overTaskIndex = columnTasks.findIndex(t => t._id === overId);

                if (activeTask.column === newColumn) {
                    // Moving within the same column - REORDERING
                    const activeTaskIndex = columnTasks.findIndex(t => t._id === activeTask._id);

                    console.log('REORDERING DEBUG:', {
                        activeTaskIndex,
                        overTaskIndex,
                        columnTasks: columnTasks.map(t => ({ id: t._id, title: t.title, order: t.order }))
                    });

                    if (activeTaskIndex < overTaskIndex) {
                        // Moving down - insert after the target (but account for removing the active task)
                        newIndex = overTaskIndex - 1;
                    } else {
                        // Moving up - insert before the target
                        newIndex = overTaskIndex;
                    }

                    console.log('REORDERING RESULT:', { activeTaskIndex, overTaskIndex, newIndex });
                } else {
                    // Moving to different column - insert before the target
                    newIndex = overTaskIndex;
                }

                console.log('Dropped on task:', { newColumn, newIndex, overTaskIndex });
            }
        }

        // Only proceed if something actually changed
        if (newColumn && (activeTask.column !== newColumn || newIndex !== undefined)) {
            console.log('Moving task:', { taskId: activeTask._id, from: activeTask.column, to: newColumn, index: newIndex });

            // Call moveTask without awaiting for instant UI feedback
            moveTask(activeTask._id, newColumn, newIndex).catch(error => {
                console.error('Failed to move task:', error);
            });
        }
    };

    if (isLoadingTasks) {
        return (
            <div className="kanban-loading">
                <div className="loading-spinner large"></div>
                <p>Loading tasks...</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="kanban-board">
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        tasks={tasksByColumn[column.id] || []}
                        projectId={projectId}
                        onEditTask={setEditingTask}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <TaskCard task={activeTask} isDragging />
                ) : null}
            </DragOverlay>

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </DndContext>
    );
};

export default KanbanBoard;