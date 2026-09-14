import React from 'react';
import { Clock, ArrowRight, Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlaceholderPage = ({ title, subtitle, moduleName }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title || moduleName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {subtitle || `Module overview and configuration for ${moduleName || 'this section'}.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Construction className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Planned for Next Phase
        </span>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {moduleName || title} Module
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-md mx-auto">
          This module is part of the roadmap and will be activated in upcoming development phases with clean data-entry workflows.
        </p>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Back to Dashboard
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
