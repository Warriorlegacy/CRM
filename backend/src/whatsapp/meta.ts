import axios from 'axios';
import { env } from '../env';
import { withAppSecretProof } from '../utils/meta';

export async function sendWhatsAppText(params: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}) {
  const { accessToken, phoneNumberId, to, text } = params;

  const url = `https://graph.facebook.com/${env.META_API_VERSION}/${phoneNumberId}/messages`;

  const resp = await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
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
