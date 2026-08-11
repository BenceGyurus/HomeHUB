import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, useI18n } from './i18n';
import '@testing-library/jest-dom';

const TestComponent = () => {
  const { t, setLang, lang } = useI18n();
  return (
    <div>
      <span data-testid="welcome-text">{t('welcome')}</span>
      <span data-testid="current-lang">{lang}</span>
      <button onClick={() => setLang('en')}>Set EN</button>
    </div>
  );
};

describe('I18nContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders default hungarian text', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('welcome-text')).toHaveTextContent('Jó reggelt');
    expect(screen.getByTestId('current-lang')).toHaveTextContent('hu');
  });

  it('changes language when setLang is called', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    fireEvent.click(screen.getByText('Set EN'));

    expect(screen.getByTestId('welcome-text')).toHaveTextContent('Good morning');
    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(localStorage.getItem('lang')).toBe('en');
  });
});
