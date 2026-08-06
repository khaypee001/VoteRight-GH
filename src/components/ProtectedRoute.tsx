import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  requiredRole: 'admin' | 'organizer';
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkProtection = async () => {
      try {
        // 1. Check local admin session keys first
        if (requiredRole === 'admin') {
          const isAdminAuth =
            localStorage.getItem('voteright_admin_session') === 'true' ||
            localStorage.getItem('isAdminAuthenticated') === 'true';

          const savedUserJson = localStorage.getItem('voterightgh_user');
          const savedUser = savedUserJson ? JSON.parse(savedUserJson) : null;

          if (isAdminAuth || (savedUser && savedUser.role === 'admin')) {
            if (isMounted) {
              setIsAllowed(true);
              setLoading(false);
            }
            return;
          }
        } else if (requiredRole === 'organizer') {
          const savedUserJson = localStorage.getItem('voterightgh_user');
          if (savedUserJson) {
            try {
              const savedUser = JSON.parse(savedUserJson);
              if (savedUser.role === 'organizer') {
                if (isMounted) {
                  setIsAllowed(true);
                  setLoading(false);
                }
                return;
              }
            } catch (e) {
              console.error('Error parsing saved user session:', e);
            }
          }
        }

        // 2. Check Supabase Auth session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_verified, is_blocked')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            if (requiredRole === 'admin' && profile.role === 'admin') {
              if (isMounted) {
                setIsAllowed(true);
                setLoading(false);
              }
              return;
            } else if (
              requiredRole === 'organizer' &&
              profile.role === 'organizer' &&
              profile.is_verified &&
              !profile.is_blocked
            ) {
              if (isMounted) {
                setIsAllowed(true);
                setLoading(false);
              }
              return;
            }
          }
        }

        // 3. Unauthenticated or wrong role handling
        if (requiredRole === 'admin') {
          // If accessing /admin directly, do NOT bounce to home - allow Admin Login Modal overlay to authenticate user
          if (window.location.pathname.toLowerCase().startsWith('/admin')) {
            if (isMounted) {
              setIsAllowed(false);
              setLoading(false);
            }
            return;
          }
          redirectUser('admin');
        } else {
          redirectUser('organizer');
        }
      } catch (err) {
        console.error('Error in ProtectedRoute auth check:', err);
        if (requiredRole === 'admin' && window.location.pathname.toLowerCase().startsWith('/admin')) {
          if (isMounted) {
            setIsAllowed(false);
            setLoading(false);
          }
        } else {
          redirectUser(requiredRole);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkProtection();

    return () => {
      isMounted = false;
    };
  }, [requiredRole]);

  const redirectUser = (role: 'admin' | 'organizer') => {
    if (role === 'admin') {
      window.location.href = '/';
    } else {
      window.location.href = '/login?error=unauthorized';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400">Verifying security credentials...</p>
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};

