import {
  ErrorComponent,
  Link,
  rootRouteId,
  useRouter,
  useMatch,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { ErrorBackButton } from "~/components/ui/BackButton";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            router.invalidate();
          }}
          className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
        >
          Try Again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Home
          </Link>
        ) : (
          <ErrorBackButton />
        )}
      </div>
    </div>
  );
}
