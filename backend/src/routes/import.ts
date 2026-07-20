import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { prisma } from '../prisma';
import { parse as csvParse } from 'csv-parse/sync';

export const importRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

interface ContactRow {
  name?: string;
  phone: string;
  email?: string;
  stage?: string;
  tags?: string;
  channel?: string;
}

const VALID_STAGES = ['new', 'followup', 'negotiation', 'won', 'lost'];

importRouter.post('/contacts/csv', upload.single('file'), async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    let records: Record<string, string>[];

    try {
      records = csvParse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid CSV format', details: String(parseError) });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Normalize column names (case-insensitive)
    const normalizedRecords: ContactRow[] = records.map((record) => {
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(record)) {
        normalized[key.toLowerCase().trim()] = value?.trim() || '';
      }
      return {
        name: normalized.name || undefined,
        phone: normalized.phone || '',
        email: normalized.email || undefined,
        stage: normalized.stage || undefined,
        tags: normalized.tags || undefined,
        channel: normalized.channel || undefined,
      };
    });

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < normalizedRecords.length; i += batchSize) {
      const batch = normalizedRecords.slice(i, i + batchSize);

      const operations = batch.map(async (row, index) => {
        const rowNum = i + index + 2; // +2 for header row and 0-index

        // Validate required fields
        if (!row.phone) {
          failed++;
          errors.push(`Row ${rowNum}: phone is required`);
          return;
        }

        // Validate stage if provided
        if (row.stage && !VALID_STAGES.includes(row.stage.toLowerCase())) {
          failed++;
          errors.push(`Row ${rowNum}: invalid stage "${row.stage}". Valid stages: ${VALID_STAGES.join(', ')}`);
          return;
        }

        // Validate channel if provided
        if (row.channel && !['whatsapp', 'instagram'].includes(row.channel.toLowerCase())) {
          failed++;
          errors.push(`Row ${rowNum}: invalid channel "${row.channel}". Use "whatsapp" or "instagram"`);
          return;
        }

        try {
          // Check if contact already exists by phone
          const existing = await prisma.contact.findFirst({
            where: { workspaceId, phone: row.phone },
          });

          if (existing) {
            // Update existing contact
            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                ...(row.name && { name: row.name }),
                ...(row.email && { email: row.email }),
                ...(row.stage && { stage: row.stage.toLowerCase() }),
                ...(row.tags && { tags: row.tags }),
                ...(row.channel && { channel: row.channel.toLowerCase() }),
              },
            });
          } else {
            // Create new contact
            const newContact = await prisma.contact.create({
              data: {
                workspaceId,
                name: row.name || row.phone,
                phone: row.phone,
                email: row.email || null,
                stage: row.stage?.toLowerCase() || 'new',
                tags: row.tags || '',
                channel: row.channel?.toLowerCase() || 'whatsapp',
                leadScore: 0,
              },
            });

            // Auto-create a conversation linked to the new contact
            await prisma.conversation.create({
              data: {
                workspaceId,
                contactId: newContact.id,
                channel: row.channel?.toLowerCase() || 'whatsapp',
                status: 'open',
              },
            });
          }

          imported++;
        } catch (err) {
          failed++;
          errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      });

      await Promise.allSettled(operations);
    }

    res.json({
      imported,
      failed,
      errors: errors.slice(0, 50), // Limit error messages
      total: normalizedRecords.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import contacts', details: String(error) });
  }
});

export default importRouter;
