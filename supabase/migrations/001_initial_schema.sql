-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'helper', 'tester', 'early_access')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ip TEXT
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  explorer_data JSONB DEFAULT '[]'::jsonb,
  open_scripts JSONB DEFAULT '[]'::jsonb,
  invite_code TEXT UNIQUE NOT NULL,
  collaborators JSONB DEFAULT '[]'::jsonb,
  chat_threads JSONB DEFAULT '[]'::jsonb,
  active_thread_id TEXT
);

-- Create chat_threads table for better structure
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_invite_code ON projects(invite_code);
CREATE INDEX IF NOT EXISTS idx_chat_threads_project_id ON chat_threads(project_id);

-- Insert admin user (replace with actual values)
INSERT INTO users (email, username, nickname, password_hash, is_admin, role)
VALUES (
  'admin@robloxstudio.dev',
  'Owner Noel',
  'Owner Noel',
  '$2a$10$rQZ8J8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ8zKJ', -- Replace with actual hash
  true,
  'user'
) ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Collaborators can view projects" ON projects
  FOR SELECT USING (auth.uid()::text = ANY(collaborators));

-- Create policies for chat_threads table
CREATE POLICY "Users can view chat threads of their projects" ON chat_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_threads.project_id
      AND (projects.user_id = auth.uid() OR auth.uid()::text = ANY(projects.collaborators))
    )
  );

CREATE POLICY "Users can insert chat threads to their projects" ON chat_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_threads.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chat threads of their projects" ON chat_threads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_threads.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chat threads of their projects" ON chat_threads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_threads.project_id
      AND projects.user_id = auth.uid()
    )
  );
