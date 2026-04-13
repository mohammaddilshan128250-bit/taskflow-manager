import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    column: {
        type: String,
        required: true,
        default: 'todo'
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    dueDate: {
        type: Date
    },
    tags: [{
        type: String,
        trim: true
    }],
    order: {
        type: Number,
        default: 0
    },
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for better performance
taskSchema.index({ project: 1, column: 1, order: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ dueDate: 1 });

// Update completedAt when status changes to completed
taskSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        } else if (this.status !== 'completed') {
            this.completedAt = null;
        }
    }
    next();
});

const Task = mongoose.model('Task', taskSchema);
export default Task;