import { useState } from 'react';

import { DataTable } from '@/components/shared/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/store';

import {
  buildAdminColumns,
  buildAmColumns,
  buildClientColumns,
  buildVaColumns,
} from './accounts/columns';
import { UserDetailSheet } from './accounts/UserDetailSheet';
import type { UserRow } from './accounts/types';
import { useAccountRows } from './accounts/use-account-rows';

export default function AccountManagementPage() {
  const authUser = useAppSelector(s => s.auth.user);
  const isAccountManager = authUser?.role === 'account_manager';
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const { clientRows, vaRows, amRows, adminRows, isLoading } =
    useAccountRows();

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAccountManager
              ? 'View your assigned clients and virtual assistants'
              : 'View who has CRM access. Manage roles and access from the ATS.'}
          </p>
        </div>

        <div className="px-4 lg:px-6">
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">
                Clients ({clientRows.length})
              </TabsTrigger>
              <TabsTrigger value="vas">
                Virtual Assistants ({vaRows.length})
              </TabsTrigger>
              {!isAccountManager && (
                <>
                  <TabsTrigger value="ams">
                    Account Managers ({amRows.length})
                  </TabsTrigger>
                  <TabsTrigger value="admins">
                    Admins ({adminRows.length})
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            <TabsContent value="clients" className="mt-4">
              <DataTable
                columns={buildClientColumns(setDetailUser)}
                data={clientRows}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="vas" className="mt-4">
              <DataTable
                columns={buildVaColumns(setDetailUser)}
                data={vaRows}
                isLoading={isLoading}
              />
            </TabsContent>
            {!isAccountManager && (
              <>
                <TabsContent value="ams" className="mt-4">
                  <DataTable
                    columns={buildAmColumns()}
                    data={amRows}
                    isLoading={isLoading}
                  />
                </TabsContent>
                <TabsContent value="admins" className="mt-4">
                  <DataTable
                    columns={buildAdminColumns()}
                    data={adminRows}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      <UserDetailSheet
        user={detailUser}
        open={detailUser !== null}
        onClose={() => setDetailUser(null)}
      />
    </div>
  );
}
