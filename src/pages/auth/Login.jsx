import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Lock, 
  UserCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  Flame, 
  ShieldCheck,
  ArrowRight,
  Shield,
  Briefcase,
  ChefHat
} from 'lucide-react';

const ROLES_TABS = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', icon: Shield },
  { id: 'MAIN_MANAGER', label: 'Main Manager', icon: Briefcase },
  { id: 'MANAGER_2', label: 'Manager 2', icon: Briefcase },
  { id: 'CHEF', label: 'Chef', icon: ChefHat }
];

const Login = () => {
  const [activeRole, setActiveRole] = useState('SUPER_ADMIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Tab switch handler - switches active role tab without filling input values
  const handleRoleTabChange = (roleId) => {
    setActiveRole(roleId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      toast.error('Please enter your mobile or email and password');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Authenticating credentials...');
    
    const result = await login(cleanIdentifier, password, activeRole);
    setIsLoading(false);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success(`Welcome back, ${result.user?.name || 'User'}!`);
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F1] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Warm Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#172033]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        {/* Circular Mascot Logo Container */}
        <div className="relative inline-block mb-3">
          <div className="w-28 h-28 mx-auto rounded-full bg-white p-1 shadow-xl shadow-[#F97316]/20 border-2 border-[#FDBA74] flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Momos Bhandar Mascot" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <h1 className="text-3xl font-black text-[#172033] tracking-tight sm:text-4xl">
          Momos Bhandar
        </h1>
        <p className="mt-1 text-sm text-[#6B7280] font-medium">
          Restaurant Management & Business Control System
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg px-4 relative z-10">
        <div className="bg-white py-7 px-6 sm:px-9 shadow-xl shadow-[#172033]/5 border border-[#E5E7EB] rounded-3xl">
          
          {/* Role Switcher Tabs with Active State */}
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2 text-center">
              Select Role to Sign In
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#FFF8F1] border border-[#E5E7EB] rounded-2xl">
              {ROLES_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleRoleTabChange(tab.id)}
                    className={`flex items-center justify-center py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#172033] text-white shadow-md shadow-[#172033]/20 scale-[1.02]'
                        : 'text-[#374151] hover:bg-[#FFF0E5] hover:text-[#F97316]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 mr-1.5 shrink-0 ${isActive ? 'text-[#F97316]' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Mobile / Email Field */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-bold uppercase tracking-wider text-[#172033] mb-1.5">
                Mobile Number or Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Mobile number or Email address"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8F1] border border-[#E5E7EB] rounded-xl text-[#172033] text-sm placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#FFF8F1] border border-[#E5E7EB] rounded-xl text-[#172033] text-sm placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-[#F97316]/25 text-sm font-bold text-white bg-[#F97316] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] disabled:opacity-60 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Security badge footer */}
        <div className="mt-4 text-center flex items-center justify-center space-x-1.5 text-xs text-[#6B7280] font-medium">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span>Role-Based Secure Session • Momos Bhandar</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
