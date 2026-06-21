export interface InstagramWebhookEntry {
  id: string;
  time: number;
  changes: InstagramWebhookChange[];
}

export interface InstagramWebhookChange {
  value: InstagramWebhookValue;
  field: string;
}

export interface InstagramWebhookValue {
  messaging: InstagramMessagingEvent[];
  object: string;
}

export interface InstagramMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: InstagramMessage;
}

export interface InstagramMessage {
  mid: string;
  text?: string;
  attachments?: InstagramAttachment[];
  is_echo?: boolean;
  quick_reply?: { payload: string };
}

export interface InstagramAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'location' | 'fallback';
  payload: { url?: string; coordinates?: { lat: number; long: number } };
}

export interface InstagramSendMessageParams {
  accessToken: string;
  igUserId: string;
  recipientId: string;
  text: string;
}

export interface InstagramWebhookBody {
  object: string;
  entry: InstagramWebhookEntry[];
}

export interface ParsedInboundInstagram {
  igUserId: string;
  from: string;
  igMessageId: string;
  type: string;
  bodyText: string | null;
  raw: InstagramWebhookBody;
}
