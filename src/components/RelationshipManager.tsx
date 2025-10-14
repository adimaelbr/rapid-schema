import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Column {
  id: string;
  name: string;
}

interface Table {
  id: string;
  name: string;
}

interface Relationship {
  id?: string;
  source_column_id: string;
  target_table_id: string;
  target_column_id: string;
  relationship_type: "one_to_one" | "one_to_many" | "many_to_many";
  relationship_strength: "strong" | "weak";
}

interface RelationshipManagerProps {
  tableId: string;
  databaseId: string;
  columns: Column[];
}

export const RelationshipManager = ({ tableId, databaseId, columns }: RelationshipManagerProps) => {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [targetColumns, setTargetColumns] = useState<Record<string, Column[]>>({});
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
    fetchRelationships();
  }, [tableId, databaseId]);

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from("db_tables")
      .select("id, name")
      .eq("database_id", databaseId)
      .neq("id", tableId);

    if (!error && data) {
      setTables(data);
    }
  };

  const fetchRelationships = async () => {
    const { data, error } = await supabase
      .from("table_relationships")
      .select("*")
      .eq("source_table_id", tableId);

    if (!error && data) {
      setRelationships(data);
    }
  };

  const fetchTargetColumns = async (targetTableId: string) => {
    if (targetColumns[targetTableId]) return;

    const { data, error } = await supabase
      .from("table_columns")
      .select("id, name")
      .eq("table_id", targetTableId);

    if (!error && data) {
      setTargetColumns((prev) => ({ ...prev, [targetTableId]: data }));
    }
  };

  const addRelationship = () => {
    setRelationships([
      ...relationships,
      {
        source_column_id: "",
        target_table_id: "",
        target_column_id: "",
        relationship_type: "one_to_many",
        relationship_strength: "strong",
      },
    ]);
  };

  const updateRelationship = (index: number, field: keyof Relationship, value: any) => {
    const newRelationships = [...relationships];
    newRelationships[index] = { ...newRelationships[index], [field]: value };
    
    if (field === "target_table_id") {
      fetchTargetColumns(value);
      newRelationships[index].target_column_id = "";
    }
    
    setRelationships(newRelationships);
  };

  const removeRelationship = async (index: number) => {
    const rel = relationships[index];
    
    if (rel.id) {
      const { error } = await supabase
        .from("table_relationships")
        .delete()
        .eq("id", rel.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao remover relacionamento",
          description: error.message,
        });
        return;
      }
    }

    setRelationships(relationships.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);

    // Delete existing relationships
    await supabase.from("table_relationships").delete().eq("source_table_id", tableId);

    // Insert new relationships
    const validRelationships = relationships.filter(
      (rel) => rel.source_column_id && rel.target_table_id && rel.target_column_id
    );

    if (validRelationships.length > 0) {
      const { error } = await supabase.from("table_relationships").insert(
        validRelationships.map((rel) => ({
          source_table_id: tableId,
          source_column_id: rel.source_column_id,
          target_table_id: rel.target_table_id,
          target_column_id: rel.target_column_id,
          relationship_type: rel.relationship_type,
          relationship_strength: rel.relationship_strength,
        }))
      );

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao salvar relacionamentos",
          description: error.message,
        });
        setLoading(false);
        return;
      }
    }

    toast({
      title: "Relacionamentos salvos!",
      description: "Os relacionamentos foram salvos com sucesso.",
    });
    
    fetchRelationships();
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Relacionamentos</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addRelationship}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relationships.map((rel, index) => (
            <Card key={index} className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coluna de Origem</Label>
                  <Select
                    value={rel.source_column_id}
                    onValueChange={(value) => updateRelationship(index, "source_column_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tabela de Destino</Label>
                  <Select
                    value={rel.target_table_id}
                    onValueChange={(value) => updateRelationship(index, "target_table_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
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

                <div className="space-y-2">
                  <Label>Coluna de Destino</Label>
                  <Select
                    value={rel.target_column_id}
                    onValueChange={(value) => updateRelationship(index, "target_column_id", value)}
                    disabled={!rel.target_table_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {targetColumns[rel.target_table_id]?.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Relacionamento</Label>
                  <Select
                    value={rel.relationship_type}
                    onValueChange={(value) => updateRelationship(index, "relationship_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_to_one">1:1 (Um para Um)</SelectItem>
                      <SelectItem value="one_to_many">1:N (Um para Muitos)</SelectItem>
                      <SelectItem value="many_to_many">N:N (Muitos para Muitos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Força do Relacionamento</Label>
                  <Select
                    value={rel.relationship_strength}
                    onValueChange={(value) => updateRelationship(index, "relationship_strength", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strong">Forte (CASCADE)</SelectItem>
                      <SelectItem value="weak">Fraca (SET NULL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-destructive hover:text-destructive"
                onClick={() => removeRelationship(index)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover Relacionamento
              </Button>
            </Card>
          ))}

          {relationships.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum relacionamento definido. Clique em "Adicionar" para criar um.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
