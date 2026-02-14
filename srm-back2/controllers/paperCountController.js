
export const getPaperCounts = async (req, res) => {
    try {
        const [mainCount, multiCount, selectedCount] = await Promise.all([
            PaperSubmission.countDocuments(),
            MultiplePaperSubmission.countDocuments(),
            (await import('../models/ConferenceSelectedUser.js')).default.countDocuments()
        ]);

        return res.status(200).json({
            success: true,
            counts: {
                main: mainCount,
                multiple: multiCount,
                selected: selectedCount,
                total: mainCount + multiCount
            }
        });
    } catch (error) {
        console.error('Error fetching paper counts:', error);
        return res.status(500).json({ success: false, message: 'Error fetching paper counts' });
    }
};
