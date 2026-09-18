import { handlePOST as runAi } from '@/packages/ai/src/http';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@db';
import { artists, clients, conversations, messages, phoneNumbers, twilioAccounts } from '@db/schema';
import { decryptSecret, sendSms, validateTwilioSignature } from '@integrations/twilio';

async function parseForm(request: NextRequest) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string') params[key] = value;
  return params;
}

export async function POST(request: NextRequest) {
  const params = await parseForm(request);
  const from = params.From?.trim();
  const to = params.To?.trim();
  const text = params.Body?.trim();
  if (!from || !to || !text) return new NextResponse('Missing From, To, or Body', { status: 400 });

  const number = (await db.select().from(phoneNumbers).where(and(eq(phoneNumbers.phoneNumber, to), eq(phoneNumbers.active, true))).limit(1))[0];
  if (!number) return new NextResponse('No artist is mapped to this Twilio number', { status: 422 });
  const [artist] = await db.select().from(artists).where(and(eq(artists.id, number.artistId), eq(artists.organizationId, number.organizationId)));
  if (!artist) return new NextResponse('Artist not found', { status: 404 });
  const [account] = number.twilioAccountId ? await db.select().from(twilioAccounts).where(and(eq(twilioAccounts.id, number.twilioAccountId), eq(twilioAccounts.organizationId, number.organizationId))) : [];
  const authToken = account ? decryptSecret(account.authTokenEncrypted) : process.env.TWILIO_AUTH_TOKEN;

  if (process.env.NODE_ENV === 'production' || process.env.TWILIO_VALIDATE_SIGNATURE !== 'false') {
    const signature = request.headers.get('x-twilio-signature');
    const publicUrl = process.env.TWILIO_WEBHOOK_BASE_URL ? `${process.env.TWILIO_WEBHOOK_BASE_URL.replace(/\/$/, '')}/api/twilio/inbound` : (process.env.TWILIO_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/inbound`);
    if (!signature || !validateTwilioSignature({ signature, url: publicUrl, params, authToken })) return new NextResponse('Invalid Twilio signature', { status: 403 });
  }

  let [client] = await db.select().from(clients).where(and(eq(clients.organizationId, number.organizationId), eq(clients.phone, from))).limit(1);
  if (!client) {
    [client] = await db.insert(clients).values({ organizationId: number.organizationId, firstName: params.ProfileName?.split(' ')[0] || 'SMS', lastName: params.ProfileName?.split(' ').slice(1).join(' ') || null, phone: from, smsOptIn: true }).returning();
  }
  const [conversation] = await db.select().from(conversations).where(and(eq(conversations.organizationId, number.organizationId), eq(conversations.artistId, number.artistId), eq(conversations.clientId, client.id), eq(conversations.channel, 'SMS'), eq(conversations.status, 'OPEN'))).orderBy(asc(conversations.createdAt)).limit(1);
  const conv = conversation ?? (await db.insert(conversations).values({ organizationId: number.organizationId, artistId: number.artistId, clientId: client.id, channel: 'SMS', status: 'OPEN', aiEnabled: true, lastMessageAt: new Date() }).returning())[0];

  const upper = text.toUpperCase();
  if (['STOP','UNSUBSCRIBE','CANCEL','END','QUIT'].includes(upper)) {
    await db.update(clients).set({ smsOptIn: false, updatedAt: new Date() }).where(eq(clients.id, client.id));
    await db.insert(messages).values({ conversationId: conv.id, senderType: 'CLIENT', role: 'user', content: text, externalMessageId: params.MessageSid, metadata: { provider: 'twilio' } });
    await sendSms({ to: from, from: to, body: 'You have been opted out of SMS messages. Reply START to opt back in.', accountSid: account?.accountSid, authToken });
    return new NextResponse('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }
  if (['START','UNSTOP','YES'].includes(upper)) {
    await db.update(clients).set({ smsOptIn: true, updatedAt: new Date() }).where(eq(clients.id, client.id));
    await db.insert(messages).values({ conversationId: conv.id, senderType: 'CLIENT', role: 'user', content: text, externalMessageId: params.MessageSid, metadata: { provider: 'twilio' } });
    await sendSms({ to: from, from: to, body: `You're opted back in to ${artist.displayName}'s SMS messages.`, accountSid: account?.accountSid, authToken });
    return new NextResponse('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
  }

  await db.insert(messages).values({ conversationId: conv.id, senderType: 'CLIENT', role: 'user', content: text, externalMessageId: params.MessageSid, metadata: { provider: 'twilio' } });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const aiRes = await runAi(new NextRequest(`${base}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, organizationId: number.organizationId, artistId: number.artistId, clientId: client.id, conversationId: conv.id }) }));
  const aiData = await aiRes.json();
  if (!aiRes.ok || !aiData.reply) return new NextResponse('AI processing failed', { status: 500 });
  if (client.smsOptIn) await sendSms({ to: from, from: to, body: aiData.reply, accountSid: account?.accountSid, authToken });
  return new NextResponse('<Response></Response>', { headers: { 'Content-Type': 'text/xml' } });
}
