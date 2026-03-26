import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/', { replace: true });
      } else {
        toast.error('Email ou senha incorretos');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center gap-3 mb-2">
              <img src="/logo.png" alt="Argos CRM" className="h-16 w-16 rounded-lg object-contain" />
              <h1 className="text-2xl font-bold text-foreground">Argos CRM</h1>
              <p className="text-sm text-muted-foreground">
                Faça login para acessar o sistema
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => toast.info('Funcionalidade disponível após conectar o Supabase Auth')}
                className="w-full text-center text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>

            <div className="mt-6 pt-4 border-t text-center space-y-1">
              <p className="text-xs text-muted-foreground">Credenciais de teste:</p>
              <p className="text-xs text-muted-foreground">
                Admin: <span className="font-mono">admin@argos.com</span> / <span className="font-mono">admin123</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Atendente: <span className="font-mono">maria@argos.com</span> / <span className="font-mono">maria123</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
