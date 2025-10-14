-- Add ON DELETE CASCADE to foreign keys if not already present

-- Drop existing foreign keys and recreate with CASCADE
ALTER TABLE databases DROP CONSTRAINT IF EXISTS databases_project_id_fkey;
ALTER TABLE databases ADD CONSTRAINT databases_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE db_tables DROP CONSTRAINT IF EXISTS db_tables_database_id_fkey;
ALTER TABLE db_tables ADD CONSTRAINT db_tables_database_id_fkey 
  FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE;

ALTER TABLE table_columns DROP CONSTRAINT IF EXISTS table_columns_table_id_fkey;
ALTER TABLE table_columns ADD CONSTRAINT table_columns_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES db_tables(id) ON DELETE CASCADE;

ALTER TABLE table_relationships DROP CONSTRAINT IF EXISTS table_relationships_source_table_id_fkey;
ALTER TABLE table_relationships ADD CONSTRAINT table_relationships_source_table_id_fkey 
  FOREIGN KEY (source_table_id) REFERENCES db_tables(id) ON DELETE CASCADE;

ALTER TABLE table_relationships DROP CONSTRAINT IF EXISTS table_relationships_target_table_id_fkey;
ALTER TABLE table_relationships ADD CONSTRAINT table_relationships_target_table_id_fkey 
  FOREIGN KEY (target_table_id) REFERENCES db_tables(id) ON DELETE CASCADE;

ALTER TABLE table_relationships DROP CONSTRAINT IF EXISTS table_relationships_source_column_id_fkey;
ALTER TABLE table_relationships ADD CONSTRAINT table_relationships_source_column_id_fkey 
  FOREIGN KEY (source_column_id) REFERENCES table_columns(id) ON DELETE CASCADE;

ALTER TABLE table_relationships DROP CONSTRAINT IF EXISTS table_relationships_target_column_id_fkey;
ALTER TABLE table_relationships ADD CONSTRAINT table_relationships_target_column_id_fkey 
  FOREIGN KEY (target_column_id) REFERENCES table_columns(id) ON DELETE CASCADE;

ALTER TABLE api_routes DROP CONSTRAINT IF EXISTS api_routes_project_id_fkey;
ALTER TABLE api_routes ADD CONSTRAINT api_routes_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE api_routes DROP CONSTRAINT IF EXISTS api_routes_table_id_fkey;
ALTER TABLE api_routes ADD CONSTRAINT api_routes_table_id_fkey 
  FOREIGN KEY (table_id) REFERENCES db_tables(id) ON DELETE CASCADE;

ALTER TABLE api_routes DROP CONSTRAINT IF EXISTS api_routes_database_id_fkey;
ALTER TABLE api_routes ADD CONSTRAINT api_routes_database_id_fkey 
  FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE;