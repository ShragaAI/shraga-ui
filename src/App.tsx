import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import classNames from "classnames";

import AppProvider, { useAppContext } from "./contexts/AppContext";
import { useAuthContext } from "./contexts/AuthContext";
import { useThemeContext } from "./contexts/ThemeContext";
import ChatProvider, { useChatContext } from "./contexts/ChatContext";
import { usePageAccess } from "./hooks/usePageAccess";

import AnalyticsLayout from "./layouts/AnalyticsLayout";
import Analytics from "./components/Analytics/Analytics";
import ChatInput from "./components/Chat/ChatInput";
import Header from "./components/Header";
import Login from "./components/Login";
import SessionModal from "./components/SessionEditor/SessionEditorModal";
import SettingsModal from "./components/Settings/SettingsModal";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/Base/LoadingScreen";
import { CreateRootConfig } from "./CreateRoot";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredAccess?: string[];
}

interface AppProps {
  customChatComponent?: React.ComponentType;
  config?: CreateRootConfig;
}

const Layout = () => {
  const { configs, customConfig, isSidebarOpen, toggleSidebar } = useAppContext();
  const { ChatComponent } = useChatContext();
  const { chatBackground, theme } = useThemeContext(); 

  const defaultFlow = configs?.default_flow;
  const sessionModal = configs?.list_flows || (Array.isArray(defaultFlow) && defaultFlow.length > 1) ? <SessionModal /> : null;

  if (!configs) {
    return <LoadingScreen logo={customConfig?.logo} />;
  }

  return (
    <div className="relative flex h-full w-full" id="main">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="relative flex-1">
        <main className="flex flex-col flex-1 h-full overflow-auto z-10">
          <Header
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
          <div className="flex flex-1 justify-center px-2">
            <div className="w-full flex flex-col max-w-[768px]">
              <div className="flex-1 overflow-auto">
                <ChatComponent />
              </div>
              <ChatInput />
            </div>
          </div>
        </main>
        <div
          className={classNames("absolute inset-0 mt-14 z-[-1]", {
            "bg-cover bg-center": !!chatBackground,
          })}
          style={{
            backgroundImage: chatBackground
              ? `url(${chatBackground})`
              : undefined,
            filter: theme === "dark" ? "invert(1)" : undefined,
          }}
        />
      </div>

      {sessionModal}
      <SettingsModal />
    </div>
  );
};

function AppContent({ customChatComponent, config }: AppProps) {
  const { isLoading, user } = useAuthContext();

  if (isLoading) {
    return <LoadingScreen logo={config?.logo} />;
  }

  if (!user) {
    const router = createBrowserRouter([
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "*",
        element: <Navigate to="/login" />,
      },
    ]);

    return <RouterProvider router={router} />;
  }

  const CheckAccess = ({ children, requiredAccess }: ProtectedRouteProps) => {
    const { hasAccess } = usePageAccess();
  
    if (requiredAccess && !requiredAccess.every((access) => hasAccess[access as keyof typeof hasAccess])) {
      return <Navigate to="/" />;
    }
  
    return (
      <ChatProvider customChatComponent={customChatComponent}>
        {children}
      </ChatProvider>
    );
  };

  const Protected = ({ children, requiredAccess }: ProtectedRouteProps) => (
    <AppProvider config={config}>
      <CheckAccess requiredAccess={requiredAccess}>
        {children}
      </CheckAccess>
    </AppProvider>
  );

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Protected>
          <Layout />
        </Protected>
      ),
    },
    {
      path: "/analytics",
      element: (
        <Protected requiredAccess={["analytics"]}>
          <AnalyticsLayout>
            <Analytics />
          </AnalyticsLayout>
        </Protected>
      ),
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "*",
      element: <Navigate to="/login" />,
    },
  ]);

  return <RouterProvider router={router} />;
}

function App(props: AppProps) {
  return (
    <div className="h-full w-full">
      <AppContent {...props} />
    </div>
  );
}

export default App;
