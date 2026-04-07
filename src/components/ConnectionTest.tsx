import React, { useState, useEffect } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function ConnectionTest() {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'API Endpoint', status: 'pending', message: 'Testing...' },
    { name: 'Login Endpoint', status: 'pending', message: 'Testing...' },
    { name: 'Students Endpoint', status: 'pending', message: 'Testing...' },
    { name: 'Classes Endpoint', status: 'pending', message: 'Testing...' },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const newResults: TestResult[] = [];

    // Test 1: API Health Check
    try {
      const response = await fetch('/api-proxy/students', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        newResults.push({
          name: 'API Endpoint',
          status: 'success',
          message: 'API accessible and responding',
          details: `Status: ${response.status}`,
        });
      } else {
        newResults.push({
          name: 'API Endpoint',
          status: 'error',
          message: `API returned ${response.status}`,
          details: response.statusText,
        });
      }
    } catch (error: any) {
      newResults.push({
        name: 'API Endpoint',
        status: 'error',
        message: 'Cannot reach API',
        details: error.message || 'Connection refused',
      });
    }

    // Test 2: Login Endpoint
    try {
      const response = await fetch('/api-proxy/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password' }),
      });

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          name: 'Login Endpoint',
          status: 'success',
          message: 'Login endpoint working',
          details: `Returned user: ${data.username}`,
        });
      } else if (response.status === 401) {
        newResults.push({
          name: 'Login Endpoint',
          status: 'warning',
          message: 'Login endpoint OK but invalid credentials',
          details: 'Check if test data is seeded',
        });
      } else {
        newResults.push({
          name: 'Login Endpoint',
          status: 'error',
          message: `Login returned ${response.status}`,
          details: response.statusText,
        });
      }
    } catch (error: any) {
      newResults.push({
        name: 'Login Endpoint',
        status: 'error',
        message: 'Cannot reach login endpoint',
        details: error.message,
      });
    }

    // Test 3: Students Endpoint
    try {
      const response = await fetch('/api-proxy/students', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          name: 'Students Endpoint',
          status: 'success',
          message: 'Students endpoint working',
          details: `Retrieved ${Array.isArray(data) ? data.length : 0} students`,
        });
      } else {
        newResults.push({
          name: 'Students Endpoint',
          status: 'error',
          message: `Students endpoint returned ${response.status}`,
          details: response.statusText,
        });
      }
    } catch (error: any) {
      newResults.push({
        name: 'Students Endpoint',
        status: 'error',
        message: 'Cannot reach students endpoint',
        details: error.message,
      });
    }

    // Test 4: Classes Endpoint
    try {
      const response = await fetch('/api-proxy/classes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          name: 'Classes Endpoint',
          status: 'success',
          message: 'Classes endpoint working',
          details: `Retrieved ${Array.isArray(data) ? data.length : 0} classes`,
        });
      } else {
        newResults.push({
          name: 'Classes Endpoint',
          status: 'error',
          message: `Classes endpoint returned ${response.status}`,
          details: response.statusText,
        });
      }
    } catch (error: any) {
      newResults.push({
        name: 'Classes Endpoint',
        status: 'error',
        message: 'Cannot reach classes endpoint',
        details: error.message,
      });
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'pending':
        return '⏳';
      default:
        return '•';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔌 API Connection Test</h1>
        <p className="text-gray-600">
          Testing backend API connectivity from frontend
        </p>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">{getStatusIcon(result.status)}</span>
                <div>
                  <h3 className="font-semibold text-lg">{result.name}</h3>
                  <p className="text-sm mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs mt-2 opacity-75 font-mono">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold uppercase">
                {result.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">📝 Summary</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            Success: {results.filter((r) => r.status === 'success').length} /
            {results.length}
          </li>
          <li>
            Errors: {results.filter((r) => r.status === 'error').length}
          </li>
          <li>
            Warnings: {results.filter((r) => r.status === 'warning').length}
          </li>
        </ul>
      </div>

      {!isLoading && (
        <button
          onClick={runTests}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          🔄 Retry Tests
        </button>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">💡 Troubleshooting</h4>
        <ul className="space-y-1 text-blue-900">
          <li>• If API Endpoint fails: Check symbolic link setup</li>
          <li>• If Login fails: Seed test data via database/seed.php</li>
          <li>
            • If Students/Classes fail: Import database or check MySQL connection
          </li>
          <li>• All tests failing? Check XAMPP Apache is running</li>
        </ul>
      </div>
    </div>
  );
}

export default ConnectionTest;
