CREATE TABLE "AiGenerationLimit" (
    "userId" TEXT NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AiGenerationLimit_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "AiGenerationLimit" ADD CONSTRAINT "AiGenerationLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
