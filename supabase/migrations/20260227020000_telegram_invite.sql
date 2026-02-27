-- ContentHive — Sprint 1: Telegram notification support
-- Migration: 20260227020000_telegram_invite
--
-- Adds telegram_chat_id to profiles so users can receive Telegram notifications.
-- The invite-code gate lives purely in env vars — no DB changes needed for that.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id text;
