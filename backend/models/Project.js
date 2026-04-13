import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member'],
            default: 'member'
        }
    }],
    columns: [{
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        order: {
            type: Number,
            required: true
        }
    }],
    color: {
        type: String,
        default: '#5865f2'
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Default columns for new projects
projectSchema.pre('save', function (next) {
    if (this.isNew && this.columns.length === 0) {
        this.columns = [
            { id: 'todo', title: 'To Do', order: 0 },
            { id: 'in-progress', title: 'In Progress', order: 1 },
            { id: 'review', title: 'Review', order: 2 },
            { id: 'done', title: 'Done', order: 3 }
        ];
    }
    next();
});

const Project = mongoose.model('Project', projectSchema);
export default Project;