import { useAuth } from "./hooks/useAuth";
import { useCloudSync } from "./hooks/useCloudSync";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { Sidebar } from "./components/sidebar/Sidebar";
import { CVPreview } from "./components/cv/CVPreview";
import { ToastContainer } from "./components/ui/Toast";

function AppLayout() {
  const { user } = useAuth();
  useCloudSync(user);

  return (
    <div dir="rtl" className="flex h-screen overflow-hidden bg-gray-200">
      <div className="order-2 h-full">
        <Sidebar user={user} />
      </div>
      <div className="order-1 flex-1 overflow-y-auto">
        <CVPreview />
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;