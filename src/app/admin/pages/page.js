import { getCurrentUser } from '@/lib/auth.js';
import { listPages, listDepartments, listBrands, departmentFilterFor, isScoped } from '@/lib/store.js';
import PagesManager from './PagesManager.jsx';

export const dynamic = 'force-dynamic';

export default async function PagesPage() {
  const user = await getCurrentUser();
  const scopeDept = departmentFilterFor(user, '');
  return (
    <PagesManager
      initialPages={listPages({ department: scopeDept })}
      departments={listDepartments()}
      brands={listBrands().map((b) => ({ id: b.id, name: b.name }))}
      scoped={isScoped(user)}
      myDepartment={user.department || ''}
    />
  );
}
