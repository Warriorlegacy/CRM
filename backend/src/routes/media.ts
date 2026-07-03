import { Router, Response } from 'express';
import axios from 'axios';
import { prisma } from '../prisma';

export const mediaRouter = Router();

mediaRouter.post('/presign', (req: any, res: Response) => {
  const workspaceId = req.workspaceId;
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({ error: 'filename and contentType are required' });
  }

  const ext = filename.split('.').pop() || 'bin';
  const key = `media/${workspaceId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const storageUrl = process.env.SUPABASE_URL || process.env.STORAGE_URL || 'http://localhost:9000';
  const uploadUrl = `${storageUrl}/storage/v1/object/upload?path=${encodeURIComponent(key)}`;

  return res.json({
    ok: true,
    url: uploadUrl,
    key,
  });
});

mediaRouter.get('/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const workspaceId = (req as any).workspaceId;

  try {
    const message = await prisma.message.findFirst({
      where: { 
        id: messageId,
        workspaceId,
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const waAccount = await prisma.waAccount.findUnique({
      where: { workspaceId },
    });

    if (!waAccount) {
      return res.status(400).json({ error: 'WhatsApp not configured' });
    }

    const metaApiUrl = `https://graph.facebook.com/v20.0/${message.waMessageId}`;
    
    const response = await axios.get(metaApiUrl, {
      params: {
        fields: 'mime_type,file',
        access_token: waAccount.accessToken,
      },
    });

    return res.json({
      ok: true,
      media: {
        mimeType: response.data.mime_type,
        url: response.data.url,
      },
    });
  } catch (error: any) {
    console.error('Error fetching media:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});

export default mediaRouter;
