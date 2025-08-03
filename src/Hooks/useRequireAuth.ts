import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function useRequireAuth() {
  const nav = useNavigate();
  useEffect(() => {
    const session = supabase.auth.session();
    if (!session) nav('/login');
    supabase.auth.onAuthStateChange((_, sess) => {
      if (!sess) nav('/login');
    });
  }, []);
}