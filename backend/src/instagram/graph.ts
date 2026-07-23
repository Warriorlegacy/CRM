import axios from 'axios';
import { env } from '../env';
import { InstagramSendMessageParams } from './types';
import { withAppSecretProof } from '../utils/meta';

export async function sendInstagramMessage(params: InstagramSendMessageParams) {
  const { accessToken, igUserId, recipientId, text } = params;

  const url = `https://graph.facebook.com/${env.META_API_VERSION}/${igUserId}/messages`;

  const resp = await axios.post(
    url,
    {
      recipient: { id: recipientId },
      message: { text },
    },
    {
      params: withAppSecretProof(accessToken),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return resp.data;
}
