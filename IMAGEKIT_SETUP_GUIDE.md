# ImageKit Integration Setup Guide for NoteNest

## Overview

This guide provides comprehensive instructions for setting up ImageKit integration with your NoteNest application. The ImageKit integration adds powerful image management capabilities including folder organization, multi-image uploads, metadata management, and cloud storage.

## Prerequisites

Before beginning the setup process, ensure you have the following:

- **ImageKit Account**: Sign up at [imagekit.io](https://imagekit.io) if you haven't already
- **Firebase Project**: Your existing Firebase project with Authentication and Firestore enabled
- **Firebase CLI**: Install using `npm install -g firebase-tools`
- **Node.js**: Version 14 or higher for Firebase Functions

## Phase 1: ImageKit Account Configuration

### Step 1: Create ImageKit Account and Get Credentials

1. **Sign up for ImageKit**: Visit [imagekit.io](https://imagekit.io) and create a new account
2. **Access Dashboard**: Navigate to your ImageKit dashboard after account verification
3. **Get API Credentials**: Go to Developer Options > API Keys and note down:
   - **Public Key**: Used for client-side operations
   - **Private Key**: Used for server-side operations (keep secure)
   - **URL Endpoint**: Your unique ImageKit URL endpoint

### Step 2: Configure ImageKit Settings

1. **Upload Settings**: In your ImageKit dashboard, go to Settings > Upload
   - Enable "Use unique filenames" to prevent conflicts
   - Set maximum file size limits as needed
   - Configure allowed file formats (JPG, PNG, GIF, WebP recommended)

2. **Security Settings**: Configure security options
   - Enable signed URLs for sensitive operations
   - Set up webhook endpoints if needed for real-time updates

## Phase 2: Firebase Functions Setup

### Step 1: Initialize Firebase Functions

```bash
# Navigate to your NoteNest project directory
cd /path/to/NoteNest

# Initialize Firebase Functions (if not already done)
firebase init functions

# Select your existing Firebase project
# Choose JavaScript or TypeScript (JavaScript recommended for this guide)
# Install dependencies when prompted
```

### Step 2: Install Required Dependencies

```bash
# Navigate to functions directory
cd functions

# Install ImageKit SDK and other dependencies
npm install imagekit cors express
```

### Step 3: Configure Environment Variables

```bash
# Set ImageKit credentials as environment variables
firebase functions:config:set imagekit.public_key="your_public_key_here"
firebase functions:config:set imagekit.private_key="your_private_key_here"
firebase functions:config:set imagekit.url_endpoint="https://ik.imagekit.io/your_imagekit_id"
```

### Step 4: Update Firebase Functions Code

Replace the contents of `functions/index.js` with the provided Firebase Functions code from the project files. The functions include:

- **imagekitAuth**: Provides authentication tokens for client-side uploads
- **createFolder**: Creates new folders in ImageKit
- **deleteFolder**: Removes folders and their contents
- **listAssets**: Lists files and folders in a specific path
- **deleteFile**: Removes individual files
- **bulkDeleteFiles**: Removes multiple files at once
- **updateFileMetadata**: Updates file tags and metadata
- **getFileMetadata**: Retrieves file information and metadata
- **searchFiles**: Searches files by name, tags, or metadata

### Step 5: Deploy Firebase Functions

```bash
# Deploy functions to Firebase
firebase deploy --only functions

# Note the deployed function URLs - you'll need these for frontend configuration
```

## Phase 3: Frontend Configuration

### Step 1: Update ImageKit Manager Configuration

In `scripts/imagekit-manager.js`, update the configuration:

```javascript
// Update these values with your actual ImageKit credentials
this.imagekit = new ImageKit({
    publicKey: "your_actual_public_key_here",
    urlEndpoint: "https://ik.imagekit.io/your_actual_imagekit_id",
    authenticationEndpoint: "https://your-project-id.cloudfunctions.net/imagekitAuth"
});

// Update base URL to match your deployed functions
this.baseUrl = 'https://your-project-id.cloudfunctions.net';
```

### Step 2: Update Firebase Configuration

Ensure your `firebase/firebaseConfig.js` includes the correct project settings and that Functions are enabled.

### Step 3: Test Frontend Integration

1. **Start Local Server**: Use `python3 -m http.server` to test locally
2. **Test Authentication**: Verify login works with your credentials
3. **Test Gallery Tab**: Check that the gallery interface loads correctly
4. **Test Modal Functions**: Verify that folder creation and upload modals open

## Phase 4: Firestore Security Rules Update

### Step 1: Update Security Rules

Deploy the updated `firestore.rules` file that includes rules for ImageKit metadata storage:

```bash
firebase deploy --only firestore:rules
```

### Step 2: Verify Rules

Test that the security rules properly restrict access to authorized users only.

## Phase 5: Testing and Validation

### Step 1: Functional Testing

1. **Folder Management**:
   - Create new folders
   - Navigate between folders
   - Delete empty and non-empty folders

2. **Image Upload**:
   - Single image upload
   - Multiple image upload
   - Upload with metadata (tags, categories)
   - Upload progress tracking

3. **Image Management**:
   - View images in grid layout
   - Edit image metadata
   - Delete individual images
   - Bulk delete multiple images

4. **Search and Filter**:
   - Search images by name
   - Filter by tags
   - Filter by metadata

### Step 2: Error Handling Testing

1. **Network Issues**: Test behavior with poor connectivity
2. **Large Files**: Test upload limits and error messages
3. **Invalid Formats**: Test unsupported file type handling
4. **Authentication**: Test expired token handling

## Phase 6: Production Deployment

### Step 1: Environment Configuration

1. **Production ImageKit Settings**: Configure production-specific settings
2. **CORS Configuration**: Ensure proper CORS settings for your domain
3. **Rate Limiting**: Configure appropriate rate limits for API calls

### Step 2: Performance Optimization

1. **Image Optimization**: Configure ImageKit transformations for optimal loading
2. **Caching**: Set up appropriate caching headers
3. **CDN**: Leverage ImageKit's global CDN for fast image delivery

### Step 3: Monitoring and Analytics

1. **ImageKit Analytics**: Monitor usage through ImageKit dashboard
2. **Firebase Analytics**: Track user interactions with gallery features
3. **Error Monitoring**: Set up error tracking for production issues

## Troubleshooting Common Issues

### Issue 1: Authentication Errors

**Symptoms**: "Authentication failed" errors when uploading
**Solutions**:
- Verify ImageKit credentials are correctly set
- Check that Firebase Functions are deployed and accessible
- Ensure CORS is properly configured

### Issue 2: Upload Failures

**Symptoms**: Files fail to upload or show error messages
**Solutions**:
- Check file size limits in ImageKit settings
- Verify supported file formats
- Test network connectivity
- Check Firebase Functions logs for errors

### Issue 3: Gallery Not Loading

**Symptoms**: Gallery shows empty state or loading indefinitely
**Solutions**:
- Verify ImageKit API credentials
- Check browser console for JavaScript errors
- Ensure Firebase Functions are responding correctly
- Test API endpoints directly

### Issue 4: Metadata Not Saving

**Symptoms**: Tags and metadata don't persist after saving
**Solutions**:
- Verify Firestore security rules allow metadata writes
- Check that user is properly authenticated
- Test metadata update functions directly

## Security Considerations

### Client-Side Security

1. **API Key Protection**: Never expose private keys in client-side code
2. **Authentication**: Always verify user authentication before operations
3. **Input Validation**: Sanitize all user inputs before processing

### Server-Side Security

1. **Function Security**: Implement proper authentication checks in all functions
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Error Handling**: Don't expose sensitive information in error messages

## Performance Best Practices

### Image Optimization

1. **Automatic Transformations**: Use ImageKit's real-time transformations
2. **Progressive Loading**: Implement progressive image loading
3. **Lazy Loading**: Load images only when needed

### Caching Strategy

1. **Browser Caching**: Set appropriate cache headers
2. **CDN Caching**: Leverage ImageKit's global CDN
3. **Application Caching**: Cache metadata and folder structures

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Monitor Usage**: Track ImageKit usage and costs
2. **Clean Up**: Remove unused images and folders periodically
3. **Update Dependencies**: Keep ImageKit SDK and other dependencies updated

### Backup Strategy

1. **Metadata Backup**: Regular Firestore backups for metadata
2. **Image Backup**: Consider additional backup solutions for critical images
3. **Configuration Backup**: Maintain backups of all configuration settings

## Support and Resources

### Documentation Links

- [ImageKit Documentation](https://docs.imagekit.io/)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

### Community Resources

- [ImageKit Community Forum](https://community.imagekit.io/)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/imagekit)

This comprehensive setup guide should enable you to successfully integrate ImageKit with your NoteNest application, providing powerful image management capabilities while maintaining security and performance standards.

