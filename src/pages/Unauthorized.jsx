import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-[#172033] mb-2">
          Access Denied
        </h1>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          You don't have permission to access this page with your current role.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#F97316]/20 transition-all w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
