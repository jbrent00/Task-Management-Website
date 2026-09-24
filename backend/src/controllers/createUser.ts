import { verifyWebhook } from '@clerk/express/webhooks'
import type { Request, Response } from "express";
import { syncUserProfile } from '../services/userProfile';

async function createUser(req: Request, res: Response) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type !== 'user.created' && evt.type !== 'user.updated') {
      return res.status(200).send('Event ignored');
    }

    await syncUserProfile(evt.data);

    return res.status(200).send('Webhook received');
  } catch (err: unknown) {

    console.error('Error processing webhook:', err);
    return res.status(400).send('Error processing webhook');
  }
}

export default createUser;
