import {
    ReactElement,
  } from "react";
import classNames from "classnames";
import Header from "../components/Header";
import SettingsModal from "../components/Settings/SettingsModal";

type AnalyticsLayoutProps = {
    children: ReactElement;
};

const AnalyticsLayout = ({ children } : AnalyticsLayoutProps) => {
    return (
      <div className="relative flex h-full w-full" id="analytics">
        <div className="relative flex-1">
          <main className="flex flex-col flex-1 h-full overflow-auto z-10">
            <Header
              isSidebarOpen={false}
              toggleSidebar={() => {}}
              sidebarControl={false}
            />
            <div className="flex flex-1 justify-center px-2 dark:bg-[#171717]">
              <div className="w-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </div>
            </div>
          </main>
          <div
            className={classNames("absolute inset-0 mt-14 z-[-1]")}
          />
        </div>

        <SettingsModal />
        
      </div>
    );
  };

  export default AnalyticsLayout;