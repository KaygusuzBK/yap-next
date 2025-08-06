'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [envStatus, setEnvStatus] = useState<any>({});
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Environment variables kontrolü
    setEnvStatus({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      nodeEnv: process.env.NODE_ENV || 'Not set'
    });
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setTestResult('Testing connection...');
      
      // Basit bir test query
      const { data, error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      if (error) {
        setTestResult(`❌ Connection failed: ${error.message}`);
      } else {
        setTestResult('✅ Connection successful!');
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className={envStatus.supabaseUrl?.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {envStatus.supabaseUrl}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className={envStatus.supabaseKey?.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {envStatus.supabaseKey}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NODE_ENV:</span>
              <span>{envStatus.nodeEnv}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Connection Test</h2>
          <button 
            onClick={testSupabaseConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Connection
          </button>
          {testResult && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className={testResult.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {testResult}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm">
            <p>1. Create a <code>.env.local</code> file in your project root</p>
            <p>2. Add your Supabase credentials:</p>
            <pre className="bg-gray-100 p-3 rounded text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
            <p>3. Restart your development server</p>
            <p>4. Test the connection</p>
          </div>
        </div>
      </div>
    </div>
  );
} 