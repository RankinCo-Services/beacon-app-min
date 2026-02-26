import { useParams } from 'react-router-dom';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Operations · Projects</p>
      <h1 className="text-2xl font-bold text-slate-900">Project Detail</h1>
      <p className="mt-2 text-sm text-slate-500">Project ID: {id} — coming soon.</p>
    </div>
  );
}
