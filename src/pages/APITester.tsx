import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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

const APITester = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [route, setRoute] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [password, setPassword] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [queryParams, setQueryParams] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  useEffect(() => {
    if (routeId) {
      fetchRoute();
    }
  }, [routeId]);

  const fetchRoute = async () => {
    const { data, error } = await supabase
      .from("api_routes")
      .select("*, db_tables!inner(name)")
      .eq("id", routeId)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar rota",
        description: error.message,
      });
      return;
    }

    setRoute(data);
    fetchColumns(data.table_id);
  };

  const fetchColumns = async (tableId: string) => {
    const { data, error } = await supabase
      .from("table_columns")
      .select("*")
      .eq("table_id", tableId)
      .order("column_order");

    if (!error && data) {
      setColumns(data);
      
      // Pre-fill request body for POST/PUT
      if (data.length > 0) {
        const template: any = {};
        data.forEach((col) => {
          template[col.name] = "";
        });
        setRequestBody(JSON.stringify(template, null, 2));
      }
    }
  };

  const executeRequest = async () => {
    if (!route) return;

    setLoading(true);
    setResponse(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      let url = `${supabaseUrl}/functions/v1/api-router?path=${encodeURIComponent(route.route_path)}`;
      
      if (queryParams) {
        url += `&${queryParams}`;
      }

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (route.is_private && password) {
        headers['x-route-password'] = password;
      }

      const options: any = {
        method: route.http_method,
        headers,
      };

      if (route.http_method === 'POST' || route.http_method === 'PUT') {
        try {
          options.body = requestBody;
        } catch (e) {
          toast({
            variant: "destructive",
            title: "JSON inválido",
            description: "O corpo da requisição deve ser um JSON válido",
          });
          setLoading(false);
          return;
        }
      }

      const res = await fetch(url, options);
      const data = await res.json();
      
      setResponse({
        status: res.status,
        data,
      });

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: `Erro ${res.status}`,
          description: data.error || "Ocorreu um erro na requisição",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Requisição executada com sucesso",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na requisição",
        description: error.message,
      });
    }

    setLoading(false);
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/api-router?path=${encodeURIComponent(route.route_path)}&deleteAll=true`;

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (route.is_private && password) {
        headers['x-route-password'] = password;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      
      setResponse({
        status: res.status,
        data,
      });

      if (!res.ok) {
        toast({
          variant: "destructive",
          title: `Erro ${res.status}`,
          description: data.error || "Ocorreu um erro ao deletar",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Todos os registros foram deletados",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na requisição",
        description: error.message,
      });
    }

    setLoading(false);
    setShowDeleteAll(false);
  };

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Testar API: {route.route_name}</h1>
            <Badge className={
              route.http_method === 'GET' ? 'bg-blue-500' :
              route.http_method === 'POST' ? 'bg-green-500' :
              route.http_method === 'PUT' ? 'bg-yellow-500' :
              'bg-red-500'
            }>
              {route.http_method}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração da Requisição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-router?path=${route.route_path}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                </div>

                {route.is_private && (
                  <div className="space-y-2">
                    <Label>Senha de Acesso</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite a senha da rota"
                    />
                  </div>
                )}

                {(route.http_method === 'GET' || route.http_method === 'DELETE') && (
                  <div className="space-y-2">
                    <Label>Parâmetros de Query (opcional)</Label>
                    <Input
                      value={queryParams}
                      onChange={(e) => setQueryParams(e.target.value)}
                      placeholder="Ex: id=123"
                    />
                  </div>
                )}

                {(route.http_method === 'POST' || route.http_method === 'PUT') && (
                  <div className="space-y-2">
                    <Label>Corpo da Requisição (JSON)</Label>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="font-mono text-sm"
                      rows={10}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={executeRequest} disabled={loading} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    {loading ? "Executando..." : "Executar"}
                  </Button>
                  
                  {route.http_method === 'DELETE' && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteAll(true)}
                      disabled={loading}
                    >
                      Deletar Tudo
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schema da Tabela</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {columns.map((col) => (
                    <div key={col.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{col.data_type}</Badge>
                      <span className="font-mono">{col.name}</span>
                      {col.is_primary_key && <Badge>PK</Badge>}
                      {col.is_unique && <Badge variant="secondary">Unique</Badge>}
                      {!col.is_nullable && <Badge variant="secondary">Required</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              {response ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label>Status:</Label>
                    <Badge variant={response.status < 300 ? "default" : "destructive"}>
                      {response.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Dados:</Label>
                    <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Execute uma requisição para ver a resposta
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Atenção!</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar TODOS os registros da tabela {route.db_tables.name}? 
              Esta ação é IRREVERSÍVEL e apagará permanentemente todos os dados!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
              Sim, deletar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default APITester;