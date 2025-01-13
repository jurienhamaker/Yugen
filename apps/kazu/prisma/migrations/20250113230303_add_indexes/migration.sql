-- CreateIndex
CREATE INDEX "Game_guildId_idx" ON "Game"("guildId");

-- CreateIndex
CREATE INDEX "History_userId_gameId_idx" ON "History"("userId", "gameId");

-- CreateIndex
CREATE INDEX "PlayerSaves_userId_idx" ON "PlayerSaves"("userId");

-- CreateIndex
CREATE INDEX "PlayerStats_userId_guildId_idx" ON "PlayerStats"("userId", "guildId");

-- CreateIndex
CREATE INDEX "Settings_guildId_idx" ON "Settings"("guildId");
