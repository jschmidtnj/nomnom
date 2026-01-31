
import React, { useState } from 'react';
import { ChefHat, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  onSignIn: (success: boolean) => void;
  onBack: () => void;
}

const SignIn: React.FC<Props> = ({ onSignIn, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setLoading(false);
      alert('Authentication failed. Please check your credentials.');
      return;
    }

    const jsonData = await response.json();
    console.log('login successful: ', jsonData);

    onSignIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-amber-600 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discovery
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex bg-amber-500 p-3 rounded-2xl text-white shadow-xl mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Nom Nom Admin</h1>
          <p className="text-gray-500 mt-2">Manage your cheesiest restaurant listings</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-gray-900"
                  placeholder="admin_chef"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-gray-900"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-xs text-gray-400 font-medium">
            <p>Protected Area • Authorized Personnel Only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
