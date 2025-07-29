const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ImageKit = require('imagekit');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Initialize ImageKit
const imagekit = new ImageKit({
    publicKey: functions.config().imagekit.public_key,
    privateKey: functions.config().imagekit.private_key,
    urlEndpoint: functions.config().imagekit.url_endpoint
});

// Authentication endpoint for client-side uploads
exports.imagekitAuth = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
        try {
            const authenticationParameters = imagekit.getAuthenticationParameters();
            res.json(authenticationParameters);
        } catch (error) {
            console.error('ImageKit auth error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });
});

// Create folder
exports.createFolder = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { folderName, parentFolderPath } = req.body;
            
            const result = await imagekit.createFolder({
                folderName: folderName,
                parentFolderPath: parentFolderPath || '/'
            });
            
            res.json(result);
        } catch (error) {
            console.error('Create folder error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Delete folder
exports.deleteFolder = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { folderPath } = req.body;
            
            await imagekit.deleteFolder(folderPath);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Delete folder error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// List files and folders
exports.listAssets = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { path, type, limit, skip } = req.query;
            
            const result = await imagekit.listFiles({
                path: path || '/',
                type: type || 'all', // 'file', 'folder', or 'all'
                limit: parseInt(limit) || 100,
                skip: parseInt(skip) || 0,
                includeFolder: true
            });
            
            res.json(result);
        } catch (error) {
            console.error('List assets error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Delete file
exports.deleteFile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { fileId } = req.body;
            
            await imagekit.deleteFile(fileId);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Delete file error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Update file metadata
exports.updateFileMetadata = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { fileId, customMetadata, tags } = req.body;
            
            const updateData = {};
            if (customMetadata) updateData.customMetadata = customMetadata;
            if (tags) updateData.tags = tags;
            
            const result = await imagekit.updateFileDetails(fileId, updateData);
            
            res.json(result);
        } catch (error) {
            console.error('Update file metadata error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Get file metadata
exports.getFileMetadata = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { fileId } = req.query;
            
            const result = await imagekit.getFileMetadata(fileId);
            
            res.json(result);
        } catch (error) {
            console.error('Get file metadata error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Bulk delete files
exports.bulkDeleteFiles = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { fileIds } = req.body;
            
            const deletePromises = fileIds.map(fileId => imagekit.deleteFile(fileId));
            await Promise.all(deletePromises);
            
            res.json({ success: true, deletedCount: fileIds.length });
        } catch (error) {
            console.error('Bulk delete error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Search files
exports.searchFiles = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { query, tags, path, limit, skip } = req.query;
            
            const searchParams = {
                limit: parseInt(limit) || 50,
                skip: parseInt(skip) || 0
            };
            
            if (query) searchParams.name = query;
            if (tags) searchParams.tags = tags.split(',');
            if (path) searchParams.path = path;
            
            const result = await imagekit.listFiles(searchParams);
            
            res.json(result);
        } catch (error) {
            console.error('Search files error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

