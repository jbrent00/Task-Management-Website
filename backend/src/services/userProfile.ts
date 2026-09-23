import { clerkClient } from '@clerk/express';
import { prisma } from './prisma';

type ClerkEmail = { email_address?: string; emailAddress?: string; id?: string; verification?: { status?: string } | null };
type ClerkUserData = {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    image_url?: string | null;
    imageUrl?: string | null;
    primary_email_address_id?: string | null;
    primaryEmailAddressId?: string | null;
    email_addresses?: ClerkEmail[];
    emailAddresses?: ClerkEmail[];
};

const normalizeEmail = (email: string) => email.trim().toLocaleLowerCase();

export async function syncUserProfile(data: ClerkUserData) {
    const emails = data.email_addresses ?? data.emailAddresses ?? [];
    const primaryId = data.primary_email_address_id ?? data.primaryEmailAddressId;
    const verified = emails.filter((entry) => (entry.email_address ?? entry.emailAddress) && (!entry.verification || entry.verification.status === 'verified'));
    const primary = emails.find((entry) => entry.id === primaryId) ?? verified[0] ?? emails[0];
    const primaryEmail = primary?.email_address ?? primary?.emailAddress ?? null;

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({
            where: { id: data.id },
            update: {
                fname: data.first_name ?? data.firstName ?? null,
                lname: data.last_name ?? data.lastName ?? null,
                primaryEmail,
                imageUrl: data.image_url ?? data.imageUrl ?? null,
            },
            create: {
                id: data.id,
                fname: data.first_name ?? data.firstName ?? null,
                lname: data.last_name ?? data.lastName ?? null,
                primaryEmail,
                imageUrl: data.image_url ?? data.imageUrl ?? null,
            },
        });
        await tx.userEmail.deleteMany({ where: { userId: data.id } });
        if (verified.length) {
            await tx.userEmail.createMany({ data: verified.map((entry) => {
                const email = (entry.email_address ?? entry.emailAddress)!;
                return { userId: data.id, email, normalizedEmail: normalizeEmail(email), primary: entry.id === primaryId };
            }) });
        }
        return user;
    });
}

export async function ensureCurrentUserProfile(userId: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId }, include: { emails: { take: 1 } } });
    if (existing?.emails.length) return existing;
    const clerkUser = await clerkClient.users.getUser(userId);
    return syncUserProfile(clerkUser as unknown as ClerkUserData);
}

export async function getVerifiedEmails(userId: string) {
    await ensureCurrentUserProfile(userId);
    return prisma.userEmail.findMany({ where: { userId }, select: { normalizedEmail: true } });
}
