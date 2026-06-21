import { prisma } from '../prisma';

interface ScoreEvent {
  workspaceId: string;
  contactId: string;
  event: string;
}

const DEFAULT_RULES: Record<string, number> = {
  message_sent: 1,
  stage_progression: 5,
  flow_completed: 10,
  tag_added: 2,
  followup_created: 3,
  inbound_message: 1,
  repeat_visit: 2,
};

export async function processLeadScore(event: ScoreEvent) {
  try {
    const rules = await prisma.leadScoringRule.findMany({
      where: { workspaceId: event.workspaceId, isActive: true },
    });

    let points = 0;

    const matchedRule = rules.find((r) => r.event === event.event);
    if (matchedRule) {
      points = matchedRule.points;
    } else if (DEFAULT_RULES[event.event]) {
      points = DEFAULT_RULES[event.event];
    }

    if (points === 0) return;

    const contact = await prisma.contact.update({
      where: { id: event.contactId },
      data: { leadScore: { increment: points } },
    });

    // Auto-tag based on score thresholds
    const tags = contact.tags ? contact.tags.split(',').map((t) => t.trim()) : [];

    if (contact.leadScore >= 51 && !tags.includes('very_hot')) {
      tags.push('very_hot');
    } else if (contact.leadScore >= 26 && !tags.includes('hot')) {
      tags.push('hot');
    } else if (contact.leadScore >= 11 && !tags.includes('warm')) {
      tags.push('warm');
    } else if (contact.leadScore >= 1 && !tags.includes('cold_lead')) {
      tags.push('cold_lead');
    }

    await prisma.contact.update({
      where: { id: event.contactId },
      data: { tags: tags.join(',') },
    });

    return contact.leadScore;
  } catch (error) {
    console.error('Lead scoring error:', error);
    return null;
  }
}

export function getLeadTemperature(score: number): string {
  if (score >= 51) return 'very_hot';
  if (score >= 26) return 'hot';
  if (score >= 11) return 'warm';
  return 'cold';
}
