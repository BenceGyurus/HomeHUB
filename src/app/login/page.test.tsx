import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { I18nProvider } from '@/lib/i18n';
import { signIn } from 'next-auth/react';
import '@testing-library/jest-dom';

describe('LoginPage', () => {
  it('renders login forms', () => {
    render(
      <I18nProvider>
        <LoginPage />
      </I18nProvider>
    );

    expect(screen.getByText('Lokális Belépés')).toBeInTheDocument();
    expect(screen.getByText('Authentik SSO Belépés')).toBeInTheDocument();
  });

  it('calls signIn on local login submit', async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({ error: null });

    render(
      <I18nProvider>
        <LoginPage />
      </I18nProvider>
    );

    fireEvent.change(screen.getByLabelText('Felhasználónév', { selector: 'input' }), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Jelszó', { selector: 'input' }), { target: { value: 'password' } });
    
    fireEvent.click(screen.getByText('Lokális Belépés'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        username: 'admin',
        password: 'password'
      });
    });
  });

  it('calls signIn for authentik on SSO button click', () => {
    render(
      <I18nProvider>
        <LoginPage />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText('Authentik SSO Belépés'));

    expect(signIn).toHaveBeenCalledWith('authentik', { callbackUrl: '/' });
  });
});
