-- Create enum for relationship types
CREATE TYPE public.relationship_type AS ENUM ('one_to_one', 'one_to_many', 'many_to_many');

-- Create enum for relationship strength
CREATE TYPE public.relationship_strength AS ENUM ('strong', 'weak');

-- Create table_relationships table
CREATE TABLE public.table_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table_id UUID NOT NULL,
  target_table_id UUID NOT NULL,
  source_column_id UUID NOT NULL,
  target_column_id UUID NOT NULL,
  relationship_type relationship_type NOT NULL,
  relationship_strength relationship_strength NOT NULL DEFAULT 'strong',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_source_table FOREIGN KEY (source_table_id) REFERENCES public.db_tables(id) ON DELETE CASCADE,
  CONSTRAINT fk_target_table FOREIGN KEY (target_table_id) REFERENCES public.db_tables(id) ON DELETE CASCADE,
  CONSTRAINT fk_source_column FOREIGN KEY (source_column_id) REFERENCES public.table_columns(id) ON DELETE CASCADE,
  CONSTRAINT fk_target_column FOREIGN KEY (target_column_id) REFERENCES public.table_columns(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.table_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view relationships of their tables"
ON public.table_relationships
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM db_tables
  JOIN databases ON databases.id = db_tables.database_id
  JOIN projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_relationships.source_table_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can create relationships in their tables"
ON public.table_relationships
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM db_tables
  JOIN databases ON databases.id = db_tables.database_id
  JOIN projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_relationships.source_table_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update relationships in their tables"
ON public.table_relationships
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM db_tables
  JOIN databases ON databases.id = db_tables.database_id
  JOIN projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_relationships.source_table_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete relationships in their tables"
ON public.table_relationships
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM db_tables
  JOIN databases ON databases.id = db_tables.database_id
  JOIN projects ON projects.id = databases.project_id
  WHERE db_tables.id = table_relationships.source_table_id
  AND projects.user_id = auth.uid()
));