const ImageKit = require('imagekit');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  const { fileId } = req.body;
  if (!fileId) {
    return res.status(400).json({ message: 'File ID is required.' });
  }
  const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
  try {
    await imagekit.deleteFile(fileId);
    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    // Log the full error object for better debugging
    console.error('Detailed ImageKit deletion error:', JSON.stringify(error, null, 2));
    res.status(500).json({ message: 'Failed to delete file from ImageKit.', details: error.message || 'Unknown error' });
  }
};