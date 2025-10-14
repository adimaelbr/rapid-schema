import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Database as DatabaseIcon, Table, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateAPIRouteDialog } from "@/components/CreateAPIRouteDialog";
import { APIRoutesList } from "@/components/APIRoutesList";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Database {
  id: string;
  name: string;
  created_at: string;
}

interface DbTable {
  id: string;
  name: string;
}

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [dbName, setDbName] = useState("");
  const [tableName, setTableName] = useState("");
  const [loading, setLoading] = useState(false);
  const [openDbDialog, setOpenDbDialog] = useState(false);
  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [refreshRoutes, setRefreshRoutes] = useState(0);
  const [deleteDbDialog, setDeleteDbDialog] = useState<{ open: boolean; dbId: string; dbName: string }>({
    open: false,
    dbId: "",
    dbName: "",
  });
  const [deleteTableDialog, setDeleteTableDialog] = useState<{ open: boolean; tableId: string; tableName: string }>({
    open: false,
    tableId: "",
    tableName: "",
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchDatabases();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedDb) {
      fetchTables();
    }
  }, [selectedDb]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar projeto",
        description: error.message,
      });
    } else {
      setProject(data);
    }
  };

  const fetchDatabases = async () => {
    const { data, error } = await supabase
      .from("databases")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar databases",
        description: error.message,
      });
    } else {
      setDatabases(data || []);
      if (data && data.length > 0 && !selectedDb) {
        setSelectedDb(data[0].id);
      }
    }
  };

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from("db_tables")
      .select("*")
      .eq("database_id", selectedDb);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar tabelas",
        description: error.message,
      });
    } else {
      setTables(data || []);
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("databases").insert({
      project_id: projectId,
      name: dbName,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar database",
        description: error.message,
      });
    } else {
      toast({
        title: "Database criado!",
        description: `Database "${dbName}" criado com sucesso.`,
      });
      setDbName("");
      setOpenDbDialog(false);
      fetchDatabases();
    }
    setLoading(false);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDb) return;

    setLoading(true);
    const { error } = await supabase.from("db_tables").insert({
      database_id: selectedDb,
      name: tableName,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar tabela",
        description: error.message,
      });
    } else {
      toast({
        title: "Tabela criada!",
        description: `Tabela "${tableName}" criada com sucesso.`,
      });
      setTableName("");
      setOpenTableDialog(false);
      fetchTables();
    }
    setLoading(false);
  };

  const handleDeleteDatabase = async () => {
    const { error } = await supabase.from("databases").delete().eq("id", deleteDbDialog.dbId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar database",
        description: error.message,
      });
    } else {
      toast({
        title: "Database deletado",
        description: "O database e todas as suas tabelas foram removidos com sucesso.",
      });
      if (selectedDb === deleteDbDialog.dbId) {
        setSelectedDb(null);
      }
      fetchDatabases();
    }
    setDeleteDbDialog({ open: false, dbId: "", dbName: "" });
  };

  const handleDeleteTable = async () => {
    const { error } = await supabase.from("db_tables").delete().eq("id", deleteTableDialog.tableId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar tabela",
        description: error.message,
      });
    } else {
      toast({
        title: "Tabela deletada",
        description: "A tabela foi removida com sucesso.",
      });
      fetchTables();
    }
    setDeleteTableDialog({ open: false, tableId: "", tableName: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{project?.name}</h1>
          {project?.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="databases" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="databases">Bancos de Dados</TabsTrigger>
            <TabsTrigger value="api">Rotas API RESTful</TabsTrigger>
          </TabsList>

          <TabsContent value="databases">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Databases</CardTitle>
                <Dialog open={openDbDialog} onOpenChange={setOpenDbDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Database</DialogTitle>
                      <DialogDescription>
                        Crie um novo banco de dados para este projeto
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDatabase} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="db-name">Nome do Database</Label>
                        <Input
                          id="db-name"
                          value={dbName}
                          onChange={(e) => setDbName(e.target.value)}
                          placeholder="meu_database"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Criando..." : "Criar Database"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {databases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum database criado</p>
              ) : (
                databases.map((db) => (
                  <div key={db.id} className="flex items-center gap-1">
                    <Button
                      variant={selectedDb === db.id ? "default" : "ghost"}
                      className="flex-1 justify-start"
                      onClick={() => setSelectedDb(db.id)}
                    >
                      <DatabaseIcon className="w-4 h-4 mr-2" />
                      {db.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDbDialog({ open: true, dbId: db.id, dbName: db.name });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tabelas</CardTitle>
                  <CardDescription>
                    {selectedDb ? "Gerencie as tabelas do database selecionado" : "Selecione um database"}
                  </CardDescription>
                </div>
                {selectedDb && (
                  <Dialog open={openTableDialog} onOpenChange={setOpenTableDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Tabela
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Tabela</DialogTitle>
                        <DialogDescription>
                          Crie uma nova tabela no database selecionado
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateTable} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="table-name">Nome da Tabela</Label>
                          <Input
                            id="table-name"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="usuarios"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Criando..." : "Criar Tabela"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedDb ? (
                <p className="text-muted-foreground">Selecione um database para ver as tabelas</p>
              ) : tables.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma tabela criada neste database</p>
              ) : (
                <div className="grid gap-4">
                  {tables.map((table) => (
                    <Card
                      key={table.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors group"
                      onClick={() => navigate(`/table/${table.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Table className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{table.name}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTableDialog({ open: true, tableId: table.id, tableName: table.name });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Rotas da API RESTful</h2>
                <p className="text-muted-foreground mt-1">
                  Crie e gerencie rotas de API para acessar seus dados
                </p>
              </div>
              <CreateAPIRouteDialog
                projectId={projectId!}
                databases={databases}
                onRouteCreated={() => setRefreshRoutes(prev => prev + 1)}
              />
            </div>
            <APIRoutesList projectId={projectId!} refresh={refreshRoutes} />
          </div>
        </TabsContent>
      </Tabs>
    </main>

    <DeleteConfirmDialog
      open={deleteDbDialog.open}
      onOpenChange={(open) => setDeleteDbDialog({ ...deleteDbDialog, open })}
      onConfirm={handleDeleteDatabase}
      title="Tem certeza que deseja deletar este banco de dados?"
      description="Esta ação irá deletar permanentemente o banco de dados e TODAS as suas tabelas, colunas, relacionamentos e rotas de API associadas."
      itemName={deleteDbDialog.dbName}
    />

    <DeleteConfirmDialog
      open={deleteTableDialog.open}
      onOpenChange={(open) => setDeleteTableDialog({ ...deleteTableDialog, open })}
      onConfirm={handleDeleteTable}
      title="Tem certeza que deseja deletar esta tabela?"
      description="Esta ação irá deletar permanentemente a tabela e TODAS as suas colunas, relacionamentos e rotas de API associadas."
      itemName={deleteTableDialog.tableName}
    />
    </div>
  );
};

export default ProjectView;
