import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Column {
  name: string;
  data_type: string;
  is_primary_key: boolean;
  is_unique: boolean;
  is_nullable: boolean;
  is_auto_increment: boolean;
  default_value: string;
}

interface Relationship {
  source_column: string;
  target_table: string;
  target_column: string;
  relationship_type: string;
}

interface SQLPreviewProps {
  tableName: string;
  columns: Column[];
  relationships?: Relationship[];
}

const generateMySQLDDL = (
  tableName: string,
  columns: Column[],
  relationships: Relationship[] = []
): string => {
  if (!tableName || columns.length === 0) {
    return "-- Defina o nome da tabela e adicione colunas para gerar o SQL";
  }

  let sql = `CREATE TABLE \`${tableName}\` (\n`;
  
  // Add columns
  const columnDefinitions = columns.map((col) => {
    let def = `  \`${col.name}\` ${col.data_type}`;
    
    if (col.is_auto_increment) {
      def += " AUTO_INCREMENT";
    }
    
    if (!col.is_nullable) {
      def += " NOT NULL";
    }
    
    if (col.default_value && !col.is_auto_increment) {
      def += ` DEFAULT '${col.default_value}'`;
    }
    
    return def;
  });

  sql += columnDefinitions.join(",\n");

  // Add primary key
  const primaryKeys = columns.filter((col) => col.is_primary_key);
  if (primaryKeys.length > 0) {
    sql += `,\n  PRIMARY KEY (${primaryKeys.map((col) => `\`${col.name}\``).join(", ")})`;
  }

  // Add unique constraints
  const uniqueColumns = columns.filter((col) => col.is_unique && !col.is_primary_key);
  if (uniqueColumns.length > 0) {
    uniqueColumns.forEach((col) => {
      sql += `,\n  UNIQUE KEY \`${col.name}_UNIQUE\` (\`${col.name}\`)`;
    });
  }

  // Add foreign keys
  if (relationships.length > 0) {
    relationships.forEach((rel, idx) => {
      const onDelete = rel.relationship_type === "strong" ? "CASCADE" : "SET NULL";
      sql += `,\n  CONSTRAINT \`fk_${tableName}_${rel.target_table}_${idx}\``;
      sql += `\n    FOREIGN KEY (\`${rel.source_column}\`)`;
      sql += `\n    REFERENCES \`${rel.target_table}\` (\`${rel.target_column}\`)`;
      sql += `\n    ON DELETE ${onDelete}`;
      sql += `\n    ON UPDATE CASCADE`;
    });
  }

  sql += "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

  return sql;
};

export const SQLPreview = ({ tableName, columns, relationships }: SQLPreviewProps) => {
  const { toast } = useToast();
  const sql = generateMySQLDDL(tableName, columns, relationships);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    toast({
      title: "SQL copiado!",
      description: "O script DDL foi copiado para a área de transferência.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Script DDL (MySQL)</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          <code>{sql}</code>
        </pre>
      </CardContent>
    </Card>
  );
};
