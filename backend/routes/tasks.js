import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { authenticateToken } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;

        // Check if user has access to this project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this project'
            });
        }

        // Get tasks
        const tasks = await Task.find({ project: projectId })
            .populate('assignee', 'username email')
            .populate('creator', 'username email')
            .sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: { tasks }
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting tasks'
        });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignee', 'username email')
            .populate('creator', 'username email')
            .populate('project', 'title');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if user has access to this task's project
        const project = await Project.findById(task.project._id);
        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this task'
            });
        }

        res.json({
            success: true,
            data: { task }
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting task'
        });
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, project, column, assignee, priority, dueDate, tags } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        if (!project) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        // Check if user has access to this project
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const hasAccess = projectDoc.owner.toString() === req.user._id.toString() ||
            projectDoc.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this project'
            });
        }

        // Get the highest order number for this column
        const lastTask = await Task.findOne({ project, column: column || 'todo' })
            .sort({ order: -1 });
        const order = lastTask ? lastTask.order + 1 : 0;

        // Create task
        const task = new Task({
            title: title.trim(),
            description: description?.trim() || '',
            project,
            column: column || 'todo',
            assignee: assignee || null,
            creator: req.user._id,
            priority: priority || 'medium',
            dueDate: dueDate || null,
            tags: tags || [],
            order
        });

        await task.save();

        // Populate the task before sending response
        await task.populate('assignee', 'username email');
        await task.populate('creator', 'username email');

        // Emit real-time update
        io.to(project).emit('task-created', task);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { task }
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating task'
        });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title, description, column, assignee, priority, dueDate, tags, status } = req.body;

        // Find task
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if user has access to this project
        const project = await Project.findById(task.project._id);
        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this task'
            });
        }

        // Build update object
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (column !== undefined) updateData.column = column;
        if (assignee !== undefined) updateData.assignee = assignee;
        if (priority !== undefined) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate;
        if (tags !== undefined) updateData.tags = tags;
        if (status !== undefined) updateData.status = status;

        // Update task
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('assignee', 'username email')
            .populate('creator', 'username email');

        // Emit real-time update
        io.to(task.project._id.toString()).emit('task-updated', updatedTask);

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: { task: updatedTask }
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating task'
        });
    }
});

// @route   PUT /api/tasks/:id/move
// @desc    Move task to different column/position
// @access  Private
router.put('/:id/move', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { column, order, destinationIndex } = req.body;

        // Find task
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if user has access to this project
        const project = await Project.findById(task.project._id);
        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this task'
            });
        }

        const oldColumn = task.column;
        const newColumn = column;

        // Update task column
        task.column = newColumn;
        task.order = destinationIndex;
        await task.save();

        // Update order of other tasks in both columns
        if (oldColumn === newColumn) {
            // Moving within same column - need to reorder all tasks properly
            const allTasks = await Task.find({
                project: task.project._id,
                column: newColumn
            }).sort({ order: 1 });

            // Remove the moved task from the array
            const otherTasks = allTasks.filter(t => t._id.toString() !== taskId);

            // Insert the moved task at the new position
            otherTasks.splice(destinationIndex, 0, task);

            // Update all tasks with their new order
            for (let i = 0; i < otherTasks.length; i++) {
                if (otherTasks[i].order !== i) {
                    otherTasks[i].order = i;
                    await otherTasks[i].save();
                }
            }
        } else {
            // Moving between different columns
            // Update old column orders
            const oldColumnTasks = await Task.find({
                project: task.project._id,
                column: oldColumn
            }).sort({ order: 1 });

            for (let i = 0; i < oldColumnTasks.length; i++) {
                oldColumnTasks[i].order = i;
                await oldColumnTasks[i].save();
            }

            // Update new column orders
            const newColumnTasks = await Task.find({
                project: task.project._id,
                column: newColumn,
                _id: { $ne: taskId }
            }).sort({ order: 1 });

            for (let i = 0; i < newColumnTasks.length; i++) {
                const newOrder = i >= destinationIndex ? i + 1 : i;
                if (newColumnTasks[i].order !== newOrder) {
                    newColumnTasks[i].order = newOrder;
                    await newColumnTasks[i].save();
                }
            }
        }

        // Get updated task
        const updatedTask = await Task.findById(taskId)
            .populate('assignee', 'username email')
            .populate('creator', 'username email');

        // Emit real-time update
        io.to(task.project._id.toString()).emit('task-moved', {
            task: updatedTask,
            oldColumn,
            newColumn
        });

        res.json({
            success: true,
            message: 'Task moved successfully',
            data: { task: updatedTask }
        });
    } catch (error) {
        console.error('Move task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error moving task'
        });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;

        // Find task
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if user has access to this project
        const project = await Project.findById(task.project._id);
        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this task'
            });
        }

        // Delete task
        await Task.findByIdAndDelete(taskId);

        // Update order of remaining tasks in the column
        const remainingTasks = await Task.find({
            project: task.project._id,
            column: task.column
        }).sort({ order: 1 });

        for (let i = 0; i < remainingTasks.length; i++) {
            if (remainingTasks[i].order !== i) {
                remainingTasks[i].order = i;
                await remainingTasks[i].save();
            }
        }

        // Emit real-time update
        io.to(task.project._id.toString()).emit('task-deleted', taskId);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting task'
        });
    }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add comment to task
// @access  Private
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        // Find task
        const task = await Task.findById(taskId).populate('project');
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if user has access to this project
        const project = await Project.findById(task.project._id);
        const hasAccess = project.owner.toString() === req.user._id.toString() ||
            project.members.some(member => member.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this task'
            });
        }

        // Add comment
        const comment = {
            user: req.user._id,
            text: text.trim(),
            createdAt: new Date()
        };

        task.comments.push(comment);
        await task.save();

        // Populate the new comment
        await task.populate('comments.user', 'username email');
        const newComment = task.comments[task.comments.length - 1];

        // Emit real-time update
        io.to(task.project._id.toString()).emit('comment-added', {
            taskId,
            comment: newComment
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment: newComment }
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding comment'
        });
    }
});

export default router;