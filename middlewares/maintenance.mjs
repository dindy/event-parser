import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.resolve('./logs');
const DEBUG_DIR = path.resolve('./debug');
const DAYS_OLD = 5;

function deleteOldFiles(dir, daysOld) {
	const now = Date.now();
	const cutoff = now - daysOld * 24 * 60 * 60 * 1000;
	fs.readdirSync(dir).forEach(file => {
		const filePath = path.join(dir, file);
		try {
			const stats = fs.statSync(filePath);
			if (stats.isFile() && stats.mtimeMs < cutoff) {
				fs.unlinkSync(filePath);
			}
		} catch (err) {
			throw err
		}
	});
}

export const cleanUpLogs = (req, res) => {
    try {
        deleteOldFiles(LOGS_DIR, DAYS_OLD);
        deleteOldFiles(DEBUG_DIR, DAYS_OLD);
        res.status(200).json({ message: 'Old log and debug files cleaned.' });
    } catch (err) {
        res.status(500).json({ message: `${err.name} : ${err.message}` });
    }
}