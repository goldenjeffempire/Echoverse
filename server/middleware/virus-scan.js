import fs from 'fs';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);
const DANGEROUS_SIGNATURES = [
    { hex: '4D5A', description: 'PE/EXE executable' },
];
const SAFE_ZIP_BASED_FORMATS = [
    '.docx', '.xlsx', '.pptx', // Microsoft Office
    '.odt', '.ods', '.odp', // OpenDocument
    '.jar', '.apk' // Java/Android (might be legitimate in some contexts)
];
export const basicVirusScan = async (req, res, next) => {
    if (!req.file && !req.files) {
        return next();
    }
    try {
        const files = req.file ? [req.file] : req.files;
        for (const file of files) {
            const buffer = await readFile(file.path);
            for (const signature of DANGEROUS_SIGNATURES) {
                const sigBuffer = Buffer.from(signature.hex, 'hex');
                if (buffer.includes(sigBuffer)) {
                    fs.unlinkSync(file.path);
                    return res.status(400).json({
                        error: `File appears to contain potentially malicious content: ${signature.description}`,
                        code: 'VIRUS_DETECTED'
                    });
                }
            }
            const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
            const isExecutable = /\.(exe|bat|cmd|sh|ps1|scr|com|pif|msi)$/i.test(file.originalname);
            if (isExecutable) {
                fs.unlinkSync(file.path);
                return res.status(400).json({
                    error: 'Executable files are not allowed',
                    code: 'FORBIDDEN_FILE_TYPE'
                });
            }
            const isScript = /\.(js|vbs|wsf|hta)$/i.test(file.originalname) &&
                !SAFE_ZIP_BASED_FORMATS.includes(extension);
            if (isScript) {
                fs.unlinkSync(file.path);
                return res.status(400).json({
                    error: 'Script files are not allowed',
                    code: 'FORBIDDEN_FILE_TYPE'
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Virus scan error:', error);
        return res.status(500).json({
            error: 'File scan failed',
            code: 'SCAN_ERROR',
            message: 'Unable to verify file safety. Please try again or contact support.'
        });
    }
};
