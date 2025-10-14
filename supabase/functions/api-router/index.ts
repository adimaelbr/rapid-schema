import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-route-password',
};

// Input validation helpers
const validateUUID = (id: string | null): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const validateRequestBody = (body: any, maxSize = 100): boolean => {
  if (!body || typeof body !== 'object') return false;
  const jsonString = JSON.stringify(body);
  return jsonString.length <= maxSize * 1024; // maxSize in KB
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const routePath = url.searchParams.get('path');
    const method = req.method;

    if (!routePath) {
      return new Response(
        JSON.stringify({ error: 'Route path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the route
    const { data: route, error: routeError } = await supabase
      .from('api_routes')
      .select('*, db_tables!inner(name, database_id)')
      .eq('route_path', routePath)
      .eq('http_method', method)
      .single();

    if (routeError || !route) {
      return new Response(
        JSON.stringify({ error: 'Route not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if route is private and verify password using pgcrypto
    if (route.is_private) {
      const providedPassword = req.headers.get('x-route-password');
      if (!providedPassword) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Password required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password using pgcrypto crypt function
      const { data: passwordCheck, error: pwError } = await supabase
        .rpc('verify_route_password', { 
          route_id: route.id, 
          provided_password: providedPassword 
        });

      if (pwError || !passwordCheck) {
        console.error('Password verification failed:', pwError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get table columns
    const { data: columns, error: columnsError } = await supabase
      .from('table_columns')
      .select('*')
      .eq('table_id', route.table_id)
      .order('column_order');

    if (columnsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch table schema' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tableName = route.db_tables.name;

    // Handle different HTTP methods
    switch (method) {
      case 'GET': {
        const id = url.searchParams.get('id');
        
        if (id && !validateUUID(id)) {
          return new Response(
            JSON.stringify({ error: 'Invalid ID format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let query = supabase.from(tableName).select('*').limit(1000);
        
        if (id) {
          query = query.eq('id', id);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('[API Router] GET error:', { route: routePath, error: error.message, code: error.code });
          return new Response(
            JSON.stringify({ error: 'Failed to fetch data' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data, schema: columns }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'POST': {
        const body = await req.json();
        
        if (!validateRequestBody(body)) {
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from(tableName)
          .insert(body)
          .select();

        if (error) {
          console.error('[API Router] POST error:', { route: routePath, error: error.message, code: error.code });
          
          const safeError = error.code === '23505' ? 'Duplicate entry' :
                           error.code === '23503' ? 'Invalid reference' : 
                           'Failed to create record';
          
          return new Response(
            JSON.stringify({ error: safeError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data, message: 'Record created successfully' }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'PUT': {
        const body = await req.json();
        const id = body.id;

        if (!validateRequestBody(body)) {
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!id || !validateUUID(id)) {
          return new Response(
            JSON.stringify({ error: 'Valid ID is required for update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from(tableName)
          .update(body)
          .eq('id', id)
          .select();

        if (error) {
          console.error('[API Router] PUT error:', { route: routePath, error: error.message, code: error.code });
          
          const safeError = error.code === '23505' ? 'Duplicate entry' :
                           error.code === '23503' ? 'Invalid reference' : 
                           'Failed to update record';
          
          return new Response(
            JSON.stringify({ error: safeError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data, message: 'Record updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        const deleteAll = url.searchParams.get('deleteAll') === 'true';
        
        if (deleteAll) {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

          if (error) {
            console.error('[API Router] DELETE ALL error:', { route: routePath, error: error.message });
            return new Response(
              JSON.stringify({ error: 'Failed to delete records' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ message: 'All records deleted successfully' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const id = url.searchParams.get('id');
        if (!id || !validateUUID(id)) {
          return new Response(
            JSON.stringify({ error: 'Valid ID is required for delete' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[API Router] DELETE error:', { route: routePath, error: error.message });
          return new Response(
            JSON.stringify({ error: 'Failed to delete record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Record deleted successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[API Router] Critical error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});