import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { runQueries, shoeQueries } from "~/queries";
import { Loader } from "~/components/Loader";
import { withAuth } from "~/components/AuthProvider";
import {
  formatDistance,
  formatDuration,
  RUN_TYPE_OPTIONS,
  RUN_SURFACE_OPTIONS,
  RUN_EFFORT_OPTIONS,
} from "~/types";

export const Route = createFileRoute("/runs/$runId")({
  component: withAuth(RunDetail),
  pendingComponent: () => <Loader />,
});

function RunDetail() {
  const { runId } = Route.useParams();
  const runQuery = useSuspenseQuery(runQueries.detail(runId));
  const shoesQuery = useSuspenseQuery(shoeQueries.list());

  const run = runQuery.data;
  const shoes = shoesQuery.data;
  const shoe = shoes.find((s) => s.id === run.shoeId);

  const runTypeLabel =
    RUN_TYPE_OPTIONS.find((opt) => opt.value === run.runType)?.label ||
    run.runType;
  const surfaceLabel =
    RUN_SURFACE_OPTIONS.find((opt) => opt.value === run.surface)?.label ||
    run.surface;
  const effortLabel =
    RUN_EFFORT_OPTIONS.find((opt) => opt.value === run.effort)?.label ||
    run.effort;

  return (
    <div className="p-2 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Run Details</h1>
          <p className="text-gray-600 mt-1">
            {new Date(run.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/runs/$runId/edit"
            params={{ runId }}
            search={{ modal: false }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Edit Run
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="text-3xl font-bold text-blue-600">
            {formatDistance(run.distance)}
          </div>
          <div className="text-sm text-gray-500">Distance</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="text-3xl font-bold text-green-600">
            {run.duration ? formatDuration(run.duration) : "—"}
          </div>
          <div className="text-sm text-gray-500">Duration</div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="text-3xl font-bold text-purple-600">
            {run.pace || "—"}
          </div>
          <div className="text-sm text-gray-500">Pace per mile</div>
        </div>
      </div>

      {/* Run Details */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Run Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Shoe:</span>
              {shoe ? (
                <Link
                  to="/shoes/$shoeId"
                  params={{ shoeId: shoe.id }}
                  className="ml-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {shoe.name} ({shoe.brand} {shoe.model})
                </Link>
              ) : (
                <span className="ml-2 text-sm text-gray-900">Unknown shoe</span>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                Run Type:
              </span>
              <span className="ml-2 text-sm text-gray-900 capitalize">
                {runTypeLabel}
              </span>
            </div>
            {run.surface && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Surface:
                </span>
                <span className="ml-2 text-sm text-gray-900 capitalize">
                  {surfaceLabel}
                </span>
              </div>
            )}
            {run.effort && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Effort Level:
                </span>
                <span
                  className={`ml-2 text-sm font-medium capitalize ${
                    run.effort === "easy"
                      ? "text-green-600"
                      : run.effort === "moderate"
                        ? "text-yellow-600"
                        : run.effort === "hard"
                          ? "text-orange-600"
                          : "text-red-600"
                  }`}
                >
                  {effortLabel}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {run.route && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Route:
                </span>
                <span className="ml-2 text-sm text-gray-900">{run.route}</span>
              </div>
            )}
            {run.weather && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Weather:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {run.weather}
                </span>
              </div>
            )}
            {run.temperature !== undefined && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Temperature:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {run.temperature}°F
                </span>
              </div>
            )}
            {run.elevation !== undefined && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Elevation Gain:
                </span>
                <span className="ml-2 text-sm text-gray-900">
                  {run.elevation} ft
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {(run.heartRate || run.calories) && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {run.heartRate && (
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {run.heartRate}
                  </div>
                  <div className="text-sm text-gray-500">
                    Average Heart Rate (bpm)
                  </div>
                </div>
              </div>
            )}
            {run.calories && (
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {run.calories}
                  </div>
                  <div className="text-sm text-gray-500">Calories Burned</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {run.notes && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{run.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center">
        <Link
          to="/runs"
          search={{ modal: false }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Back to All Runs
        </Link>
      </div>
    </div>
  );
}
