-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create databases table
CREATE TABLE public.databases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.databases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view databases of their projects" 
ON public.databases 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = databases.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create databases for their projects" 
ON public.databases 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = databases.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update databases of their projects" 
ON public.databases 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = databases.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete databases of their projects" 
ON public.databases 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = databases.project_id 
  AND projects.user_id = auth.uid()
));

-- Create tables table
CREATE TABLE public.db_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  database_id UUID NOT NULL REFERENCES public.databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.db_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tables of their databases" 
ON public.db_tables 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.databases 
  JOIN public.projects ON projects.id = databases.project_id
  WHERE databases.id = db_tables.database_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create tables in their databases" 
ON public.db_tables 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.databases 
  JOIN public.projects ON projects.id = databases.project_id
  WHERE databases.id = db_tables.database_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update tables in their databases" 
ON public.db_tables 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.databases 
  JOIN public.projects ON projects.id = databases.project_id
  WHERE databases.id = db_tables.database_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete tables in their databases" 
ON public.db_tables 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.databases 
  JOIN public.projects ON projects.id = databases.project_id
  WHERE databases.id = db_tables.database_id 
  AND projects.user_id = auth.uid()
));

-- Create table columns table
CREATE TABLE public.table_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.db_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  is_primary_key BOOLEAN NOT NULL DEFAULT false,
  is_unique BOOLEAN NOT NULL DEFAULT false,
  is_nullable BOOLEAN NOT NULL DEFAULT true,
  is_auto_increment BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT,
  column_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.table_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view columns of their tables" 
ON public.table_columns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.db_tables 
  JOIN public.databases ON databases.id = db_tables.database_id
  JOIN public.projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_columns.table_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create columns in their tables" 
ON public.table_columns 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.db_tables 
  JOIN public.databases ON databases.id = db_tables.database_id
  JOIN public.projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_columns.table_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update columns in their tables" 
ON public.table_columns 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.db_tables 
  JOIN public.databases ON databases.id = db_tables.database_id
  JOIN public.projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_columns.table_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete columns in their tables" 
ON public.table_columns 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.db_tables 
  JOIN public.databases ON databases.id = db_tables.database_id
  JOIN public.projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_columns.table_id 
  AND projects.user_id = auth.uid()
));