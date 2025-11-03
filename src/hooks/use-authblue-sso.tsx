import { useEffect, useState } from 'react';


export type SSOUser = {
  attributes: {
    firstName: string;
    lastName: string;
    fullName: string;
    adsId: string;
    guid: string;
    employeeId: string;
    email: string;
  };
   groups: string[];
};

// Mock SSO user data for development
const mockSSOUser: SSOUser = {
  attributes: {
    firstName: "Ensemble",
    lastName: "Test",
    fullName: "Ensemble Test",
    adsId: "ensemble",
    guid: "@fca9376056149663519865855188315",
    employeeId: "8229989",
    email: "ensemble.test5@gmail.com",
  },
  groups: ["SSO_ENSEMBLE_E1"] // Multiple teams for testing
};

export function useAuthBlueSSO() {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate SSO callback delay
    const timer = setTimeout(() => {
      try {
        // In development, always return mock user
        if (process.env.NODE_ENV === 'development') {
          setUser(mockSSOUser);
        }
        // In production, this would get real SSO data
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get SSO data'));
      } finally {
        setLoading(false);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  return { user, loading, error };
}