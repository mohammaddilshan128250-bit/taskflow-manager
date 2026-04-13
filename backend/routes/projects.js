import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { authenticateToken } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all user projects
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const projects = await Project.find({
            $or: [
                { owner: req.user._id },
                { 'members.user': req.user._id }
            ]
        })
            .populate('owner', 'username email')
            .populate('members.user', 'username email')
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            data: { projects }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting projects'
        });
    }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'username email')
            .populate('members.user', 'username email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user has access to this project
        const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
            project.members.some(member => member.user._id.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this project'
            });
        }

        res.json({
            success: true,
            data: { project }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting project'
        });
    }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, description, color } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Project title is required'
            });
        }

        if (title.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Project title must be less than 100 characters'
            });
        }

        // Create project
        const project = new Project({
            title: title.trim(),
            description: description?.trim() || '',
            owner: req.user._id,
            color: color || '#667eea',
            members: [{
                user: req.user._id,
                role: 'owner'
            }]
        });

        await project.save();

        // Populate the project before sending response
        await project.populate('owner', 'username email');
        await project.populate('members.user', 'username email');

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { project }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating project'
        });
    }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { title, description, color } = req.body;
        const projectId = req.params.id;

        // Find project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user is owner or admin
        const userMember = project.members.find(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Only project owners and admins can update projects'
            });
        }

        // Validation
        if (title && title.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Project title must be less than 100 characters'
            });
        }

        // Update project
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (color) updateData.color = color;

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('owner', 'username email')
            .populate('members.user', 'username email');

        // Emit real-time update
        io.to(projectId).emit('project-updated', updatedProject);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: { project: updatedProject }
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating project'
        });
    }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;

        // Find project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only project owners can delete projects'
            });
        }

        // Delete all tasks in this project
        await Task.deleteMany({ project: projectId });

        // Delete project
        await Project.findByIdAndDelete(projectId);

        // Emit real-time update
        io.to(projectId).emit('project-deleted', projectId);

        res.json({
            success: true,
            message: 'Project and all associated tasks deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting project'
        });
    }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private
router.post('/:id/members', authenticateToken, async (req, res) => {
    try {
        const { email, role = 'member' } = req.body;
        const projectId = req.params.id;

        // Find project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user is owner or admin
        const userMember = project.members.find(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Only project owners and admins can add members'
            });
        }

        // Find user to add
        const userToAdd = await User.findOne({ email: email.toLowerCase() });
        if (!userToAdd) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Check if user is already a member
        const existingMember = project.members.find(
            member => member.user.toString() === userToAdd._id.toString()
        );

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member of this project'
            });
        }

        // Add member
        project.members.push({
            user: userToAdd._id,
            role: role
        });

        await project.save();
        await project.populate('members.user', 'username email');

        // Emit real-time update
        io.to(projectId).emit('member-added', {
            member: {
                user: userToAdd,
                role: role
            }
        });

        res.json({
            success: true,
            message: 'Member added successfully',
            data: { project }
        });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding member'
        });
    }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        const { id: projectId, userId } = req.params;

        // Find project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user is owner or admin
        const userMember = project.members.find(
            member => member.user.toString() === req.user._id.toString()
        );

        if (!userMember || (userMember.role !== 'owner' && userMember.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Only project owners and admins can remove members'
            });
        }

        // Can't remove the owner
        if (project.owner.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove project owner'
            });
        }

        // Remove member
        project.members = project.members.filter(
            member => member.user.toString() !== userId
        );

        await project.save();

        // Emit real-time update
        io.to(projectId).emit('member-removed', { userId });

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error removing member'
        });
    }
});

// @route   POST /api/projects/:id/join
// @desc    Join project (self-add)
// @access  Private
router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id;

        // Find project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if user is already a member
        const existingMember = project.members.find(
            member => member.user.toString() === req.user._id.toString()
        );

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this project'
            });
        }

        // Check if user is the owner
        if (project.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You are already the owner of this project'
            });
        }

        // Add user as member
        project.members.push({
            user: req.user._id,
            role: 'member'
        });

        await project.save();
        await project.populate('members.user', 'username email');

        // Emit real-time update
        io.to(projectId).emit('member-added', {
            project,
            newMember: {
                user: req.user,
                role: 'member'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Successfully joined the project',
            data: { project }
        });
    } catch (error) {
        console.error('Join project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error joining project'
        });
    }
});

export default router;