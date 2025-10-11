#!/usr/bin/env tsx

/**
 * SSL/TLS Automation with Let's Encrypt
 * 
 * Features:
 * - Automatic SSL certificate generation with Let's Encrypt
 * - Certificate renewal automation
 * - Certificate validation and monitoring
 * - Fallback to self-signed certificates for development
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { logger } from '../server/logger';

const SSL_DIR = process.env.SSL_DIR || '/etc/letsencrypt/live';
const DOMAIN = process.env.DOMAIN || 'localhost';
const EMAIL = process.env.SSL_EMAIL || 'admin@example.com';
const STAGING = process.env.SSL_STAGING === 'true';

interface SSLConfig {
  certPath: string;
  keyPath: string;
  fullchainPath: string;
  expiryDate?: Date;
}

class SSLAutomation {
  private certPath: string;
  private keyPath: string;
  private fullchainPath: string;

  constructor() {
    this.certPath = path.join(SSL_DIR, DOMAIN, 'cert.pem');
    this.keyPath = path.join(SSL_DIR, DOMAIN, 'privkey.pem');
    this.fullchainPath = path.join(SSL_DIR, DOMAIN, 'fullchain.pem');
  }

  /**
   * Check if Certbot is installed
   */
  private isCertbotInstalled(): boolean {
    try {
      execSync('which certbot', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install Certbot if not present
   */
  private async installCertbot(): Promise<void> {
    logger.info('Installing Certbot...');
    
    try {
      // Try snap installation (recommended by Let's Encrypt)
      execSync('sudo snap install --classic certbot', { stdio: 'inherit' });
      execSync('sudo ln -s /snap/bin/certbot /usr/bin/certbot', { stdio: 'inherit' });
      logger.info('Certbot installed successfully via snap');
    } catch (error) {
      // Fallback to apt-get
      try {
        execSync('sudo apt-get update && sudo apt-get install -y certbot', { stdio: 'inherit' });
        logger.info('Certbot installed successfully via apt-get');
      } catch (aptError) {
        logger.error('Failed to install Certbot', aptError as Error);
        throw new Error('Certbot installation failed. Please install manually: https://certbot.eff.org/');
      }
    }
  }

  /**
   * Generate Let's Encrypt certificate
   */
  async generateCertificate(): Promise<SSLConfig> {
    if (!this.isCertbotInstalled()) {
      await this.installCertbot();
    }

    const stagingFlag = STAGING ? '--staging' : '';
    const command = `sudo certbot certonly --standalone \\
      ${stagingFlag} \\
      --non-interactive \\
      --agree-tos \\
      --email ${EMAIL} \\
      -d ${DOMAIN} \\
      --preferred-challenges http`;

    try {
      logger.info('Generating Let\'s Encrypt certificate', { domain: DOMAIN, staging: STAGING });
      execSync(command, { stdio: 'inherit' });
      
      return {
        certPath: this.certPath,
        keyPath: this.keyPath,
        fullchainPath: this.fullchainPath
      };
    } catch (error) {
      logger.error('Failed to generate certificate', error as Error);
      throw error;
    }
  }

  /**
   * Renew certificate if expiring soon
   */
  async renewCertificate(): Promise<void> {
    const expiryDate = await this.getCertificateExpiry();
    
    if (!expiryDate) {
      logger.warn('No certificate found, generating new one');
      await this.generateCertificate();
      return;
    }

    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 30) {
      logger.info('Certificate expiring soon, renewing', { daysUntilExpiry });
      
      try {
        execSync('sudo certbot renew --non-interactive', { stdio: 'inherit' });
        logger.info('Certificate renewed successfully');
        
        // Restart server to load new certificate
        if (process.env.PM2_NAME) {
          execSync(`pm2 reload ${process.env.PM2_NAME}`, { stdio: 'inherit' });
        }
      } catch (error) {
        logger.error('Failed to renew certificate', error as Error);
        throw error;
      }
    } else {
      logger.info('Certificate still valid', { daysUntilExpiry });
    }
  }

  /**
   * Get certificate expiry date
   */
  async getCertificateExpiry(): Promise<Date | null> {
    try {
      if (!fs.existsSync(this.certPath)) {
        return null;
      }

      const cert = fs.readFileSync(this.certPath, 'utf8');
      const output = execSync(`echo "${cert}" | openssl x509 -noout -enddate`, { encoding: 'utf8' });
      const match = output.match(/notAfter=(.+)/);
      
      if (match) {
        return new Date(match[1]);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get certificate expiry', error as Error);
      return null;
    }
  }

  /**
   * Setup automatic renewal cron job
   */
  async setupAutoRenewal(): Promise<void> {
    const cronJob = '0 0 * * * /usr/bin/certbot renew --quiet --post-hook "pm2 reload all"';
    const cronFile = '/etc/cron.d/certbot-renewal';
    
    try {
      fs.writeFileSync(cronFile, cronJob);
      logger.info('Auto-renewal cron job configured', { cronFile });
    } catch (error) {
      logger.warn('Failed to setup auto-renewal cron (may need sudo)', error as Error);
      logger.info('Manual renewal command: sudo certbot renew');
    }
  }

  /**
   * Generate self-signed certificate for development
   */
  async generateSelfSigned(): Promise<SSLConfig> {
    const devCertDir = path.join(process.cwd(), 'certs');
    const certPath = path.join(devCertDir, 'cert.pem');
    const keyPath = path.join(devCertDir, 'key.pem');

    if (!fs.existsSync(devCertDir)) {
      fs.mkdirSync(devCertDir, { recursive: true });
    }

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      logger.info('Self-signed certificate already exists');
      return { certPath, keyPath, fullchainPath: certPath };
    }

    const command = `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} \\
      -days 365 -nodes \\
      -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"`;

    try {
      logger.info('Generating self-signed certificate for development');
      execSync(command, { stdio: 'inherit' });
      
      logger.warn('⚠️  Self-signed certificate generated. Not suitable for production!');
      
      return { certPath, keyPath, fullchainPath: certPath };
    } catch (error) {
      logger.error('Failed to generate self-signed certificate', error as Error);
      throw error;
    }
  }

  /**
   * Validate certificate
   */
  async validateCertificate(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
        logger.warn('Certificate files not found');
        return false;
      }

      // Verify certificate
      execSync(`openssl verify ${this.certPath}`, { stdio: 'pipe' });
      
      // Check expiry
      const expiryDate = await this.getCertificateExpiry();
      if (expiryDate && expiryDate > new Date()) {
        logger.info('Certificate is valid', { expiryDate });
        return true;
      }
      
      logger.warn('Certificate has expired or is invalid');
      return false;
    } catch (error) {
      logger.error('Certificate validation failed', error as Error);
      return false;
    }
  }
}

// CLI execution
async function main() {
  const ssl = new SSLAutomation();
  const command = process.argv[2];

  switch (command) {
    case 'generate':
      if (process.env.NODE_ENV === 'production') {
        await ssl.generateCertificate();
      } else {
        await ssl.generateSelfSigned();
      }
      break;

    case 'renew':
      await ssl.renewCertificate();
      break;

    case 'validate':
      const isValid = await ssl.validateCertificate();
      process.exit(isValid ? 0 : 1);
      break;

    case 'auto-renew':
      await ssl.setupAutoRenewal();
      break;

    case 'check-expiry':
      const expiry = await ssl.getCertificateExpiry();
      if (expiry) {
        console.log(`Certificate expires: ${expiry.toISOString()}`);
        const days = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`Days until expiry: ${days}`);
      } else {
        console.log('No certificate found');
      }
      break;

    default:
      console.log('SSL/TLS Automation');
      console.log('');
      console.log('Usage:');
      console.log('  npm run ssl:generate      # Generate certificate');
      console.log('  npm run ssl:renew         # Renew certificate');
      console.log('  npm run ssl:validate      # Validate certificate');
      console.log('  npm run ssl:auto-renew    # Setup auto-renewal');
      console.log('  npm run ssl:check-expiry  # Check expiry date');
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('SSL automation failed', error);
    process.exit(1);
  });
}

export { SSLAutomation };
