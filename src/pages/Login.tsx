import React from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLogin, setIsLogin] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser && savedUser !== 'undefined') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate direct local auth
      const user = { 
        email, 
        name: email.split('@')[0],
        uid: 'local_' + Date.now().toString(36),
        displayName: email.split('@')[0]
      };
      
      localStorage.setItem('user_session', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      console.error("Auth error:", err);
      setError("Gagal masuk ke akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = { 
        email: 'user@estehanget.com', 
        name: 'Estehanget User',
        uid: 'local_google_' + Date.now().toString(36),
        displayName: 'Estehanget User',
        photo: 'https://picsum.photos/seed/user/200'
      };
      localStorage.setItem('user_session', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      setError("Gagal login dengan Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 flex items-center justify-center bg-bg-light dark:bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl border border-black/5 dark:border-white/5"
      >
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-display font-bold tracking-tighter text-black dark:text-white">
            {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
          </h1>
          <p className="text-sm text-black dark:text-white">
            {isLogin ? 'Masuk ke akun ESTEHANGET kamu' : 'Mulai belanja produk impianmu'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={18} />
              <input
                type="email"
                required
                placeholder="email@contoh.com"
                className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black dark:text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isLogin && (
            <button type="button" className="text-xs font-bold text-tea-main hover:underline block ml-auto">Lupa Password?</button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg mt-6 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10 dark:border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#1a1a1a] px-4 text-black/40 dark:text-white/40 font-bold">Atau masuk dengan</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-bold text-black dark:text-white disabled:opacity-50"
          >
            <Chrome size={18} /> Google
          </button>
          <button className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-bold text-black dark:text-white opacity-50 cursor-not-allowed">
            <Github size={18} /> GitHub
          </button>
        </div>

        <p className="text-center text-sm text-black/60 dark:text-white/60 mt-8">
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'} {' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-tea-main font-bold hover:underline"
          >
            {isLogin ? 'Daftar Gratis' : 'Masuk di sini'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
