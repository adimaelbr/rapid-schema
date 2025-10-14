import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Database } from "lucide-react";

const LOCKOUT_DURATION = 60000; // 60 segundos
const MAX_ATTEMPTS = 3;

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('login_lockout');
    if (stored) {
      const lockTime = parseInt(stored);
      if (Date.now() < lockTime) {
        setLockedUntil(lockTime);
      } else {
        localStorage.removeItem('login_lockout');
        localStorage.removeItem('login_attempts');
      }
    }
    
    const storedAttempts = localStorage.getItem('login_attempts');
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
  }, []);

  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockedUntil(null);
          setAttempts(0);
          setRemainingTime(0);
          localStorage.removeItem('login_lockout');
          localStorage.removeItem('login_attempts');
        } else {
          setRemainingTime(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const validateUsername = (username: string): string => {
    return username.toLowerCase().replace(/[^a-z0-9.]/g, '');
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const username = validateUsername(formData.get("signup-username") as string);
    const password = formData.get("signup-password") as string;

    if (!username || username.length < 3) {
      toast({
        variant: "destructive",
        title: "Usuário inválido",
        description: "O usuário deve ter pelo menos 3 caracteres (letras, números e ponto).",
      });
      setLoading(false);
      return;
    }

    // Verificar se username já existe
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single();

    if (existingProfile) {
      toast({
        variant: "destructive",
        title: "Usuário já existe",
        description: "Este nome de usuário já está em uso.",
      });
      setLoading(false);
      return;
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message,
      });
    } else if (authData.user) {
      // Criar perfil com username
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          username: username,
          email: email,
        });

      if (profileError) {
        toast({
          variant: "destructive",
          title: "Erro ao criar perfil",
          description: profileError.message,
        });
      } else {
        toast({
          title: "Conta criada!",
          description: "Você já pode fazer login com seu usuário.",
        });
      }
    }

    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (lockedUntil && Date.now() < lockedUntil) {
      toast({
        variant: "destructive",
        title: "Acesso bloqueado",
        description: `Muitas tentativas. Tente novamente em ${remainingTime} segundos.`,
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = validateUsername(formData.get("signin-username") as string);
    const password = formData.get("signin-password") as string;

    // Buscar email pelo username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(lockTime);
        localStorage.setItem('login_lockout', lockTime.toString());
        toast({
          variant: "destructive",
          title: "Acesso bloqueado",
          description: "Muitas tentativas. Aguarde 60 segundos.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: `Usuário ou senha incorretos. ${MAX_ATTEMPTS - newAttempts} tentativa(s) restante(s).`,
        });
      }
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(lockTime);
        localStorage.setItem('login_lockout', lockTime.toString());
        toast({
          variant: "destructive",
          title: "Acesso bloqueado",
          description: "Muitas tentativas. Aguarde 60 segundos.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: `Usuário ou senha incorretos. ${MAX_ATTEMPTS - newAttempts} tentativa(s) restante(s).`,
        });
      }
    } else {
      setAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('login_lockout');
    }

    setLoading(false);
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(var(--auth-bg))]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-lg bg-primary/10">
              <Database className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">DB Manager API</CardTitle>
          <CardDescription>Gerencie seus bancos de dados facilmente</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Login</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-username">Usuário</Label>
                  <Input
                    id="signin-username"
                    name="signin-username"
                    type="text"
                    placeholder="fulano.silva"
                    required
                    disabled={isLocked}
                    onChange={(e) => {
                      e.target.value = validateUsername(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <Input
                    id="signin-password"
                    name="signin-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isLocked}
                  />
                </div>
                {isLocked && (
                  <p className="text-sm text-destructive text-center">
                    Bloqueado por {remainingTime} segundos
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading || isLocked}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Usuário</Label>
                  <Input
                    id="signup-username"
                    name="signup-username"
                    type="text"
                    placeholder="fulano.silva"
                    required
                    minLength={3}
                    onChange={(e) => {
                      e.target.value = validateUsername(e.target.value);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas letras, números e ponto (ex: fulano.silva)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
