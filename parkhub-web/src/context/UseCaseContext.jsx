import { createContext, useContext, useEffect, useState } from 'react';

const UseCaseContext = createContext(null);

const STORAGE_KEY = 'parkhub_usecase';

export function UseCaseProvider({ children }) {
  const [useCase, setUseCaseState] = useState(() =>
    localStorage.getItem(STORAGE_KEY) || 'business'
  );
  const [hasChosen, setHasChosen] = useState(() =>
    localStorage.getItem(STORAGE_KEY) !== null
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-usecase', useCase);
  }, [useCase]);

  function setUseCase(uc) {
    setUseCaseState(uc);
    setHasChosen(true);
    localStorage.setItem(STORAGE_KEY, uc);
  }

  return (
    <UseCaseContext.Provider value={{ useCase, setUseCase, hasChosen }}>
      {children}
    </UseCaseContext.Provider>
  );
}

export function useUseCase() {
  const ctx = useContext(UseCaseContext);
  if (!ctx) throw new Error('useUseCase must be used within UseCaseProvider');
  return ctx;
}
