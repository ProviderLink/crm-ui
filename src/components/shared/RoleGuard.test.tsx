import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import authReducer, { setAuth } from '@/store/slices/authSlice';
import type { UserRole } from '@/types/auth';

import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';

function renderAt(path: string, role: UserRole | null) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (role)
    store.dispatch(
      setAuth({
        user: { id: 'u1', email: 'a@b.c', name: 'A B', role },
        accessToken: 't',
      })
    );
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<RoleGuard roles={['admin']} />}>
              <Route path="dashboard" element={<p>admin dashboard</p>} />
            </Route>
            <Route
              path="/am"
              element={<RoleGuard roles={['account_manager']} />}
            >
              <Route path="dashboard" element={<p>am dashboard</p>} />
            </Route>
            <Route path="/va" element={<RoleGuard roles={['va']} />}>
              <Route path="dashboard" element={<p>va dashboard</p>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('route guards', () => {
  it('sends a signed-out visitor to the login page', () => {
    renderAt('/admin/dashboard', null);
    expect(screen.getByText('login page')).toBeTruthy();
  });

  it('lets a role into its own portal', () => {
    renderAt('/admin/dashboard', 'admin');
    expect(screen.getByText('admin dashboard')).toBeTruthy();
  });

  it('sends a role that wrong portal back to its own home, not the login form', () => {
    renderAt('/admin/dashboard', 'account_manager');
    expect(screen.getByText('am dashboard')).toBeTruthy();
    expect(screen.queryByText('admin dashboard')).toBeNull();
  });

  it('keeps a VA out of the admin portal', () => {
    renderAt('/admin/dashboard', 'va');
    expect(screen.getByText('va dashboard')).toBeTruthy();
  });
});
