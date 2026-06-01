import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "@/routes";

export default function AppRoot() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
