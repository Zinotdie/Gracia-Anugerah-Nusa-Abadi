import { TrendingUp } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, bgColor = 'bg-indigo-50', textColor = 'text-indigo-600', trend }) {
  const renderIcon = () => {
    if (!Icon) return null;
    if (typeof Icon === 'function' || (typeof Icon === 'object' && typeof Icon.render === 'function')) {
      const IconComp = Icon;
      return <IconComp className={`w-5 h-5 ${textColor}`} />;
    }
    return Icon;
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-5 flex flex-col justify-between border border-[#E2E8F0] h-full gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-xs font-medium text-[#64748B] mb-2 tracking-wide uppercase">{title}</p>
          <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgColor} ${textColor} shadow-xs`}>
          {renderIcon()}
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-100">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-600">{trend}</span>
        </div>
      )}
    </div>
  );
}
