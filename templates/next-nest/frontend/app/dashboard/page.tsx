import DashboardContent from "../components/dashboard/DashboardContent";
import SideNaVWrapper from "../components/dashboard/SideNaVWrapper";

function DashboardPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#FAF7F2] text-[#1C1917] lg:flex-row">
      <SideNaVWrapper />
      <DashboardContent />
    </div>
  );
}

export default DashboardPage;
