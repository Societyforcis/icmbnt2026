import express from 'express';
import Committee from '../models/Committee.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// PUBLIC ROUTES

// Get all active committee members
router.get('/', async (req, res) => {
    try {
        const { role } = req.query;

        const query = { active: true };
        if (role && role !== 'all') {
            query.role = role;
        }

        const members = await Committee.find(query).sort({ order: 1, createdAt: 1 });

        res.json({
            success: true,
            count: members.length,
            members
        });
    } catch (error) {
        console.error('Error fetching committee members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch committee members',
            error: error.message
        });
    }
});

// Get single committee member by ID
router.get('/:id', async (req, res) => {
    try {
        const member = await Committee.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Committee member not found'
            });
        }

        res.json({
            success: true,
            member
        });
    } catch (error) {
        console.error('Error fetching committee member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch committee member',
            error: error.message
        });
    }
});

// ADMIN ROUTES

// Get all committee members (including inactive) - Admin only
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const members = await Committee.find().sort({ order: 1, createdAt: 1 });

        res.json({
            success: true,
            count: members.length,
            members
        });
    } catch (error) {
        console.error('Error fetching all committee members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch committee members',
            error: error.message
        });
    }
});

// Create new committee member - Admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {
            name,
            role,
            affiliation,
            country,
            designation,
            image,
            links,
            order,
            active
        } = req.body;

        // Validation
        if (!name || !role || !affiliation) {
            return res.status(400).json({
                success: false,
                message: 'Name, role, and affiliation are required'
            });
        }

        const newMember = new Committee({
            name,
            role,
            affiliation,
            country,
            designation,
            image,
            links,
            order: order || 0,
            active: active !== undefined ? active : true
        });

        await newMember.save();

        console.log('✅ Committee member created:', newMember.name);

        res.status(201).json({
            success: true,
            message: 'Committee member created successfully',
            member: newMember
        });
    } catch (error) {
        console.error('Error creating committee member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create committee member',
            error: error.message
        });
    }
});

// Update committee member - Admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {
            name,
            role,
            affiliation,
            country,
            designation,
            image,
            links,
            order,
            active
        } = req.body;

        const member = await Committee.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Committee member not found'
            });
        }

        // Update fields
        if (name) member.name = name;
        if (role) member.role = role;
        if (affiliation) member.affiliation = affiliation;
        if (country !== undefined) member.country = country;
        if (designation !== undefined) member.designation = designation;
        if (image) member.image = image;
        if (links) member.links = links;
        if (order !== undefined) member.order = order;
        if (active !== undefined) member.active = active;

        await member.save();

        console.log('✅ Committee member updated:', member.name);

        res.json({
            success: true,
            message: 'Committee member updated successfully',
            member
        });
    } catch (error) {
        console.error('Error updating committee member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update committee member',
            error: error.message
        });
    }
});

// Delete committee member - Admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const member = await Committee.findByIdAndDelete(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Committee member not found'
            });
        }

        console.log('✅ Committee member deleted:', member.name);

        res.json({
            success: true,
            message: 'Committee member deleted successfully',
            member
        });
    } catch (error) {
        console.error('Error deleting committee member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete committee member',
            error: error.message
        });
    }
});

// Toggle active status - Admin only
router.patch('/:id/toggle-active', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const member = await Committee.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Committee member not found'
            });
        }

        member.active = !member.active;
        await member.save();

        console.log(`✅ Committee member ${member.active ? 'activated' : 'deactivated'}:`, member.name);

        res.json({
            success: true,
            message: `Committee member ${member.active ? 'activated' : 'deactivated'} successfully`,
            member
        });
    } catch (error) {
        console.error('Error toggling committee member status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle committee member status',
            error: error.message
        });
    }
});

export default router;
