import { logger } from '../logger';
import { createConnection } from 'net';
// PHASE 3: 100MB file size limit for virus scanning
const MAX_SCAN_SIZE = 100 * 1024 * 1024; // 100MB
/**
 * Virus scanning middleware for file uploads in production
 * Integrates with ClamAV when enabled
 */
export async function virusScanMiddleware(req, res, next) {
    // Only run in production when virus scanning is enabled
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_VIRUS_SCAN !== 'true') {
        return next();
    }
    try {
        // Check if files were uploaded
        if (!req.file && !req.files) {
            return next();
        }
        const filesToScan = [];
        if (req.file) {
            filesToScan.push(req.file);
        }
        else if (req.files) {
            if (Array.isArray(req.files)) {
                filesToScan.push(...req.files);
            }
            else {
                Object.values(req.files).forEach(files => {
                    if (Array.isArray(files)) {
                        filesToScan.push(...files);
                    }
                });
            }
        }
        // Scan each file
        for (const file of filesToScan) {
            // PHASE 3: Check file size - skip scanning if > 100MB
            if (file.size > MAX_SCAN_SIZE) {
                logger.warn('File exceeds scan size limit, rejecting upload', {
                    filename: file.originalname,
                    size: file.size,
                    limit: MAX_SCAN_SIZE,
                });
                return res.status(413).json({
                    error: 'File too large for virus scanning',
                    code: 'FILE_TOO_LARGE',
                    maxSize: MAX_SCAN_SIZE,
                    filename: file.originalname,
                });
            }
            const scanResult = await scanFile(file);
            if (scanResult.infected) {
                logger.warn('Virus detected in uploaded file', {
                    filename: file.originalname,
                    virus: scanResult.virusName,
                    userId: req.user?.id,
                });
                return res.status(400).json({
                    error: 'Virus detected in uploaded file',
                    code: 'VIRUS_DETECTED',
                    filename: file.originalname,
                });
            }
        }
        next();
    }
    catch (error) {
        logger.error('Virus scanning failed', error instanceof Error ? error : undefined);
        // In production, fail closed - reject upload if scan fails
        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({
                error: 'Unable to verify file safety',
                code: 'SCAN_FAILED',
            });
        }
        // In development, allow through but log error
        next();
    }
}
/**
 * Scan a file using ClamAV - FIXED: Create fresh connection per scan to avoid pooling issues
 */
async function scanFile(file) {
    const host = process.env.CLAMAV_HOST || 'localhost';
    const port = parseInt(process.env.CLAMAV_PORT || '3310', 10);
    return new Promise((resolve, reject) => {
        // ARCHITECT FIX: Create fresh connection per scan instead of pooling
        const socket = createConnection({ host, port });
        let response = '';
        let hasResolved = false;
        const cleanupAndResolve = (result) => {
            if (hasResolved)
                return;
            hasResolved = true;
            socket.destroy();
            resolve(result);
        };
        const cleanupAndReject = (error) => {
            if (hasResolved)
                return;
            hasResolved = true;
            socket.destroy();
            reject(error);
        };
        socket.on('connect', () => {
            try {
                // Send INSTREAM command
                socket.write('zINSTREAM\0');
                // Send file data in chunks
                const buffer = file.buffer;
                const chunkSize = 4096;
                for (let i = 0; i < buffer.length; i += chunkSize) {
                    const chunk = buffer.subarray(i, Math.min(i + chunkSize, buffer.length));
                    const sizeBuffer = Buffer.alloc(4);
                    sizeBuffer.writeUInt32BE(chunk.length, 0);
                    socket.write(sizeBuffer);
                    socket.write(chunk);
                }
                // Send end of stream
                socket.write(Buffer.from([0, 0, 0, 0]));
            }
            catch (err) {
                cleanupAndReject(err instanceof Error ? err : new Error('Failed to send data to ClamAV'));
            }
        });
        socket.on('data', (data) => {
            response += data.toString();
        });
        socket.on('end', () => {
            if (response.includes('FOUND')) {
                const virusName = response.split(':')[1]?.trim().replace(' FOUND', '');
                cleanupAndResolve({ infected: true, virusName });
            }
            else if (response.includes('OK')) {
                cleanupAndResolve({ infected: false });
            }
            else {
                cleanupAndReject(new Error(`Unexpected ClamAV response: ${response}`));
            }
        });
        socket.on('error', (error) => {
            cleanupAndReject(error);
        });
        socket.setTimeout(30000, () => {
            cleanupAndReject(new Error('ClamAV scan timeout'));
        });
    });
}
