import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { ProjectCard } from "@/components/ProjectCard";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; projectId: string; projectName: string }>({
    open: false,
    projectId: "",
    projectName: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar projetos",
        description: error.message,
      });
    } else {
      setProjects(data || []);
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from("projects").insert({
      name,
      description,
      user_id: user.id,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar projeto",
        description: error.message,
      });
    } else {
      toast({
        title: "Projeto criado!",
        description: "Seu projeto foi criado com sucesso.",
      });
      fetchProjects();
    }
    setLoading(false);
  };

  const handleDeleteProject = async () => {
    const { error } = await supabase.from("projects").delete().eq("id", deleteDialog.projectId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar projeto",
        description: error.message,
      });
    } else {
      toast({
        title: "Projeto deletado",
        description: "O projeto e todos os seus dados foram removidos com sucesso.",
      });
      fetchProjects();
    }
    setDeleteDialog({ open: false, projectId: "", projectName: "" });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Database Manager Pro
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Meus Projetos</h2>
            <p className="text-muted-foreground">
              Gerencie seus projetos e bancos de dados
            </p>
          </div>
          <CreateProjectDialog onSubmit={handleCreateProject} loading={loading} />
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Nenhum projeto criado ainda</p>
            <CreateProjectDialog onSubmit={handleCreateProject} loading={loading} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description || undefined}
                createdAt={project.created_at}
                onSelect={() => navigate(`/project/${project.id}`)}
                onDelete={() => setDeleteDialog({ open: true, projectId: project.id, projectName: project.name })}
              />
            ))}
          </div>
        )}
      </main>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDeleteProject}
        title="Tem certeza que deseja deletar este projeto?"
        description="Esta ação irá deletar permanentemente o projeto e TODOS os seus dados associados, incluindo bancos de dados, tabelas, colunas, relacionamentos e rotas de API."
        itemName={deleteDialog.projectName}
      />
    </div>
  );
};

export default Dashboard;
