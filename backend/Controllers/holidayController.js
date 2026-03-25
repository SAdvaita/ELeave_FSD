import Holiday from "../Models/Holiday.js";

// Get all holidays
export const getHolidays = async (req, res) => {
    try {
        const { year } = req.query;
        let filter = {};
        if (year) {
            const y = parseInt(year);
            filter.date = {
                $gte: new Date(`${y}-01-01`),
                $lte: new Date(`${y}-12-31`)
            };
        }
        const holidays = await Holiday.find(filter)
            .populate('createdBy', 'name')
            .sort({ date: 1 });
        res.status(200).json({ holidays });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Add a holiday (Manager/HR only)
export const addHoliday = async (req, res) => {
    const { name, date, type, description, isRecurring } = req.body;
    try {
        if (!name || !date) {
            return res.status(400).json({ message: "Name and date are required" });
        }
        const holiday = await Holiday.create({
            name, date, type: type || 'national',
            description, isRecurring, createdBy: req.user._id
        });
        res.status(201).json({ message: "Holiday added successfully", holiday });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete a holiday (Manager/HR only)
export const deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findByIdAndDelete(req.params.id);
        if (!holiday) return res.status(404).json({ message: "Holiday not found" });
        res.status(200).json({ message: "Holiday deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Seed default holidays for current year
export const seedDefaultHolidays = async (req, res) => {
    const year = new Date().getFullYear();
    const defaults = [
        { name: "New Year's Day", date: `${year}-01-01`, type: 'national' },
        { name: "Republic Day", date: `${year}-01-26`, type: 'national' },
        { name: "Holi", date: `${year}-03-17`, type: 'national' },
        { name: "Good Friday", date: `${year}-04-18`, type: 'national' },
        { name: "Eid ul-Fitr", date: `${year}-03-31`, type: 'national' },
        { name: "Independence Day", date: `${year}-08-15`, type: 'national' },
        { name: "Gandhi Jayanti", date: `${year}-10-02`, type: 'national' },
        { name: "Dussehra", date: `${year}-10-02`, type: 'national' },
        { name: "Diwali", date: `${year}-10-20`, type: 'national' },
        { name: "Christmas Day", date: `${year}-12-25`, type: 'national' },
    ];

    try {
        let added = 0;
        for (const h of defaults) {
            const exists = await Holiday.findOne({ name: h.name, date: new Date(h.date) });
            if (!exists) {
                await Holiday.create({ ...h, createdBy: req.user._id });
                added++;
            }
        }
        res.status(200).json({ message: `${added} holidays seeded successfully` });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
