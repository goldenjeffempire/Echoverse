/**
 * FIXED AUDIT #3: Production-Ready Virus Scanning Implementation
 * Integrates with ClamAV or cloud antivirus service
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ScanResult {
  clean: boolean;
  threats: string[];
  scanner: string;
  scanTime: number;
}

/**
 * Virus scanner with multiple backend support
 */
export class VirusScanner {
  private readonly scannerType: 'clamav' | 'basic' | 'cloud';
  private readonly timeout: number = 30000; // 30 seconds

  constructor() {
    // Determine which scanner to use based on environment
    if (process.env.CLAMAV_SOCKET || process.env.CLAMAV_HOST) {
      this.scannerType = 'clamav';
    } else if (process.env.VIRUSTOTAL_API_KEY || process.env.METADEFENDER_API_KEY) {
      this.scannerType = 'cloud';
    } else {
      this.scannerType = 'basic';
      logger.warn('No antivirus service configured - using basic pattern matching only');
    }
  }

  /**
   * Scan file for viruses using configured backend
   */
  async scanFile(filePath: string): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      let result: ScanResult;

      switch (this.scannerType) {
        case 'clamav':
          result = await this.scanWithClamAV(filePath);
          break;
        case 'cloud':
          result = await this.scanWithCloudService(filePath);
          break;
        default:
          result = await this.basicPatternScan(filePath);
      }

      result.scanTime = Date.now() - startTime;
      
      if (!result.clean) {
        logger.warn('Malicious file detected', {
          filePath,
          threats: result.threats,
          scanner: result.scanner
        });
      }

      return result;
    } catch (error) {
      logger.error('Virus scan failed', error instanceof Error ? error : undefined);
      // Fail securely - treat scan failures as potential threats
      return {
        clean: false,
        threats: ['Scan failed - file rejected for security'],
        scanner: this.scannerType,
        scanTime: Date.now() - startTime
      };
    }
  }

  /**
   * Scan using ClamAV daemon
   */
  private async scanWithClamAV(filePath: string): Promise<ScanResult> {
    try {
      const socketPath = process.env.CLAMAV_SOCKET || '/var/run/clamav/clamd.ctl';
      const command = `clamdscan --no-summary --fdpass "${filePath}"`;
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout
      });

      const output = stdout + stderr;
      const isClean = output.includes('OK') && !output.includes('FOUND');
      
      const threats: string[] = [];
      if (!isClean) {
        // Parse ClamAV output for threat names
        const matches = output.match(/: (.+) FOUND/g);
        if (matches) {
          matches.forEach(match => {
            const threat = match.replace(/: (.+) FOUND/, '$1').trim();
            threats.push(threat);
          });
        }
      }

      return {
        clean: isClean,
        threats,
        scanner: 'clamav',
        scanTime: 0
      };
    } catch (error) {
      if ((error as any).code === 1) {
        // ClamAV returns exit code 1 when virus is found
        return {
          clean: false,
          threats: ['Malware detected by ClamAV'],
          scanner: 'clamav',
          scanTime: 0
        };
      }
      throw error;
    }
  }

  /**
   * Scan using cloud service (VirusTotal API)
   */
  private async scanWithCloudService(filePath: string): Promise<ScanResult> {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    
    if (!apiKey) {
      throw new Error('Cloud scanning API key not configured');
    }

    try {
      // Read file
      const fileBuffer = await fs.readFile(filePath);
      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer]));

      // Upload to VirusTotal
      const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
        method: 'POST',
        headers: {
          'x-apikey': apiKey
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`VirusTotal API error: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json() as any;
      const analysisId = uploadData.data.id;

      // Poll for results (with timeout)
      let attempts = 0;
      while (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const resultResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
          headers: {
            'x-apikey': apiKey
          }
        });

        const resultData = await resultResponse.json() as any;
        
        if (resultData.data.attributes.status === 'completed') {
          const stats = resultData.data.attributes.stats;
          const malicious = stats.malicious || 0;
          const suspicious = stats.suspicious || 0;
          
          return {
            clean: malicious === 0 && suspicious === 0,
            threats: malicious > 0 ? [`Detected by ${malicious} scanners`] : [],
            scanner: 'virustotal',
            scanTime: 0
          };
        }
        
        attempts++;
      }

      throw new Error('VirusTotal scan timeout');
    } catch (error) {
      logger.error('Cloud virus scan failed', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  /**
   * Basic pattern-based scanning (fallback only)
   */
  private async basicPatternScan(filePath: string): Promise<ScanResult> {
    const content = await fs.readFile(filePath);
    const threats: string[] = [];

    // Check for executable headers
    const executableSignatures = [
      { name: 'PE/DOS Executable', pattern: Buffer.from([0x4D, 0x5A]) },
      { name: 'ELF Executable', pattern: Buffer.from([0x7F, 0x45, 0x4C, 0x46]) },
      { name: 'Mach-O Executable', pattern: Buffer.from([0xFE, 0xED, 0xFA, 0xCE]) },
      { name: 'Mach-O 64-bit', pattern: Buffer.from([0xFE, 0xED, 0xFA, 0xCF]) }
    ];

    for (const sig of executableSignatures) {
      if (content.slice(0, sig.pattern.length).equals(sig.pattern)) {
        threats.push(sig.name);
      }
    }

    // Check for web shells and malicious scripts
    const contentStr = content.toString('utf-8', 0, Math.min(10000, content.length));
    const suspiciousPatterns = [
      { pattern: /<\?php.*eval\s*\(/i, name: 'PHP eval() detected' },
      { pattern: /<\?php.*system\s*\(/i, name: 'PHP system() detected' },
      { pattern: /<\?php.*exec\s*\(/i, name: 'PHP exec() detected' },
      { pattern: /<\?php.*shell_exec\s*\(/i, name: 'PHP shell_exec() detected' },
      { pattern: /<\?php.*passthru\s*\(/i, name: 'PHP passthru() detected' },
      { pattern: /<\?php.*base64_decode\s*\(/i, name: 'PHP base64_decode detected' },
      { pattern: /eval\s*\(\s*atob\s*\(/i, name: 'JavaScript eval(atob()) detected' },
      { pattern: /<script[^>]*src\s*=\s*["']data:/i, name: 'Data URI script detected' }
    ];

    for (const { pattern, name } of suspiciousPatterns) {
      if (pattern.test(contentStr)) {
        threats.push(name);
      }
    }

    // Check for suspicious file characteristics
    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      threats.push('Empty file');
    }
    if (stats.size > 100 * 1024 * 1024) {
      threats.push('File exceeds 100MB limit');
    }

    return {
      clean: threats.length === 0,
      threats,
      scanner: 'basic',
      scanTime: 0
    };
  }

  /**
   * Get scanner status and configuration
   */
  getStatus(): { type: string; available: boolean; version?: string } {
    return {
      type: this.scannerType,
      available: true,
      version: this.scannerType === 'basic' ? 'pattern-matching-only' : undefined
    };
  }
}

// Singleton instance
export const virusScanner = new VirusScanner();
