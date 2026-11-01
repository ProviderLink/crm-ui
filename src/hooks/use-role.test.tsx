import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import authReducer, { setAuth } from '@/store/slices/authSlice';
import type { UserRole } from '@/types/auth';

import { useRole } from './use-role';

function rolesFor(role: UserRole | null) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (role)
    store.dispatch(
      setAuth({
        user: { id: 'u1', email: 'a@b.c', name: 'A B', role },
        accessToken: 't',
      })
    );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useRole(), { wrapper }).result.current;
}

describe('useRole', () => {
  it('flags an admin as staff', () => {
    expect(rolesFor('admin')).toMatchObject({
      role: 'admin',
      isAdmin: true,
      isStaff: true,
      isAccountManager: false,
    });
  });

  it('flags an account manager as staff but not admin', () => {
    expect(rolesFor('account_manager')).toMatchObject({
      isAdmin: false,
      isAccountManager: true,
      isStaff: true,
    });
  });

  it('does not treat a VA or a client as staff', () => {
    expect(rolesFor('va')).toMatchObject({ isVa: true, isStaff: false });
    expect(rolesFor('client')).toMatchObject({
      isClient: true,
      isStaff: false,
    });
  });

  it('has no role when signed out', () => {
    expect(rolesFor(null)).toMatchObject({
      role: undefined,
      isStaff: false,
      isAdmin: false,
    });
  });
});
