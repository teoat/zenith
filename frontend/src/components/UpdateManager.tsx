// @ts-nocheck
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';

const UpdateManager = () => {
    const [updateStatus, setUpdateStatus] = useState({
        checking: false,
        updateAvailable: false,
        downloading: false,
        downloaded: false,
        error: null,
        currentVersion: '1.0.0',
        updateInfo: null,
        downloadProgress: null
    });
    
    const [config, setConfig] = useState({
        autoDownload: true,
        autoInstall: true,
        betaChannel: false,
        checkInterval: 3600000 // 1 hour
    });
    
    const [releaseNotes, setReleaseNotes] = useState('');
    const [activeTab, setActiveTab] = useState('status');

    // Listen for update status updates
    useEffect(() => {
        if (window.electronAPI) {
            // Get initial status
            window.electronAPI.invoke('updater:get-status').then(setUpdateStatus);
            window.electronAPI.invoke('updater:get-config').then(setConfig);
            window.electronAPI.invoke('updater:get-release-notes').then(setReleaseNotes);
            
            // Listen for status updates
            const removeStatusListener = window.electronAPI.onReceive('updater:status', setUpdateStatus);
            
            return () => {
                removeStatusListener();
            };
        }
    }, []);

    const checkForUpdates = async () => {
        try {
            const result = await window.electronAPI.invoke('updater:check-for-updates');
            if (result.success) {
                // Status will be updated via event
            } else {
                setUpdateStatus(prev => ({
                    ...prev,
                    error: result.error || 'Failed to check for updates'
                }));
            }
        } catch (error) {
            setUpdateStatus(prev => ({
                ...prev,
                error: error.message
            }));
        }
    };

    const downloadUpdate = async () => {
        try {
            const result = await window.electronAPI.invoke('updater:download-update');
            if (!result.success) {
                setUpdateStatus(prev => ({
                    ...prev,
                    error: result.error || 'Failed to download update'
                }));
            }
        } catch (error) {
            setUpdateStatus(prev => ({
                ...prev,
                error: error.message
            }));
        }
    };

    const installUpdate = async () => {
        try {
            const result = await window.electronAPI.invoke('updater:install-update');
            if (!result.success) {
                setUpdateStatus(prev => ({
                    ...prev,
                    error: result.error || 'Failed to install update'
                }));
            }
        } catch (error) {
            setUpdateStatus(prev => ({
                ...prev,
                error: error.message
            }));
        }
    };

    const updateConfig = async (newConfig) => {
        try {
            await window.electronAPI.invoke('updater:set-config', newConfig);
            setConfig(newConfig);
        } catch (error) {
            console.error('Failed to update config:', error);
        }
    };

    const getStatusBadge = () => {
        if (updateStatus.error) {
            return <Badge variant="destructive">Error</Badge>;
        }
        if (updateStatus.downloaded) {
            return <Badge variant="default">Downloaded</Badge>;
        }
        if (updateStatus.downloading) {
            return <Badge variant="secondary">Downloading</Badge>;
        }
        if (updateStatus.updateAvailable) {
            return <Badge variant="outline">Available</Badge>;
        }
        return <Badge variant="secondary">Up to date</Badge>;
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Update Manager</h1>
                {getStatusBadge()}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="release-notes">Release Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Current Version:</span>
                                <span className="text-sm text-gray-600">{updateStatus.currentVersion}</span>
                            </div>
                            
                            {updateStatus.updateAvailable && updateStatus.updateInfo && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Available Version:</span>
                                    <span className="text-sm text-green-600 font-semibold">
                                        {updateStatus.updateInfo.latestVersion}
                                    </span>
                                </div>
                            )}
                            
                            {updateStatus.checking && (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-sm text-blue-600">Checking for updates...</span>
                                </div>
                            )}
                            
                            {updateStatus.error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{updateStatus.error}</AlertDescription>
                                </Alert>
                            )}
                            
                            {updateStatus.downloading && updateStatus.downloadProgress && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Download Progress:</span>
                                        <span>{updateStatus.downloadProgress.percent.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={updateStatus.downloadProgress.percent} className="w-full" />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{formatBytes(updateStatus.downloadProgress.transferred)}</span>
                                        <span>{formatBytes(updateStatus.downloadProgress.total)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Speed: {formatBytes(updateStatus.downloadProgress.bytesPerSecond)}/s
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex space-x-2 pt-4">
                                <Button 
                                    onClick={checkForUpdates}
                                    disabled={updateStatus.checking || updateStatus.downloading}
                                    variant="outline"
                                >
                                    Check for Updates
                                </Button>
                                
                                {updateStatus.updateAvailable && !updateStatus.downloading && !updateStatus.downloaded && (
                                    <Button 
                                        onClick={downloadUpdate}
                                        disabled={config.autoDownload}
                                    >
                                        Download Update
                                    </Button>
                                )}
                                
                                {updateStatus.downloaded && (
                                    <Button 
                                        onClick={installUpdate}
                                        variant="default"
                                    >
                                        Install & Restart
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Update Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-download">Auto-download updates</Label>
                                <Switch
                                    id="auto-download"
                                    checked={config.autoDownload}
                                    onCheckedChange={(checked) => updateConfig({...config, autoDownload: checked})}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-install">Auto-install updates</Label>
                                <Switch
                                    id="auto-install"
                                    checked={config.autoInstall}
                                    onCheckedChange={(checked) => updateConfig({...config, autoInstall: checked})}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <Label htmlFor="beta-channel">Include beta releases</Label>
                                <Switch
                                    id="beta-channel"
                                    checked={config.betaChannel}
                                    onCheckedChange={(checked) => updateConfig({...config, betaChannel: checked})}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="check-interval">Check interval (hours)</Label>
                                <Input
                                    id="check-interval"
                                    type="number"
                                    value={config.checkInterval / 3600000}
                                    onChange={(e) => updateConfig({...config, checkInterval: parseInt(e.target.value) * 3600000})}
                                    min="1"
                                    max="168"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="release-notes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Release Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm max-w-none">
                                {releaseNotes ? (
                                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(releaseNotes.replace(/\n/g, '<br>')) }} />
                                ) : (
                                    <p className="text-gray-500">No release notes available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default UpdateManager;