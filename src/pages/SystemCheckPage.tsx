import React from 'react';
import ConnectionTest from '../components/ConnectionTest';
import Layout from '../components/Layout';

export function SystemCheckPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🔧 System Check
            </h1>
            <p className="text-gray-600 text-lg">
              Verify your backend and frontend connection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Frontend Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">🖥️</span>Frontend
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-green-600">✓ Running</span>
                </div>
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="font-mono">5173</span>
                </div>
                <div className="flex justify-between">
                  <span>Framework:</span>
                  <span className="font-mono">React + Vite</span>
                </div>
                <div className="flex justify-between">
                  <span>TypeScript:</span>
                  <span className="font-semibold text-green-600">✓ Enabled</span>
                </div>
              </div>
            </div>

            {/* Backend Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">⚙️</span>Backend
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Framework:</span>
                  <span className="font-mono">PHP 7.4+</span>
                </div>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="font-mono">MySQL 5.7+</span>
                </div>
                <div className="flex justify-between">
                  <span>Port:</span>
                  <span className="font-mono">3306</span>
                </div>
                <div className="flex justify-between">
                  <span>API Base:</span>
                  <span className="font-mono">/api-proxy</span>
                </div>
              </div>
            </div>
          </div>

          {/* API Connection Test */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <ConnectionTest />
          </div>

          {/* Environment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">📋</span>Environment Variables
              </h2>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm space-y-2">
                <div>
                  <span className="text-blue-600">API_BASE</span>
                  <span className="text-gray-400">=</span>
                  <span className="text-green-600">'/api-proxy'</span>
                </div>
                <div>
                  <span className="text-blue-600">NODE_ENV</span>
                  <span className="text-gray-400">=</span>
                  <span className="text-green-600">development</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="text-2xl mr-2">🔗</span>Quick Links
              </h2>
              <div className="space-y-2">
                <a
                  href="http://localhost/phpmyadmin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-blue-50 hover:bg-blue-100 p-3 rounded text-blue-700 font-semibold"
                >
                  📊 phpMyAdmin
                </a>
                <a
                  href="http://localhost/drl2/backend/check.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-purple-50 hover:bg-purple-100 p-3 rounded text-purple-700 font-semibold"
                >
                  🔍 Backend Health Check
                </a>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="text-2xl mr-2">📚</span>Setup Instructions
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Create symbolic link:{' '}
                <code className="bg-gray-200 px-2 py-1 rounded">
                  mklink /D api-proxy backend\api
                </code>
              </li>
              <li>
                Import database:{' '}
                <code className="bg-gray-200 px-2 py-1 rounded">
                  mysql -u root -p &lt; backend\database.sql
                </code>
              </li>
              <li>
                Seed test data: Visit{' '}
                <code className="bg-gray-200 px-2 py-1 rounded">
                  /backend/seed.php
                </code>
              </li>
              <li>Start frontend: npm run dev</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default SystemCheckPage;
