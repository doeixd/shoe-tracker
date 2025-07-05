import { createFileRoute } from '@tanstack/react-router';
import { useConvex } from 'convex/react';
import { useConvexOffline } from '../hooks/useConvexOffline';
import { useState } from 'react';

export const Route = createFileRoute('/test-phase3')({
  component: TestPhase3,
});

function TestPhase3() {
  const convexClient = useConvex();
  const {
    isOnline,
    isConnected,
    connectionState,
    queueStatus,
    queueOperation,
    manualSync,
    clearQueue,
  } = useConvexOffline(convexClient);

  const [testResult, setTestResult] = useState<string>('');

  const runOfflineTest = () => {
    try {
      // Test queuing an operation
      const success = queueOperation(
        'mutation',
        'api.shoes.testOperation',
        { test: 'data', timestamp: Date.now() },
        75
      );

      if (success) {
        setTestResult('✅ Successfully queued offline operation');
      } else {
        setTestResult('❌ Failed to queue offline operation');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const runSyncTest = async () => {
    try {
      setTestResult('🔄 Starting sync test...');
      const result = await manualSync();
      setTestResult(result ? '✅ Sync completed successfully' : '❌ Sync failed');
    } catch (error) {
      setTestResult(`❌ Sync error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Phase 3: Offline & Sync Test
        </h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Browser: {isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Convex: {isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionState.state === 'connected' ? 'bg-green-500' :
                connectionState.state === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span>State: {connectionState.state}</span>
            </div>
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Offline Queue</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{queueStatus.immediate}</div>
              <div className="text-sm text-red-700">Immediate</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{queueStatus.background}</div>
              <div className="text-sm text-yellow-700">Background</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{queueStatus.deferred}</div>
              <div className="text-sm text-blue-700">Deferred</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{queueStatus.total}</div>
              <div className="text-sm text-gray-700">Total</div>
            </div>
          </div>

          {queueStatus.syncInProgress && (
            <div className="text-center text-blue-600 font-medium">
              🔄 Sync in progress...
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={runOfflineTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Queue Operation
            </button>
            <button
              onClick={runSyncTest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={queueStatus.total === 0}
            >
              Test Manual Sync
            </button>
            <button
              onClick={clearQueue}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={queueStatus.total === 0}
            >
              Clear Queue
            </button>
          </div>

          {testResult && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-mono text-sm">{testResult}</div>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Phase 3 Features</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              ConvexOfflineManager with intelligent sync prioritization
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Real-time connection state monitoring
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Offline operation queuing with priority-based categorization
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Service worker integration for request interception
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Conflict-free offline operations with automatic resolution
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Intelligent cache optimization based on user behavior
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Background sync with exponential backoff retry logic
            </li>
          </ul>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Click "Test Queue Operation" to add a test operation to the offline queue</li>
            <li>Try turning off your network or simulating offline mode</li>
            <li>Queue more operations while offline</li>
            <li>Turn network back on and click "Test Manual Sync" to sync queued operations</li>
            <li>Watch the queue status update in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
