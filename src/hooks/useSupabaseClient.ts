"use client";
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';

export const useSupabaseClient = () => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const supabaseClient = await createClerkSupabaseClient();
        setClient(supabaseClient);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initializeClient();
  }, []);

  return { client, loading, error };
};