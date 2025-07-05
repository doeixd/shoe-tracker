import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { useAuth } from '~/components/AuthProvider';

export const Route = createFileRoute('/test-onboarding')({
  component: TestOnboarding,
});

function TestOnboarding() {
  const { user, isAuthenticated } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const createCollectionMutation = useConvexMutation(api.shoes.createCollection);
  const createShoeMutation = useConvexMutation(api.shoes.createShoe);

  const testCreateCollection = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in first");
      return;
    }

    setIsCreating(true);
    setTestResult('Creating test collection...');

    try {
      const testCollection = {
        name: "Test Collection",
        description: "A test collection",
        color: "#3b82f6",
      };

      console.log("About to create collection:", testCollection);
      const collectionId = await createCollectionMutation(testCollection);
      console.log("Collection created with ID:", collectionId);

      setTestResult(`✅ Collection created successfully with ID: ${collectionId}`);
      toast.success("Test collection created!");

      // Now test creating a shoe
      setTimeout(async () => {
        try {
          const testShoe = {
            name: "Test Shoe",
            brand: "Test Brand",
            model: "Test Model",
            collectionId: collectionId,
            maxMileage: 500,
            purchaseDate: new Date().toISOString().split("T")[0],
            size: "10",
            notes: "Test shoe for debugging",
          };

          console.log("About to create shoe:", testShoe);
          const shoeId = await createShoeMutation(testShoe);
          console.log("Shoe created with ID:", shoeId);

          setTestResult(prev => prev + `\n✅ Shoe created successfully with ID: ${shoeId}`);
          toast.success("Test shoe created!");
        } catch (shoeError) {
          console.error("Shoe creation error:", shoeError);
          setTestResult(prev => prev + `\n❌ Shoe creation failed: ${shoeError}`);
          toast.error("Shoe creation failed");
        }
      }, 1000);

    } catch (error) {
      console.error("Collection creation error:", error);
      setTestResult(`❌ Collection creation failed: ${error}`);
      toast.error("Collection creation failed");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Onboarding Test
        </h1>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
            </div>
            {user && (
              <div>
                <span className="text-gray-600">User: {user.email || user.id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Mutations</h2>
          <button
            onClick={testCreateCollection}
            disabled={isCreating || !isAuthenticated}
            className={`px-6 py-3 rounded-lg font-medium ${
              isCreating || !isAuthenticated
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCreating ? 'Creating...' : 'Test Create Collection & Shoe'}
          </button>

          {!isAuthenticated && (
            <p className="mt-2 text-red-600 text-sm">
              Please sign in to test mutations
            </p>
          )}
        </div>

        {/* Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
              {testResult}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Make sure you're signed in (should show "Authenticated" above)</li>
            <li>Click "Test Create Collection & Shoe" button</li>
            <li>Check the browser console for detailed logs</li>
            <li>Watch for success/error messages</li>
            <li>Results will appear in the "Test Results" section</li>
          </ol>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Debug Info:</h3>
          <div className="text-sm space-y-1 font-mono">
            <div>Authentication: {String(isAuthenticated)}</div>
            <div>User ID: {user?.id || 'null'}</div>
            <div>Creating: {String(isCreating)}</div>
            <div>Current Time: {new Date().toISOString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
