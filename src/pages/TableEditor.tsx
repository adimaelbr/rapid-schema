import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SQLPreview } from "@/components/SQLPreview";
import { RelationshipManager } from "@/components/RelationshipManager";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

interface Column {
  id?: string;
  name: string;
  data_type: string;
  is_primary_key: boolean;
  is_unique: boolean;
  is_nullable: boolean;
  is_auto_increment: boolean;
  default_value: string;
  column_order: number;
}

const DATA_TYPES = [
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "FLOAT",
  "DOUBLE",
  "DECIMAL",
  "VARCHAR",
  "TEXT",
  "CHAR",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "JSON",
];

const TableEditor = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tableName, setTableName] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (tableId) {
      fetchTable();
      fetchColumns();
    }
  }, [tableId]);

  const fetchTable = async () => {
    const { data, error } = await supabase
      .from("db_tables")
      .select("*")
      .eq("id", tableId)
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar tabela",
        description: error.message,
      });
    } else {
      setTableName(data.name);
      setDatabaseId(data.database_id);
    }
  };

  const fetchColumns = async () => {
    const { data, error } = await supabase
      .from("table_columns")
      .select("*")
      .eq("table_id", tableId)
      .order("column_order");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar colunas",
        description: error.message,
      });
    } else {
      setColumns(data || []);
      if (!data || data.length === 0) {
        addColumn();
      }
    }
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        name: "",
        data_type: "VARCHAR",
        is_primary_key: false,
        is_unique: false,
        is_nullable: true,
        is_auto_increment: false,
        default_value: "",
        column_order: columns.length,
      },
    ]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof Column, value: any) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const handleSave = async () => {
    setLoading(true);

    // Delete existing columns
    await supabase.from("table_columns").delete().eq("table_id", tableId);

    // Insert new columns
    const { error } = await supabase.from("table_columns").insert(
      columns.map((col) => ({
        table_id: tableId,
        name: col.name,
        data_type: col.data_type,
        is_primary_key: col.is_primary_key,
        is_unique: col.is_unique,
        is_nullable: col.is_nullable,
        is_auto_increment: col.is_auto_increment,
        default_value: col.default_value,
        column_order: col.column_order,
      }))
    );

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar colunas",
        description: error.message,
      });
    } else {
      toast({
        title: "Colunas salvas!",
        description: "As colunas foram salvas com sucesso.",
      });
      fetchColumns();
    }

    setLoading(false);
  };

  const handleDeleteTable = async () => {
    const { error } = await supabase.from("db_tables").delete().eq("id", tableId);

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
      navigate(-1);
    }
    setDeleteDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Tabela
            </Button>
          </div>
          <h1 className="text-2xl font-bold">Editor de Tabela: {tableName}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="columns" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="columns">Colunas</TabsTrigger>
            <TabsTrigger value="relationships">Relacionamentos</TabsTrigger>
            <TabsTrigger value="sql">SQL Gerado</TabsTrigger>
          </TabsList>

          <TabsContent value="columns" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Definir Colunas</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={addColumn}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Coluna
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {columns.map((column, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome da Coluna</Label>
                          <Input
                            value={column.name}
                            onChange={(e) => updateColumn(index, "name", e.target.value)}
                            placeholder="nome_coluna"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Dados</Label>
                          <Select
                            value={column.data_type}
                            onValueChange={(value) => updateColumn(index, "data_type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DATA_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Padrão</Label>
                          <Input
                            value={column.default_value}
                            onChange={(e) => updateColumn(index, "default_value", e.target.value)}
                            placeholder="Valor padrão (opcional)"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>Propriedades</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`pk-${index}`}
                                checked={column.is_primary_key}
                                onCheckedChange={(checked) =>
                                  updateColumn(index, "is_primary_key", checked)
                                }
                              />
                              <label htmlFor={`pk-${index}`} className="text-sm cursor-pointer">
                                Primary Key
                              </label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`unique-${index}`}
                                checked={column.is_unique}
                                onCheckedChange={(checked) =>
                                  updateColumn(index, "is_unique", checked)
                                }
                              />
                              <label htmlFor={`unique-${index}`} className="text-sm cursor-pointer">
                                Unique
                              </label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`nullable-${index}`}
                                checked={column.is_nullable}
                                onCheckedChange={(checked) =>
                                  updateColumn(index, "is_nullable", checked)
                                }
                              />
                              <label htmlFor={`nullable-${index}`} className="text-sm cursor-pointer">
                                Nullable
                              </label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`auto-${index}`}
                                checked={column.is_auto_increment}
                                onCheckedChange={(checked) =>
                                  updateColumn(index, "is_auto_increment", checked)
                                }
                              />
                              <label htmlFor={`auto-${index}`} className="text-sm cursor-pointer">
                                Auto Increment
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-destructive hover:text-destructive"
                        onClick={() => removeColumn(index)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover Coluna
                      </Button>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relationships" className="mt-6">
            <RelationshipManager
              tableId={tableId!}
              databaseId={databaseId}
              columns={columns.map((col) => ({ id: col.id!, name: col.name }))}
            />
          </TabsContent>

          <TabsContent value="sql" className="mt-6">
            <SQLPreview
              tableName={tableName}
              columns={columns}
            />
          </TabsContent>
        </Tabs>
      </main>

      <DeleteConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onConfirm={handleDeleteTable}
        title="Tem certeza que deseja deletar esta tabela?"
        description="Esta ação irá deletar permanentemente a tabela e TODAS as suas colunas, relacionamentos e rotas de API associadas."
        itemName={tableName}
      />
    </div>
  );
};

export default TableEditor;
