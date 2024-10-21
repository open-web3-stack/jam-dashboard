import TelemetryDashboard from "@/components/telemetry-dashboard";

export default function Home() {
  return (
    <div className="container my-2 flex flex-col gap-8 items-center sm:items-start">
      <TelemetryDashboard />
    </div>
  );
}
