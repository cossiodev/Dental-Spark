import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import SidebarLayout from "@/components/layout/SidebarLayout";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetails from "@/pages/PatientDetails";
import Appointments from "@/pages/Appointments";
import Treatments from "@/pages/Treatments";
import Odontogram from "@/pages/Odontogram";
import Billing from "@/pages/Billing";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Communication from "@/pages/Communication";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Fixed: Properly wrap the entire app with TooltipProvider */}
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route
          path="/"
          element={
            <SidebarLayout>
              <Dashboard />
            </SidebarLayout>
          }
        />
        <Route
          path="/patients"
          element={
            <SidebarLayout>
              <Patients />
            </SidebarLayout>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <SidebarLayout>
              <PatientDetails />
            </SidebarLayout>
          }
        />
        <Route
          path="/appointments"
          element={
            <SidebarLayout>
              <Appointments />
            </SidebarLayout>
          }
        />
        <Route
          path="/treatments"
          element={
            <SidebarLayout>
              <Treatments />
            </SidebarLayout>
          }
        />
        <Route
          path="/odontogram"
          element={
            <SidebarLayout>
              <Odontogram />
            </SidebarLayout>
          }
        />
        <Route
          path="/billing"
          element={
            <SidebarLayout>
              <Billing />
            </SidebarLayout>
          }
        />
        <Route
          path="/inventory"
          element={
            <SidebarLayout>
              <Inventory />
            </SidebarLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <SidebarLayout>
              <Reports />
            </SidebarLayout>
          }
        />
        <Route
          path="/communication"
          element={
            <SidebarLayout>
              <Communication />
            </SidebarLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <SidebarLayout>
              <Settings />
            </SidebarLayout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
