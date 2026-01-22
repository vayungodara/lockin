-- Allow users to update their own focus sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;

CREATE POLICY "Users can update own focus sessions" ON focus_sessions
  FOR UPDATE USING (auth.uid() = user_id);
