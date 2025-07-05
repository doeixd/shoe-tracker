import { createFileRoute } from '@tanstack/react-router';
import { withAuth } from '~/components/AuthProvider';
import Phase3OfflineDemo from '~/components/Phase3OfflineDemo';

export const Route = createFileRoute('/phase3-demo')({
  component: withAuth(Phase3DemoPage),
});

function Phase3DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Phase3OfflineDemo />
      </div>
    </div>
  );
}
