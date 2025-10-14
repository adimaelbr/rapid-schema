import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Copy, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface APIRoutesListProps {
  projectId: string;
  refresh: number;
}

export const APIRoutesList = ({ projectId, refresh }: APIRoutesListProps) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutes();
  }, [projectId, refresh]);

  const fetchRoutes = async () => {
    const { data, error } = await supabase
      .from("api_routes")
      .select("*, db_tables!inner(name), databases!inner(name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRoutes(data);
    }
  };

  const handleDelete = async () => {
    if (!deleteRouteId) return;

    const { error } = await supabase
      .from("api_routes")
      .delete()
      .eq("id", deleteRouteId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar rota",
        description: error.message,
      });
    } else {
      toast({
        title: "Rota deletada!",
        description: "A rota foi removida com sucesso",
      });
      fetchRoutes();
    }

    setDeleteRouteId(null);
  };

  const getRouteUrl = (route: any) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/api-router?path=${encodeURIComponent(route.route_path)}`;
  };

  const copyUrl = (route: any) => {
    navigator.clipboard.writeText(getRouteUrl(route));
    toast({
      title: "URL copiada!",
      description: "A URL da rota foi copiada para a área de transferência",
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "PUT":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <div className="space-y-4">
        {routes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma rota criada ainda
            </CardContent>
          </Card>
        ) : (
          routes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{route.route_name}</CardTitle>
                      <Badge className={getMethodColor(route.http_method)}>
                        {route.http_method}
                      </Badge>
                      {route.is_private ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="w-3 h-3" />
                          Privada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Unlock className="w-3 h-3" />
                          Pública
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <strong>Caminho:</strong> {route.route_path}
                      </div>
                      <div>
                        <strong>Banco:</strong> {route.databases.name}
                      </div>
                      <div>
                        <strong>Tabela:</strong> {route.db_tables.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>URL:</strong>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {getRouteUrl(route)}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(route)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api-test/${route.id}`, '_blank')}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteRouteId(route.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteRouteId} onOpenChange={() => setDeleteRouteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta rota? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};