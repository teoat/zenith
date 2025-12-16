// electron/enhanced-updater.js
const { autoUpdater } = require('electron-updater');
const { BrowserWindow, dialog, app, ipcMain } = require('electron');
const log = require('electron-log');
const https = require('https');
const semver = require('semver');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('Enhanced auto-updater initialized');

class EnhancedUpdater {
    constructor() {
        this.updateConfig = {
            repoOwner: process.env.GITHUB_REPO_OWNER || 'simple378',
            repoName: process.env.GITHUB_REPO_NAME || 'fraud-detection',
            checkInterval: process.env.UPDATE_CHECK_INTERVAL || 3600000, // 1 hour
            autoDownload: process.env.AUTO_DOWNLOAD_UPDATES !== 'false',
            autoInstall: process.env.AUTO_INSTALL_UPDATES !== 'false',
            betaChannel: process.env.BETA_CHANNEL === 'true'
        };
        
        this.currentStatus = {
            checking: false,
            updateAvailable: false,
            downloading: false,
            downloaded: false,
            error: null,
            updateInfo: null
        };
        
        this.setupEventHandlers();
        this.startPeriodicChecks();
    }
    
    setupEventHandlers() {
        // Auto-updater event handlers
        autoUpdater.on('checking-for-update', () => {
            log.info('Checking for update...');
            this.currentStatus.checking = true;
            this.sendStatusToRenderer();
        });
        
        autoUpdater.on('update-available', (info) => {
            log.info('Update available:', info.version);
            this.currentStatus.updateAvailable = true;
            this.currentStatus.updateInfo = info;
            this.currentStatus.checking = false;
            this.sendStatusToRenderer();
            
            // Auto-download if enabled
            if (this.updateConfig.autoDownload) {
                this.downloadUpdate();
            }
        });
        
        autoUpdater.on('update-not-available', (info) => {
            log.info('Update not available:', info.version);
            this.currentStatus.checking = false;
            this.currentStatus.updateAvailable = false;
            this.sendStatusToRenderer();
        });
        
        autoUpdater.on('error', (err) => {
            log.error('Update error:', err);
            this.currentStatus.error = err.message;
            this.currentStatus.checking = false;
            this.sendStatusToRenderer();
        });
        
        autoUpdater.on('download-progress', (progressObj) => {
            const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
            log.info(logMessage);
            
            this.currentStatus.downloading = true;
            this.currentStatus.downloadProgress = progressObj;
            this.sendStatusToRenderer();
        });
        
        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update downloaded:', info.version);
            this.currentStatus.downloaded = true;
            this.currentStatus.downloading = false;
            this.sendStatusToRenderer();
            
            // Auto-install if enabled
            if (this.updateConfig.autoInstall) {
                this.showUpdateDialog(info);
            }
        });
        
        // IPC handlers
        ipcMain.handle('updater:check-for-updates', async () => {
            return await this.checkForUpdates();
        });
        
        ipcMain.handle('updater:download-update', async () => {
            return this.downloadUpdate();
        });
        
        ipcMain.handle('updater:install-update', async () => {
            return this.installUpdate();
        });
        
        ipcMain.handle('updater:get-status', async () => {
            return this.getStatus();
        });
        
        ipcMain.handle('updater:get-config', async () => {
            return this.updateConfig;
        });
        
        ipcMain.handle('updater:set-config', async (_, config) => {
            this.updateConfig = { ...this.updateConfig, ...config };
            return this.updateConfig;
        });
        
        ipcMain.handle('updater:get-release-notes', async () => {
            return await this.getReleaseNotes();
        });
    }
    
    startPeriodicChecks() {
        if (process.env.NODE_ENV === 'development') {
            log.info('Skipping periodic update checks in development mode');
            return;
        }
        
        // Check for updates on startup
        setTimeout(() => {
            this.checkForUpdates();
        }, 5000); // 5 seconds after startup
        
        // Set up periodic checks
        setInterval(() => {
            this.checkForUpdates();
        }, this.updateConfig.checkInterval);
    }
    
    async checkForUpdates() {
        try {
            if (process.env.NODE_ENV === 'development') {
                log.info('Skipping update check in development mode');
                return { success: false, message: 'Development mode' };
            }
            
            log.info('Checking for updates...');
            this.currentStatus.checking = true;
            this.sendStatusToRenderer();
            
            // Check GitHub releases
            const releaseInfo = await this.checkGitHubReleases();
            
            if (releaseInfo.updateAvailable) {
                this.currentStatus.updateAvailable = true;
                this.currentStatus.updateInfo = releaseInfo;
                this.currentStatus.checking = false;
                
                // Trigger electron-updater
                autoUpdater.checkForUpdatesAndNotify();
                
                return {
                    success: true,
                    updateAvailable: true,
                    releaseInfo
                };
            } else {
                this.currentStatus.updateAvailable = false;
                this.currentStatus.checking = false;
                
                return {
                    success: true,
                    updateAvailable: false,
                    currentVersion: app.getVersion()
                };
            }
            
        } catch (error) {
            log.error('Update check failed:', error);
            this.currentStatus.error = error.message;
            this.currentStatus.checking = false;
            
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.sendStatusToRenderer();
        }
    }
    
    async checkGitHubReleases() {
        return new Promise((resolve, reject) => {
            const url = `https://api.github.com/repos/${this.updateConfig.repoOwner}/${this.updateConfig.repoName}/releases`;
            
            const options = {
                headers: {
                    'User-Agent': `${app.getName()}/${app.getVersion()}`
                }
            };
            
            https.get(url, options, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    try {
                        const releases = JSON.parse(data);
                        const currentVersion = app.getVersion();
                        
                        // Find the latest release (excluding pre-releases unless beta channel)
                        const latestRelease = releases.find(release => {
                            const isPrerelease = release.prerelease;
                            const isDraft = release.draft;
                            
                            if (this.updateConfig.betaChannel) {
                                return !isDraft;
                            } else {
                                return !isPrerelease && !isDraft;
                            }
                        });
                        
                        if (!latestRelease) {
                            resolve({
                                updateAvailable: false,
                                currentVersion
                            });
                            return;
                        }
                        
                        const latestVersion = latestRelease.tag_name.replace(/^v/, '');
                        const updateAvailable = semver.gt(latestVersion, currentVersion);
                        
                        if (updateAvailable) {
                            resolve({
                                updateAvailable: true,
                                currentVersion,
                                latestVersion,
                                releaseNotes: latestRelease.body,
                                publishedAt: latestRelease.published_at,
                                downloadUrl: this.getDownloadUrl(latestRelease),
                                assets: latestRelease.assets
                            });
                        } else {
                            resolve({
                                updateAvailable: false,
                                currentVersion,
                                latestVersion
                            });
                        }
                        
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }
    
    getDownloadUrl(release) {
        const platform = process.platform;
        
        // Find appropriate asset
        const asset = release.assets.find(asset => {
            const name = asset.name.toLowerCase();
            
            if (platform === 'win32') {
                return name.includes('.exe') || name.includes('win');
            } else if (platform === 'darwin') {
                return name.includes('.dmg') || name.includes('mac');
            } else if (platform === 'linux') {
                return name.includes('.AppImage') || name.includes('.deb') || name.includes('.rpm') || name.includes('linux');
            }
            
            return false;
        });
        
        return asset ? asset.browser_download_url : release.html_url;
    }
    
    downloadUpdate() {
        try {
            if (!this.currentStatus.updateAvailable) {
                throw new Error('No update available');
            }
            
            log.info('Starting update download...');
            autoUpdater.downloadUpdate();
            
            return { success: true };
        } catch (error) {
            log.error('Download update failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    installUpdate() {
        try {
            if (!this.currentStatus.downloaded) {
                throw new Error('Update not downloaded yet');
            }
            
            log.info('Installing update...');
            autoUpdater.quitAndInstall();
            
            return { success: true };
        } catch (error) {
            log.error('Install update failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    showUpdateDialog(updateInfo) {
        const dialogOpts = {
            type: 'info',
            buttons: ['Restart Now', 'Later'],
            title: 'Application Update',
            message: `A new version ${updateInfo.version} has been downloaded`,
            detail: 'Restart the application to apply the updates.'
        };
        
        dialog.showMessageBox(dialogOpts).then((returnValue) => {
            if (returnValue.response === 0) { // Restart Now
                autoUpdater.quitAndInstall();
            }
        });
    }
    
    async getReleaseNotes() {
        try {
            const releaseInfo = await this.checkGitHubReleases();
            return releaseInfo.releaseNotes || 'No release notes available';
        } catch (error) {
            log.error('Failed to get release notes:', error);
            return 'Failed to load release notes';
        }
    }
    
    getStatus() {
        return {
            ...this.currentStatus,
            currentVersion: app.getVersion(),
            config: this.updateConfig
        };
    }
    
    sendStatusToRenderer() {
        BrowserWindow.getAllWindows().forEach(window => {
            if (window && !window.isDestroyed()) {
                window.webContents.send('updater:status', this.getStatus());
            }
        });
    }
    
    // Update configuration methods
    enableAutoDownload() {
        this.updateConfig.autoDownload = true;
        log.info('Auto-download enabled');
    }
    
    disableAutoDownload() {
        this.updateConfig.autoDownload = false;
        log.info('Auto-download disabled');
    }
    
    enableAutoInstall() {
        this.updateConfig.autoInstall = true;
        log.info('Auto-install enabled');
    }
    
    disableAutoInstall() {
        this.updateConfig.autoInstall = false;
        log.info('Auto-install disabled');
    }
    
    setBetaChannel(enabled) {
        this.updateConfig.betaChannel = enabled;
        log.info(`Beta channel ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    setCheckInterval(intervalMs) {
        this.updateConfig.checkInterval = intervalMs;
        log.info(`Update check interval set to ${intervalMs}ms`);
    }
}

// Create enhanced updater instance
const enhancedUpdater = new EnhancedUpdater();

// Legacy exports for backward compatibility
function checkForUpdates() {
    return enhancedUpdater.checkForUpdates();
}

function checkForUpdatesManual() {
    return enhancedUpdater.checkForUpdates();
}

function getCurrentVersion() {
    return app.getVersion();
}

function getUpdateStatus() {
    return enhancedUpdater.getStatus();
}

function downloadUpdate() {
    return enhancedUpdater.downloadUpdate();
}

function installUpdate() {
    return enhancedUpdater.installUpdate();
}

module.exports = {
    // Enhanced updater instance
    enhancedUpdater,
    
    // Legacy methods
    checkForUpdates,
    checkForUpdatesManual,
    getCurrentVersion,
    getUpdateStatus,
    downloadUpdate,
    installUpdate,
    
    // Configuration methods
    enableAutoDownload: () => enhancedUpdater.enableAutoDownload(),
    disableAutoDownload: () => enhancedUpdater.disableAutoDownload(),
    enableAutoInstall: () => enhancedUpdater.enableAutoInstall(),
    disableAutoInstall: () => enhancedUpdater.disableAutoInstall(),
    setBetaChannel: (enabled) => enhancedUpdater.setBetaChannel(enabled),
    setCheckInterval: (interval) => enhancedUpdater.setCheckInterval(interval)
};