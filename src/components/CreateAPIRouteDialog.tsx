import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface CreateAPIRouteDialogProps {
  projectId: string;
  databases: any[];
  onRouteCreated: () => void;
}

export const CreateAPIRouteDialog = ({ projectId, databases, onRouteCreated }: CreateAPIRouteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [routePath, setRoutePath] = useState("");
  const [httpMethod, setHttpMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [databaseId, setDatabaseId] = useState("");
  const [tableId, setTableId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [tables, setTables] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchTables = async (dbId: string) => {
    const { data, error } = await supabase
      .from("db_tables")
      .select("*")
      .eq("database_id", dbId);

    if (!error && data) {
      setTables(data);
    }
  };

  const handleDatabaseChange = (dbId: string) => {
    setDatabaseId(dbId);
    setTableId("");
    fetchTables(dbId);
  };

  const handleSubmit = async () => {
    if (!routeName || !routePath || !databaseId || !tableId) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
      });
      return;
    }

    if (isPrivate && !password) {
      toast({
        variant: "destructive",
        title: "Senha obrigatória",
        description: "Rotas privadas precisam de uma senha",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("api_routes").insert({
      project_id: projectId,
      route_name: routeName,
      route_path: routePath,
      http_method: httpMethod,
      database_id: databaseId,
      table_id: tableId,
      is_private: isPrivate,
      access_password: isPrivate ? password : null,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar rota",
        description: error.message,
      });
    } else {
      toast({
        title: "Rota criada!",
        description: "A rota da API foi criada com sucesso",
      });
      setOpen(false);
      setRouteName("");
      setRoutePath("");
      setHttpMethod("GET");
      setDatabaseId("");
      setTableId("");
      setIsPrivate(false);
      setPassword("");
      onRouteCreated();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Rota API
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Rota API</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Rota</Label>
            <Input
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Ex: Listar Usuários"
            />
          </div>

          <div className="space-y-2">
            <Label>Caminho da Rota</Label>
            <Input
              value={routePath}
              onChange={(e) => setRoutePath(e.target.value)}
              placeholder="Ex: /users"
            />
          </div>

          <div className="space-y-2">
            <Label>Método HTTP</Label>
            <Select value={httpMethod} onValueChange={(value: any) => setHttpMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Banco de Dados</Label>
            <Select value={databaseId} onValueChange={handleDatabaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco de dados" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    {db.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {databaseId && (
            <div className="space-y-2">
              <Label>Tabela</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma tabela" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            />
            <label htmlFor="private" className="text-sm cursor-pointer">
              Rota Privada (requer senha)
            </label>
          </div>

          {isPrivate && (
            <div className="space-y-2">
              <Label>Senha de Acesso</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite uma senha segura"
              />
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Rota"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};