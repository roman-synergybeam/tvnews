import { getCurrentUser } from '@/lib/auth.js';
import { listTvs, listPages, listDepartments, listBrands, departmentFilterFor, isScoped } from '@/lib/store.js';
import TvManager from './TvManager.jsx';

export const dynamic = 'force-dynamic';

export default async function TvsPage() {
  const user = await getCurrentUser();
  const scopeDept = departmentFilterFor(user, ''); // scoped editors -> their dept, else all
  const pages = listPages({ department: scopeDept }).map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    department: p.department,
  }));
  return (
    <TvManager
      initialTvs={listTvs({ department: scopeDept })}
      pages={pages}
      brands={listBrands().map((b) => ({ id: b.id, name: b.name, hostname: b.hostname }))}
      departments={listDepartments()}
      scoped={isScoped(user)}
      myDepartment={user.department || ''}
    />
  );
}
