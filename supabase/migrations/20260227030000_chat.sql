-- ContentHive — Sprint 2: BYOK LLM Chat
-- Migration: 20260227030000_chat

-- ─── LLM provider enum ────────────────────────────────────────────────────────

CREATE TYPE llm_provider AS ENUM ('claude', 'gpt', 'gemini', 'grok', 'deepseek', 'qwen');

-- ─── User API keys (AES-256-GCM encrypted, never stored in plaintext) ─────────

CREATE TABLE user_api_keys (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider    llm_provider NOT NULL,
  encrypted_key text      NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ─── Conversations ────────────────────────────────────────────────────────────

CREATE TABLE conversations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider   llm_provider NOT NULL,
  title      text        NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Messages ─────────────────────────────────────────────────────────────────

CREATE TABLE messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX messages_conv_created ON messages(conversation_id, created_at);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own api keys"
  ON user_api_keys FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own conversations"
  ON conversations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages inherit visibility from their parent conversation
CREATE POLICY "users manage own messages"
  ON messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- ─── Trigger: bump conversation.updated_at on new message ────────────────────

CREATE OR REPLACE FUNCTION bump_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_bump_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION bump_conversation_updated_at();
