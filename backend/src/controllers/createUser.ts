import { verifyWebhook } from '@clerk/express/webhooks'
import { prisma } from "../services/prisma";
import type { Request, Response } from "express";

async function createUser(req: Request, res: Response) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type !== 'user.created') {
      return res.status(200).send('Event ignored');
    }

    const { id, first_name, last_name } = evt.data;

    const newUser =await prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        fname: first_name,
        lname: last_name,
      },
    });

     console.log('Created new user:', newUser); // REMOVE LATER ON

    return res.status(200).send('Webhook received');
  } catch (err: unknown) {

    console.error('Error processing webhook:', err);
    return res.status(400).send('Error processing webhook');
  }
}

export default createUser;