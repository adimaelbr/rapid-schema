-- Create enum for HTTP methods
CREATE TYPE public.http_method AS ENUM ('GET', 'POST', 'PUT', 'DELETE');

-- Create table for API routes
CREATE TABLE public.api_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  route_name TEXT NOT NULL,
  route_path TEXT NOT NULL,
  http_method http_method NOT NULL,
  database_id UUID NOT NULL,
  table_id UUID NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  access_password TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, route_path, http_method)
);

-- Enable RLS
ALTER TABLE public.api_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_routes
CREATE POLICY "Users can view routes of their projects"
ON public.api_routes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = api_routes.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create routes in their projects"
ON public.api_routes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = api_routes.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update routes in their projects"
ON public.api_routes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = api_routes.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete routes in their projects"
ON public.api_routes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = api_routes.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_api_routes_updated_at
BEFORE UPDATE ON public.api_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();